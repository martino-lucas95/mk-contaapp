import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoletoPago, EstadoBoleto } from './boleto-pago.entity';
import { TipoVencimiento } from '../calendar/vencimiento.entity';

export interface CreateBoletoDto {
  tipoImpuesto: TipoVencimiento;
  periodo: string;
  monto?: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
  notas?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(BoletoPago) private boletoRepo: Repository<BoletoPago>,
  ) {}

  async findByClient(clientId: string): Promise<BoletoPago[]> {
    return this.boletoRepo.find({
      where: { clientId },
      order: { fechaVencimiento: 'DESC' },
    });
  }

  async findPendientesByContador(contadorId: string): Promise<BoletoPago[]> {
    return this.boletoRepo
      .createQueryBuilder('b')
      .leftJoin('b.client', 'c')
      .where('c.contador_id = :contadorId', { contadorId })
      .andWhere('b.estado IN (:...estados)', {
        estados: [EstadoBoleto.EMITIDO, EstadoBoleto.PENDIENTE_EMITIR],
      })
      .leftJoinAndSelect('b.client', 'client')
      .orderBy('b.fechaVencimiento', 'ASC')
      .getMany();
  }

  async create(clientId: string, dto: CreateBoletoDto): Promise<BoletoPago> {
    const boleto = this.boletoRepo.create({
      clientId,
      tipoImpuesto:    dto.tipoImpuesto,
      periodo:         dto.periodo,
      monto:           dto.monto,
      fechaEmision:    dto.fechaEmision     ? new Date(dto.fechaEmision)     : undefined,
      fechaVencimiento:dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
      notas:           dto.notas,
      estado:          EstadoBoleto.EMITIDO,
    });
    return this.boletoRepo.save(boleto);
  }

  /** El cliente confirma que pagó — queda pendiente de validación por el contador */
  async confirmarPago(id: string, confirmadoPorId: string): Promise<BoletoPago> {
    const boleto = await this.boletoRepo.findOne({ where: { id } });
    if (!boleto) throw new NotFoundException('Boleto no encontrado');
    boleto.estado          = EstadoBoleto.PAGADO;
    boleto.fechaPago       = new Date();
    boleto.confirmadoPorId = confirmadoPorId;
    return this.boletoRepo.save(boleto);
  }

  async update(id: string, dto: Partial<CreateBoletoDto>): Promise<BoletoPago> {
    const boleto = await this.boletoRepo.findOne({ where: { id } });
    if (!boleto) throw new NotFoundException('Boleto no encontrado');
    Object.assign(boleto, dto);
    return this.boletoRepo.save(boleto);
  }

  async delete(id: string): Promise<void> {
    await this.boletoRepo.delete(id);
  }

  /** Marcar vencidos los que pasaron la fecha sin pago */
  async marcarVencidos(): Promise<number> {
    const hoy = new Date().toISOString().split('T')[0];
    const result = await this.boletoRepo
      .createQueryBuilder()
      .update(BoletoPago)
      .set({ estado: EstadoBoleto.VENCIDO })
      .where('estado = :emitido', { emitido: EstadoBoleto.EMITIDO })
      .andWhere('fechaVencimiento < :hoy', { hoy })
      .execute();
    return result.affected ?? 0;
  }
}
