import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Movimiento, TipoMovimiento, CategoriaGasto } from './movimiento.entity';

export interface CreateMovimientoDto {
  tipo: TipoMovimiento;
  fecha: string;
  descripcion?: string;
  monto: number;
  ivaIncluido?: boolean;
  tasaIva?: number;
  categoria?: CategoriaGasto;
  nroComprobante?: string;
  adjuntoUrl?: string;
  notas?: string;
}

export interface ResumenMensual {
  periodo: string;
  totalVentas: number;
  totalCompras: number;
  totalGastos: number;
  debitoIva: number;        // IVA en ventas
  creditoIva: number;       // IVA en compras
  saldoIva: number;         // debito - credito (a pagar a DGI)
  resultado: number;        // ventas - compras - gastos (neto)
}

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movimiento) private movRepo: Repository<Movimiento>,
  ) {}

  async findByClient(
    clientId: string,
    opts: { tipo?: TipoMovimiento; desde?: string; hasta?: string } = {},
  ): Promise<Movimiento[]> {
    const qb = this.movRepo
      .createQueryBuilder('m')
      .where('m.client_id = :clientId', { clientId });

    if (opts.tipo)  qb.andWhere('m.tipo = :tipo',   { tipo:  opts.tipo  });
    if (opts.desde) qb.andWhere('m.fecha >= :desde', { desde: opts.desde });
    if (opts.hasta) qb.andWhere('m.fecha <= :hasta', { hasta: opts.hasta });

    return qb.orderBy('m.fecha', 'DESC').getMany();
  }

  async create(clientId: string, dto: CreateMovimientoDto): Promise<Movimiento> {
    const m = this.movRepo.create({ ...dto, clientId, fecha: new Date(dto.fecha) });
    return this.movRepo.save(m);
  }

  async update(id: string, dto: Partial<CreateMovimientoDto>): Promise<Movimiento> {
    const m = await this.movRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Movimiento no encontrado');
    if (dto.fecha) (dto as any).fecha = new Date(dto.fecha);
    Object.assign(m, dto);
    return this.movRepo.save(m);
  }

  async delete(id: string): Promise<void> {
    await this.movRepo.delete(id);
  }

  /**
   * Resumen mensual: ventas, compras, gastos, IVA débito/crédito, resultado.
   * La lógica de IVA es simplificada — tasa por defecto 22%.
   */
  async resumenMensual(clientId: string, periodo: string): Promise<ResumenMensual> {
    const [year, month] = periodo.split('-').map(Number);
    const desde = new Date(year, month - 1, 1);
    const hasta  = new Date(year, month, 0);   // último día del mes

    const movs = await this.movRepo.find({
      where: {
        clientId,
        fecha: Between(desde, hasta),
      },
    });

    let totalVentas  = 0;
    let totalCompras = 0;
    let totalGastos  = 0;
    let debitoIva    = 0;
    let creditoIva   = 0;

    for (const m of movs) {
      const monto    = Number(m.monto);
      const tasaIva  = m.tasaIva ?? 22;
      const ivaFactor = tasaIva / (100 + tasaIva);

      const montoNeto = m.ivaIncluido ? monto / (1 + tasaIva / 100) : monto;
      const ivaMonto  = m.ivaIncluido ? monto * ivaFactor : monto * (tasaIva / 100);

      switch (m.tipo) {
        case TipoMovimiento.VENTA:
          totalVentas += montoNeto;
          debitoIva   += ivaMonto;
          break;
        case TipoMovimiento.COMPRA:
          totalCompras += montoNeto;
          creditoIva   += ivaMonto;
          break;
        case TipoMovimiento.GASTO:
          totalGastos += montoNeto;
          creditoIva  += ivaMonto;
          break;
      }
    }

    return {
      periodo,
      totalVentas:  Math.round(totalVentas  * 100) / 100,
      totalCompras: Math.round(totalCompras * 100) / 100,
      totalGastos:  Math.round(totalGastos  * 100) / 100,
      debitoIva:    Math.round(debitoIva    * 100) / 100,
      creditoIva:   Math.round(creditoIva   * 100) / 100,
      saldoIva:     Math.round((debitoIva - creditoIva) * 100) / 100,
      resultado:    Math.round((totalVentas - totalCompras - totalGastos) * 100) / 100,
    };
  }

  /** Resumen de los últimos N meses — útil para el dashboard del cliente */
  async resumenUltimosMeses(clientId: string, meses: number = 6): Promise<ResumenMensual[]> {
    const resultados: ResumenMensual[] = [];
    const hoy = new Date();

    for (let i = 0; i < meses; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      resultados.push(await this.resumenMensual(clientId, periodo));
    }

    return resultados.reverse(); // cronológico
  }
}
