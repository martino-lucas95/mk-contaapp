import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';

export enum EstadoHonorario {
  AL_DIA = 'al_dia',
  PENDIENTE = 'pendiente',
  VENCIDO = 'vencido',
}

export enum FormaPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  OTRO = 'otro',
}

@Entity('honorarios')
export class Honorario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (client) => client.honorarios, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id' })
  clientId: string;

  // Período: ej "2026-02"
  @Column({ length: 7 })
  periodo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoAcordado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoCobrado: number;

  @Column({ type: 'date', nullable: true })
  fechaCobro: Date;

  @Column({ type: 'enum', enum: FormaPago, nullable: true })
  formaPago: FormaPago;

  @Column({ type: 'enum', enum: EstadoHonorario, default: EstadoHonorario.PENDIENTE })
  estado: EstadoHonorario;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
