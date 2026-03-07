import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Honorario } from './honorario.entity';

export enum FeeFrecuencia {
    MENSUAL = 'mensual',
    ANUAL = 'anual',
    SEMANAL = 'semanal',
    UNICO = 'unico',
}

@Entity('fee_contracts')
export class FeeContract {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Client, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'client_id' })
    clientId: string;

    @Column({ type: 'enum', enum: FeeFrecuencia, default: FeeFrecuencia.MENSUAL })
    frecuencia: FeeFrecuencia;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: number;

    @Column({ type: 'date' })
    fechaInicio: Date; // e.g. "2026-03-01"

    @Column({ type: 'date', nullable: true })
    fechaFin: Date; // optional, when the contract ends

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @OneToMany(() => Honorario, (honorario) => honorario.feeContract)
    honorarios: Honorario[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
