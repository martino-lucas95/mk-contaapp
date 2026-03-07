import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from './user.entity';

export interface CreateUserDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.userRepo.find({ select: ['id', 'nombre', 'apellido', 'email', 'role', 'activo', 'createdAt', 'updatedAt'] });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('Ya existe un usuario con ese email');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      ...dto,
      password: hashed,
      role: dto.role ?? UserRole.CONTADOR,
    });
    const saved = await this.userRepo.save(user);
    const { password, ...rest } = saved;
    return rest as Omit<User, 'password'>;
  }

  async update(id: string, dto: Partial<CreateUserDto>): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const { password, ...rest } = saved;
    return rest as Omit<User, 'password'>;
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    user.activo = false;
    await this.userRepo.save(user);
  }

  async ensureAdminExists(): Promise<void> {
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    if (!admin) {
      await this.create({
        nombre: 'Admin',
        apellido: 'ContaApp',
        email: 'admin@contaapp.uy',
        password: 'admin123',
        role: UserRole.ADMIN,
      });
      console.log('[Seed] Admin creado: admin@contaapp.uy / admin123');
    }
  }
}
