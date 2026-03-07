import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Notification } from '../notifications/notification.entity';
import { Passkey } from './passkey.entity';

export enum UserRole {
  ADMIN = 'admin',
  CONTADOR = 'contador',
  CLIENTE = 'cliente',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CONTADOR })
  role: UserRole;

  @Column({ default: true })
  activo: boolean;

  // Si el rol es CONTADOR, tiene clientes asignados
  @OneToMany(() => Client, (client) => client.contador)
  clientes: Client[];

  // Si el rol es CLIENTE, está vinculado a un cliente
  @OneToMany(() => Client, (client) => client.usuarioCliente)
  clientesVinculados: Client[];

  @OneToMany(() => Notification, (n) => n.usuario)
  notificaciones: Notification[];

  @OneToMany(() => Passkey, (p) => p.user)
  passkeys: Passkey[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
