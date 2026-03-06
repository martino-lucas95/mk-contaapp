import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Vencimiento, EstadoVencimiento, TipoVencimiento } from './vencimiento.entity';
import { Client } from '../clients/client.entity';
import { generarVencimientosAnuales, generarVencimientosPorPeriodo } from './uy-tax-calendar';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Vencimiento) private vencRepo:   Repository<Vencimiento>,
    @InjectRepository(Client)      private clientRepo: Repository<Client>,
  ) {}

  // ── Obtener vencimientos de un cliente ─────────────────────────────────────
  async findByClient(clientId: string): Promise<Vencimiento[]> {
    return this.vencRepo.find({
      where: { clientId },
      order: { fechaVencimiento: 'ASC' },
    });
  }

  // ── Próximos vencimientos de todos los clientes del contador ───────────────
  async findProximos(contadorId: string, dias: number = 30): Promise<Vencimiento[]> {
    const hoy   = new Date();
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + dias);

    return this.vencRepo
      .createQueryBuilder('v')
      .leftJoin('v.client', 'c')
      .where('c.contador_id = :contadorId', { contadorId })
      .andWhere('v.fechaVencimiento BETWEEN :hoy AND :hasta', {
        hoy:   hoy.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
      })
      .andWhere('v.estado != :completado', { completado: EstadoVencimiento.COMPLETADO })
      .orderBy('v.fechaVencimiento', 'ASC')
      .leftJoinAndSelect('v.client', 'client')
      .getMany();
  }

  // ── Generar vencimientos para un cliente (un año completo) ─────────────────
  async generarParaCliente(clientId: string, year?: number): Promise<Vencimiento[]> {
    const client = await this.clientRepo.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (!client.rut)  throw new NotFoundException('El cliente no tiene RUT registrado');

    const yearTarget = year ?? new Date().getFullYear();

    // Eliminar vencimientos automáticos existentes para ese año y cliente
    await this.vencRepo
      .createQueryBuilder()
      .delete()
      .from(Vencimiento)
      .where('client_id = :clientId', { clientId })
      .andWhere('es_personalizado = false')
      .andWhere("periodo LIKE :year", { year: `${yearTarget}%` })
      .execute();

    // Generar nuevos
    const generados = generarVencimientosAnuales(client.rut, client, yearTarget);

    const entidades = generados.map((v) =>
      this.vencRepo.create({ ...v, clientId }),
    );

    return this.vencRepo.save(entidades);
  }

  // ── Regenerar para TODOS los clientes de un contador ──────────────────────
  async generarParaTodosLosClientes(contadorId: string, year?: number): Promise<{ clienteId: string; cantidad: number }[]> {
    const clientes = await this.clientRepo.find({ where: { contadorId } });
    const resultados = [];

    for (const cliente of clientes) {
      if (!cliente.rut) continue;
      const venc = await this.generarParaCliente(cliente.id, year);
      resultados.push({ clienteId: cliente.id, cantidad: venc.length });
    }

    return resultados;
  }

  // ── Marcar como completado ─────────────────────────────────────────────────
  async completar(id: string): Promise<Vencimiento> {
    const v = await this.vencRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vencimiento no encontrado');
    v.estado = EstadoVencimiento.COMPLETADO;
    return this.vencRepo.save(v);
  }

  // ── Agregar vencimiento personalizado ─────────────────────────────────────
  async crearPersonalizado(clientId: string, dto: {
    tipo: TipoVencimiento;
    descripcion: string;
    fechaVencimiento: string;
    periodo?: string;
    notas?: string;
  }): Promise<Vencimiento> {
    const v = this.vencRepo.create({
      ...dto,
      clientId,
      esPersonalizado: true,
      estado: EstadoVencimiento.PENDIENTE,
    });
    return this.vencRepo.save(v);
  }

  // ── Preview sin persistir (útil para mostrar en front antes de confirmar) ──
  async previewParaCliente(clientId: string, year?: number): Promise<ReturnType<typeof generarVencimientosAnuales>> {
    const client = await this.clientRepo.findOne({ where: { id: clientId } });
    if (!client || !client.rut) throw new NotFoundException('Cliente o RUT no encontrado');
    return generarVencimientosAnuales(client.rut, client, year ?? new Date().getFullYear());
  }
}
