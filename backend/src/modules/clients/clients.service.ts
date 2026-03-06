import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, EstadoCliente } from './client.entity';
import { UserRole } from '../users/user.entity';

export class CreateClientDto {
  nombre: string;
  apellido: string;
  ci?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  razonSocial?: string;
  rut?: string;
  tipoEmpresa?: string;
  giro?: string;
  fechaInicioActividades?: string;
  contribuyenteIva?: boolean;
  liquidaIrae?: boolean;
  irpfCat1?: boolean;
  irpfCat2?: boolean;
  empleadorBps?: boolean;
  fonasa?: boolean;
  cjppu?: boolean;
  fondoSolidaridad?: boolean;
  notas?: string;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

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
    const client = this.clientRepo.create({ ...dto, contadorId });
    return this.clientRepo.save(client);
  }

  async update(id: string, dto: Partial<CreateClientDto>, userId: string, userRole: UserRole): Promise<Client> {
    const client = await this.findOne(id, userId, userRole);
    Object.assign(client, dto);
    return this.clientRepo.save(client);
  }

  async deactivate(id: string, userId: string, userRole: UserRole): Promise<Client> {
    const client = await this.findOne(id, userId, userRole);
    client.estado = EstadoCliente.INACTIVO;
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
