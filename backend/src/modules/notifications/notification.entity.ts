import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum TipoNotificacion {
  VENCIMIENTO_PROXIMO = 'vencimiento_proximo',
  BOLETO_PENDIENTE = 'boleto_pendiente',
  HONORARIO_VENCIDO = 'honorario_vencido',
  PAGO_CONFIRMADO = 'pago_confirmado',
  CONSULTA_RECIBIDA = 'consulta_recibida',
  CONSULTA_RESPONDIDA = 'consulta_respondida',
  SISTEMA = 'sistema',
}

@Entity('notificaciones')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notificaciones, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @Column({ type: 'enum', enum: TipoNotificacion })
  tipo: TipoNotificacion;

  @Column({ length: 300 })
  mensaje: string;

  @Column({ default: false })
  leido: boolean;

  // Referencia opcional al recurso relacionado (clientId, vencimientoId, etc.)
  @Column({ nullable: true })
  referenciaId: string;

  @Column({ length: 50, nullable: true })
  referenciaTipo: string;

  @CreateDateColumn()
  createdAt: Date;
}
