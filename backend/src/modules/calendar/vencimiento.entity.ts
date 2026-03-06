import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';

export enum TipoVencimiento {
  IVA = 'iva',
  IRAE_ANTICIPO = 'irae_anticipo',
  IRAE_LIQUIDACION = 'irae_liquidacion',
  IRPF_CAT1 = 'irpf_cat1',
  IRPF_CAT2 = 'irpf_cat2',
  BPS_PATRONAL = 'bps_patronal',
  BPS_PERSONAL = 'bps_personal',
  FONASA = 'fonasa',
  CJPPU = 'cjppu',
  FONDO_SOLIDARIDAD = 'fondo_solidaridad',
  DJ_ANUAL = 'dj_anual',
  PERSONALIZADO = 'personalizado',
}

export enum EstadoVencimiento {
  PENDIENTE = 'pendiente',
  COMPLETADO = 'completado',
  VENCIDO = 'vencido',
  ALERTADO = 'alertado',
}

@Entity('vencimientos')
export class Vencimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (client) => client.vencimientos, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ type: 'enum', enum: TipoVencimiento })
  tipo: TipoVencimiento;

  @Column({ length: 200, nullable: true })
  descripcion: string;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  // Período al que corresponde (ej: 2026-02 para IVA de febrero)
  @Column({ length: 7, nullable: true })
  periodo: string;

  @Column({ type: 'enum', enum: EstadoVencimiento, default: EstadoVencimiento.PENDIENTE })
  estado: EstadoVencimiento;

  @Column({ type: 'text', nullable: true })
  notas: string;

  // Si fue generado automáticamente por el calendario o manualmente
  @Column({ default: false })
  esPersonalizado: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
