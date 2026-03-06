import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Credential } from '../credentials/credential.entity';
import { Vencimiento } from '../calendar/vencimiento.entity';
import { BoletoPago } from '../payments/boleto-pago.entity';
import { Honorario } from '../fees/honorario.entity';
import { Movimiento } from '../movements/movimiento.entity';

export enum TipoEmpresa {
  UNIPERSONAL = 'unipersonal',
  SAS = 'sas',
  SA = 'sa',
  SRL = 'srl',
  OTRO = 'otro',
}

export enum EstadoCliente {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Relación con el Contador asignado ──────────────────────────────
  // Clave para arquitectura multi-contador futura
  @ManyToOne(() => User, (user) => user.clientes, { nullable: false })
  @JoinColumn({ name: 'contador_id' })
  contador: User;

  @Column({ name: 'contador_id' })
  contadorId: string;

  // ── Relación con el Usuario del portal cliente (opcional) ──────────
  @ManyToOne(() => User, (user) => user.clientesVinculados, { nullable: true })
  @JoinColumn({ name: 'usuario_cliente_id' })
  usuarioCliente: User;

  @Column({ name: 'usuario_cliente_id', nullable: true })
  usuarioClienteId: string;

  // ── Datos personales ───────────────────────────────────────────────
  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 8, nullable: true })
  ci: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 250, nullable: true })
  direccion: string;

  // ── Datos empresa ──────────────────────────────────────────────────
  @Column({ length: 200, nullable: true })
  razonSocial: string;

  @Column({ length: 12, nullable: true, unique: true })
  rut: string;

  @Column({ type: 'enum', enum: TipoEmpresa, nullable: true })
  tipoEmpresa: TipoEmpresa | null;

  @Column({ length: 200, nullable: true })
  giro: string;

  @Column({ type: 'date', nullable: true })
  fechaInicioActividades: Date | null;

  // ── Perfil tributario ──────────────────────────────────────────────
  @Column({ default: false })
  contribuyenteIva: boolean;

  @Column({ default: false })
  liquidaIrae: boolean;

  @Column({ default: false })
  irpfCat1: boolean;

  @Column({ default: false })
  irpfCat2: boolean;

  @Column({ default: false })
  empleadorBps: boolean;

  @Column({ default: false })
  fonasa: boolean;

  @Column({ default: false })
  cjppu: boolean;

  @Column({ default: false })
  fondoSolidaridad: boolean;

  // ── Estado ────────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: EstadoCliente, default: EstadoCliente.ACTIVO })
  estado: EstadoCliente;

  @Column({ type: 'text', nullable: true })
  notas: string;

  // ── Relaciones ────────────────────────────────────────────────────
  @OneToMany(() => Credential, (c) => c.client)
  credenciales: Credential[];

  @OneToMany(() => Vencimiento, (v) => v.client)
  vencimientos: Vencimiento[];

  @OneToMany(() => BoletoPago, (b) => b.client)
  boletos: BoletoPago[];

  @OneToMany(() => Honorario, (h) => h.client)
  honorarios: Honorario[];

  @OneToMany(() => Movimiento, (m) => m.client)
  movimientos: Movimiento[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
