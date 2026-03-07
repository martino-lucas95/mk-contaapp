import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Honorario, EstadoHonorario, FormaPago } from './honorario.entity';
import { FeeContract, FeeFrecuencia } from './fee-contract.entity';

export interface CreateFeeContractDto {
  frecuencia: FeeFrecuencia;
  monto: number;
  fechaInicio: string;  // YYYY-MM-DD
  fechaFin?: string;    // YYYY-MM-DD
  notas?: string;
}

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
    @InjectRepository(FeeContract) private contractRepo: Repository<FeeContract>,
  ) { }

  async generarHonorariosPendientes(clientId: string) {
    const contracts = await this.contractRepo.find({ where: { clientId, activo: true } });
    const now = new Date();

    for (const c of contracts) {
      let current = new Date(c.fechaInicio);
      const endLimit = c.fechaFin ? new Date(Math.min(now.getTime(), new Date(c.fechaFin).getTime())) : now;

      // Ensure we always generate for the current month/period or until endLimit
      while (current <= endLimit || current.toISOString().slice(0, 7) === endLimit.toISOString().slice(0, 7)) {
        const periodoStr = current.toISOString().slice(0, 7);

        const exists = await this.honorarioRepo.findOne({ where: { feeContractId: c.id, periodo: periodoStr } });
        if (!exists) {
          await this.honorarioRepo.save(this.honorarioRepo.create({
            clientId,
            feeContractId: c.id,
            periodo: periodoStr,
            montoAcordado: c.monto,
            estado: EstadoHonorario.PENDIENTE
          }));
        }

        if (c.frecuencia === FeeFrecuencia.MENSUAL) {
          current.setMonth(current.getMonth() + 1);
        } else if (c.frecuencia === FeeFrecuencia.ANUAL) {
          current.setFullYear(current.getFullYear() + 1);
        } else if (c.frecuencia === FeeFrecuencia.SEMANAL) {
          current.setDate(current.getDate() + 7);
        } else if (c.frecuencia === FeeFrecuencia.UNICO) {
          break; // solo genera 1 vez
        }
      }
    }
  }

  async findByClient(clientId: string): Promise<Honorario[]> {
    await this.generarHonorariosPendientes(clientId);
    return this.honorarioRepo.find({
      where: { clientId },
      order: { periodo: 'DESC' },
    });
  }

  async getContracts(clientId: string): Promise<FeeContract[]> {
    return this.contractRepo.find({ where: { clientId }, order: { createdAt: 'DESC' } });
  }

  async createContract(clientId: string, dto: CreateFeeContractDto): Promise<FeeContract> {
    const c = this.contractRepo.create({
      clientId,
      frecuencia: dto.frecuencia,
      monto: dto.monto,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
      notas: dto.notas,
      activo: true,
    });
    const saved = await this.contractRepo.save(c);
    await this.generarHonorariosPendientes(clientId); // generate initial fee
    return saved;
  }

  async updateContract(id: string, dto: Partial<CreateFeeContractDto>): Promise<FeeContract> {
    const c = await this.contractRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Contrato no encontrado');
    if (dto.frecuencia) c.frecuencia = dto.frecuencia;
    if (dto.monto) c.monto = dto.monto;
    if (dto.fechaInicio) c.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin !== undefined) c.fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : null as any;
    if (dto.notas !== undefined) c.notas = dto.notas;

    await this.contractRepo.save(c);
    await this.generarHonorariosPendientes(c.clientId);
    return c;
  }

  async deleteContract(id: string): Promise<void> {
    const c = await this.contractRepo.findOne({ where: { id } });
    if (c) {
      c.activo = false;
      await this.contractRepo.save(c);
    }
  }

  async findByPeriodo(clientId: string, periodo: string): Promise<Honorario | null> {
    return this.honorarioRepo.findOne({ where: { clientId, periodo } });
  }

  async create(clientId: string, dto: CreateHonorarioDto): Promise<Honorario> {
    const montoCobrado = dto.montoCobrado ?? 0;
    const h = this.honorarioRepo.create({
      clientId,
      periodo: dto.periodo,
      montoAcordado: dto.montoAcordado,
      montoCobrado,
      fechaCobro: dto.fechaCobro ? new Date(dto.fechaCobro) : undefined,
      formaPago: dto.formaPago,
      notas: dto.notas,
      estado: montoCobrado >= dto.montoAcordado
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
    h.fechaCobro = new Date(dto.fechaCobro);
    h.formaPago = dto.formaPago;
    if (dto.notas) h.notas = dto.notas;

    // Actualizar estado automáticamente
    if (h.montoCobrado >= h.montoAcordado) {
      h.estado = EstadoHonorario.AL_DIA;
    } else if (h.montoCobrado > 0) {
      h.estado = EstadoHonorario.PENDIENTE;
    }

    return this.honorarioRepo.save(h);
  }

  async informarPago(id: string): Promise < Honorario > {
  const h = await this.honorarioRepo.findOne({ where: { id } });
  if(!h) throw new NotFoundException('Honorario no encontrado');
  h.estado = EstadoHonorario.PAGO_INFORMADO;
  return this.honorarioRepo.save(h);
}

  /** Marcar como vencido (se puede correr via cron diario) */
  async marcarVencidos(diasGracia: number = 30): Promise < number > {
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
  async resumenPorContador(contadorId: string, periodo ?: string): Promise < ResumenHonorarios > {
  const qb = this.honorarioRepo
    .createQueryBuilder('h')
    .leftJoin('h.client', 'c')
    .where('c.contador_id = :contadorId', { contadorId });

  if(periodo) qb.andWhere('h.periodo = :periodo', { periodo });

  const rows = await qb.getMany();

  const totalAcordado = rows.reduce((s, h) => s + Number(h.montoAcordado), 0);
  const totalCobrado = rows.reduce((s, h) => s + Number(h.montoCobrado), 0);
  const totalPendiente = totalAcordado - totalCobrado;

  const clientesConDeuda = new Set(
    rows.filter(h => h.estado !== EstadoHonorario.AL_DIA).map(h => h.clientId),
  ).size;

  return { totalAcordado, totalCobrado, totalPendiente, clientesConDeuda };
}

  async update(id: string, dto: Partial<CreateHonorarioDto>): Promise < Honorario > {
  const h = await this.honorarioRepo.findOne({ where: { id } });
  if(!h) throw new NotFoundException('Honorario no encontrado');
  Object.assign(h, dto);
  return this.honorarioRepo.save(h);
}

  async delete (id: string): Promise < void> {
  await this.honorarioRepo.delete(id);
}
}
