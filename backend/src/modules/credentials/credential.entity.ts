import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';

export enum PlataformaCredencial {
  DGI = 'dgi',
  BPS = 'bps',
  FACTURACION_ELECTRONICA = 'facturacion_electronica',
  CJPPU = 'cjppu',
  FONASA = 'fonasa',
  BANCO = 'banco',
  OTRO = 'otro',
}

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (client) => client.credenciales, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ type: 'enum', enum: PlataformaCredencial, default: PlataformaCredencial.OTRO })
  plataforma: PlataformaCredencial;

  // Nombre libre para cuando plataforma = OTRO o para distinguir variantes
  @Column({ length: 100, nullable: true })
  nombrePlataforma: string;

  @Column({ length: 150, nullable: true })
  usuario: string;

  // Almacenado encriptado con AES-256 — nunca en texto plano
  @Column({ type: 'text', nullable: true })
  passwordEncriptado: string;

  @Column({ length: 20, nullable: true })
  pin: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ default: true })
  vigente: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
