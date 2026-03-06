import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { TipoVencimiento } from '../calendar/vencimiento.entity';

export enum EstadoBoleto {
  PENDIENTE_EMITIR = 'pendiente_emitir',
  EMITIDO = 'emitido',
  PAGADO = 'pagado',
  VENCIDO = 'vencido',
}

@Entity('boletos_pago')
export class BoletoPago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (client) => client.boletos, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ type: 'enum', enum: TipoVencimiento })
  tipoImpuesto: TipoVencimiento;

  // Período: ej "2026-02"
  @Column({ length: 7 })
  periodo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monto: number;

  @Column({ type: 'enum', enum: EstadoBoleto, default: EstadoBoleto.PENDIENTE_EMITIR })
  estado: EstadoBoleto;

  @Column({ type: 'date', nullable: true })
  fechaEmision: Date;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago: Date;

  // UUID del usuario que confirmó el pago (puede ser el cliente o el contador)
  @Column({ nullable: true })
  confirmadoPorId: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
