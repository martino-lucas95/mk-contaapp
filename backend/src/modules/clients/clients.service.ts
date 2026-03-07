import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { Client, EstadoCliente, TipoEmpresa } from './client.entity';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';

export class CreateClientUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreateClientDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsOptional() @IsString()
  ci?: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsString()
  razonSocial?: string;

  @IsOptional() @IsString()
  rut?: string;

  @IsOptional() @IsString()
  tipoEmpresa?: string;

  @IsOptional() @IsString()
  giro?: string;

  @IsOptional() @IsString()
  fechaInicioActividades?: string;

  @IsOptional() @IsBoolean()
  contribuyenteIva?: boolean;

  @IsOptional() @IsBoolean()
  liquidaIrae?: boolean;

  @IsOptional() @IsBoolean()
  irpfCat1?: boolean;

  @IsOptional() @IsBoolean()
  irpfCat2?: boolean;

  @IsOptional() @IsBoolean()
  empleadorBps?: boolean;

  @IsOptional() @IsBoolean()
  fonasa?: boolean;

  @IsOptional() @IsBoolean()
  cjppu?: boolean;

  @IsOptional() @IsBoolean()
  fondoSolidaridad?: boolean;

  @IsOptional() @IsString()
  notas?: string;
}

function parseTipoEmpresa(value?: string): TipoEmpresa | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  const allowed = new Set<string>(Object.values(TipoEmpresa));
  return allowed.has(normalized) ? (normalized as TipoEmpresa) : undefined;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    private usersService: UsersService,
  ) { }

  async findAll(userId: string, userRole: UserRole): Promise<Client[]> {
    const query = this.clientRepo.createQueryBuilder('client')
      .leftJoinAndSelect('client.contador', 'contador');

    // El contador solo ve sus propios clientes
    if (userRole === UserRole.CONTADOR) {
      query.where('client.contador_id = :userId', { userId });
    }

    // El cliente solo se ve a sí mismo
    if (userRole === UserRole.CLIENTE) {
      query.where('client.usuario_cliente_id = :userId', { userId });
    }

    return query.orderBy('client.apellido', 'ASC').getMany();
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Client> {
    const client = await this.clientRepo.findOne({
      where: { id },
      relations: ['contador'],
    });

    if (!client) throw new NotFoundException('Cliente no encontrado');

    this.checkAccess(client, userId, userRole);
    return client;
  }

  async create(dto: CreateClientDto, contadorId: string): Promise<Client> {
    const nombre = (dto.nombre?.trim?.() || dto.razonSocial?.trim?.() || 'Sin nombre').slice(0, 100);
    const apellido = (dto.apellido?.trim?.() || '-').slice(0, 100);
    const client = this.clientRepo.create({
      ...dto,
      nombre,
      apellido,
      contadorId,
      tipoEmpresa: parseTipoEmpresa(dto.tipoEmpresa) ?? null,
      fechaInicioActividades: dto.fechaInicioActividades
        ? new Date(dto.fechaInicioActividades)
        : null,
    });
    return this.clientRepo.save(client);
  }

  async update(id: string, dto: Partial<CreateClientDto>, userId: string, userRole: UserRole): Promise<Client> {
    const client = await this.findOne(id, userId, userRole);
    Object.assign(client, dto);
    if (dto.tipoEmpresa !== undefined) client.tipoEmpresa = parseTipoEmpresa(dto.tipoEmpresa) ?? null;
    if (dto.fechaInicioActividades !== undefined) {
      client.fechaInicioActividades = dto.fechaInicioActividades
        ? new Date(dto.fechaInicioActividades)
        : null;
    }
    return this.clientRepo.save(client);
  }

  async deactivate(id: string, userId: string, userRole: UserRole): Promise<Client> {
    const client = await this.findOne(id, userId, userRole);
    client.estado = EstadoCliente.INACTIVO;
    return this.clientRepo.save(client);
  }

  async createUserForClient(id: string, dto: CreateClientUserDto, userId: string, userRole: UserRole): Promise<Client> {
    const client = await this.findOne(id, userId, userRole);
    if (client.usuarioClienteId) {
      throw new ConflictException('El cliente ya tiene un usuario asignado');
    }
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      nombre: client.nombre,
      apellido: client.apellido,
      role: UserRole.CLIENTE,
    });
    client.usuarioClienteId = user.id;
    return this.clientRepo.save(client);
  }

  private checkAccess(client: Client, userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN) return;
    if (userRole === UserRole.CONTADOR && client.contadorId !== userId) {
      throw new ForbiddenException('No tenés acceso a este cliente');
    }
    if (userRole === UserRole.CLIENTE && client.usuarioClienteId !== userId) {
      throw new ForbiddenException('No tenés acceso a este cliente');
    }
  }
}
