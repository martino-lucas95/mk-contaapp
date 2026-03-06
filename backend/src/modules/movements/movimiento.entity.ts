import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';

export enum TipoMovimiento {
  VENTA = 'venta',
  COMPRA = 'compra',
  GASTO = 'gasto',
}

export enum CategoriaGasto {
  FONASA = 'fonasa',
  CJPPU = 'cjppu',
  FONDO_SOLIDARIDAD = 'fondo_solidaridad',
  BPS = 'bps',
  ALQUILER = 'alquiler',
  SERVICIOS = 'servicios',
  OTRO = 'otro',
}

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (client) => client.movimientos, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo: TipoMovimiento;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ length: 300, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  // IVA incluido en el monto o por separado
  @Column({ default: true })
  ivaIncluido: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tasaIva: number; // 22, 10, 0

  @Column({ type: 'enum', enum: CategoriaGasto, nullable: true })
  categoria: CategoriaGasto;

  // Número de comprobante / factura
  @Column({ length: 50, nullable: true })
  nroComprobante: string;

  // Ruta del adjunto (factura escaneada, XML, etc.)
  @Column({ length: 500, nullable: true })
  adjuntoUrl: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
