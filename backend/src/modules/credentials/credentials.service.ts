import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential, PlataformaCredencial } from './credential.entity';
import { EncryptionService } from '../../common/encryption.service';
import { UserRole } from '../users/user.entity';

export interface CreateCredentialDto {
  plataforma: PlataformaCredencial;
  nombrePlataforma?: string;
  usuario?: string;
  password?: string;       // texto plano — se encripta antes de guardar
  pin?: string;
  url?: string;
  mfa?: boolean;
  notas?: string;
}

export interface CredentialPublicDto {
  id: string;
  clientId: string;
  plataforma: PlataformaCredencial;
  nombrePlataforma?: string;
  usuario?: string;
  pin?: string;
  url?: string;
  mfa?: boolean;
  notas?: string;
  vigente: boolean;
  createdAt: Date;
  updatedAt: Date;
  // password NO se incluye en el listado general
}

export interface CredentialWithPasswordDto extends CredentialPublicDto {
  password: string; // desencriptada, solo cuando se solicita explícitamente
}

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential) private credRepo: Repository<Credential>,
    private encryptionService: EncryptionService,
  ) { }

  // ── Listar credenciales de un cliente (SIN mostrar password) ──────────────
  async findByClient(clientId: string, userRole: UserRole): Promise<CredentialPublicDto[]> {
    this.checkRole(userRole);
    const creds = await this.credRepo.find({
      where: { clientId, vigente: true },
      order: { plataforma: 'ASC' },
    });
    return creds.map(this.toPublicDto);
  }

  // ── Obtener UNA credencial con password desencriptada ─────────────────────
  // Solo para Contador/Admin — requiere confirmación explícita
  async findOneWithPassword(id: string, userRole: UserRole): Promise<CredentialWithPasswordDto> {
    this.checkRole(userRole);
    const cred = await this.credRepo.findOne({ where: { id } });
    if (!cred) throw new NotFoundException('Credencial no encontrada');

    const password = cred.passwordEncriptado
      ? this.encryptionService.decrypt(cred.passwordEncriptado)
      : '';

    return { ...this.toPublicDto(cred), password };
  }

  // ── Crear credencial ───────────────────────────────────────────────────────
  async create(clientId: string, dto: CreateCredentialDto, userRole: UserRole): Promise<CredentialPublicDto> {
    this.checkRole(userRole);

    const passwordEncriptado = dto.password
      ? this.encryptionService.encrypt(dto.password)
      : null;

    const cred = this.credRepo.create({
      clientId,
      plataforma: dto.plataforma,
      nombrePlataforma: dto.nombrePlataforma,
      usuario: dto.usuario,
      passwordEncriptado,
      pin: dto.pin,
      url: dto.url,
      mfa: dto.mfa ?? false,
      notas: dto.notas,
      vigente: true,
    });

    const saved = await this.credRepo.save(cred);
    return this.toPublicDto(saved);
  }

  // ── Actualizar credencial ─────────────────────────────────────────────────
  async update(id: string, dto: Partial<CreateCredentialDto>, userRole: UserRole): Promise<CredentialPublicDto> {
    this.checkRole(userRole);
    const cred = await this.credRepo.findOne({ where: { id } });
    if (!cred) throw new NotFoundException('Credencial no encontrada');

    if (dto.password !== undefined) {
      cred.passwordEncriptado = dto.password
        ? this.encryptionService.encrypt(dto.password)
        : null;
    }
    if (dto.usuario !== undefined) cred.usuario = dto.usuario;
    if (dto.pin !== undefined) cred.pin = dto.pin;
    if (dto.url !== undefined) cred.url = dto.url;
    if (dto.mfa !== undefined) cred.mfa = dto.mfa;
    if (dto.notas !== undefined) cred.notas = dto.notas;
    if (dto.nombrePlataforma !== undefined) cred.nombrePlataforma = dto.nombrePlataforma;
    if (dto.plataforma !== undefined) cred.plataforma = dto.plataforma;

    const saved = await this.credRepo.save(cred);
    return this.toPublicDto(saved);
  }

  // ── Desactivar (soft delete) ───────────────────────────────────────────────
  async deactivate(id: string, userRole: UserRole): Promise<void> {
    this.checkRole(userRole);
    const cred = await this.credRepo.findOne({ where: { id } });
    if (!cred) throw new NotFoundException('Credencial no encontrada');
    cred.vigente = false;
    await this.credRepo.save(cred);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private checkRole(role: UserRole) {
    if (role === UserRole.CLIENTE) {
      throw new ForbiddenException('Los clientes no tienen acceso a las credenciales');
    }
  }

  private toPublicDto(cred: Credential): CredentialPublicDto {
    return {
      id: cred.id,
      clientId: cred.clientId,
      plataforma: cred.plataforma,
      nombrePlataforma: cred.nombrePlataforma,
      usuario: cred.usuario,
      pin: cred.pin,
      url: cred.url,
      mfa: cred.mfa,
      notas: cred.notas,
      vigente: cred.vigente,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    };
  }
}
