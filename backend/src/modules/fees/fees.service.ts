import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Honorario, EstadoHonorario, FormaPago } from './honorario.entity';

export interface CreateHonorarioDto {
  periodo: string;           // "YYYY-MM"
  montoAcordado: number;
  montoCobrado?: number;
  fechaCobro?: string;
  formaPago?: FormaPago;
  notas?: string;
}

export interface ResumenHonorarios {
  totalAcordado: number;
  totalCobrado: number;
  totalPendiente: number;
  clientesConDeuda: number;
}

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(Honorario) private honorarioRepo: Repository<Honorario>,
  ) {}

  async findByClient(clientId: string): Promise<Honorario[]> {
    return this.honorarioRepo.find({
      where: { clientId },
      order: { periodo: 'DESC' },
    });
  }

  async findByPeriodo(clientId: string, periodo: string): Promise<Honorario | null> {
    return this.honorarioRepo.findOne({ where: { clientId, periodo } });
  }

  async create(clientId: string, dto: CreateHonorarioDto): Promise<Honorario> {
    const montoCobrado = dto.montoCobrado ?? 0;
    const h = this.honorarioRepo.create({
      clientId,
      periodo:       dto.periodo,
      montoAcordado: dto.montoAcordado,
      montoCobrado,
      fechaCobro:    dto.fechaCobro ? new Date(dto.fechaCobro) : undefined,
      formaPago:     dto.formaPago,
      notas:         dto.notas,
      estado:        montoCobrado >= dto.montoAcordado
                       ? EstadoHonorario.AL_DIA
                       : EstadoHonorario.PENDIENTE,
    });
    return this.honorarioRepo.save(h);
  }

  /** Registrar un pago parcial o total */
  async registrarPago(id: string, dto: {
    montoCobrado: number;
    fechaCobro: string;
    formaPago: FormaPago;
    notas?: string;
  }): Promise<Honorario> {
    const h = await this.honorarioRepo.findOne({ where: { id } });
    if (!h) throw new NotFoundException('Honorario no encontrado');

    h.montoCobrado = dto.montoCobrado;
    h.fechaCobro   = new Date(dto.fechaCobro);
    h.formaPago    = dto.formaPago;
    if (dto.notas) h.notas = dto.notas;

    // Actualizar estado automáticamente
    if (h.montoCobrado >= h.montoAcordado) {
      h.estado = EstadoHonorario.AL_DIA;
    } else if (h.montoCobrado > 0) {
      h.estado = EstadoHonorario.PENDIENTE;
    }

    return this.honorarioRepo.save(h);
  }

  /** Marcar como vencido (se puede correr via cron diario) */
  async marcarVencidos(diasGracia: number = 30): Promise<number> {
    const corte = new Date();
    corte.setDate(corte.getDate() - diasGracia);
    const periodoCorte = corte.toISOString().slice(0, 7); // "YYYY-MM"

    const result = await this.honorarioRepo
      .createQueryBuilder()
      .update(Honorario)
      .set({ estado: EstadoHonorario.VENCIDO })
      .where('estado = :pendiente', { pendiente: EstadoHonorario.PENDIENTE })
      .andWhere('periodo <= :corte', { corte: periodoCorte })
      .execute();

    return result.affected ?? 0;
  }

  /** Resumen global de honorarios para el dashboard del contador */
  async resumenPorContador(contadorId: string, periodo?: string): Promise<ResumenHonorarios> {
    const qb = this.honorarioRepo
      .createQueryBuilder('h')
      .leftJoin('h.client', 'c')
      .where('c.contador_id = :contadorId', { contadorId });

    if (periodo) qb.andWhere('h.periodo = :periodo', { periodo });

    const rows = await qb.getMany();

    const totalAcordado  = rows.reduce((s, h) => s + Number(h.montoAcordado), 0);
    const totalCobrado   = rows.reduce((s, h) => s + Number(h.montoCobrado),  0);
    const totalPendiente = totalAcordado - totalCobrado;

    const clientesConDeuda = new Set(
      rows.filter(h => h.estado !== EstadoHonorario.AL_DIA).map(h => h.clientId),
    ).size;

    return { totalAcordado, totalCobrado, totalPendiente, clientesConDeuda };
  }

  async update(id: string, dto: Partial<CreateHonorarioDto>): Promise<Honorario> {
    const h = await this.honorarioRepo.findOne({ where: { id } });
    if (!h) throw new NotFoundException('Honorario no encontrado');
    Object.assign(h, dto);
    return this.honorarioRepo.save(h);
  }

  async delete(id: string): Promise<void> {
    await this.honorarioRepo.delete(id);
  }
}
