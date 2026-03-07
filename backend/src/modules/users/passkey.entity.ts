import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('passkeys')
export class Passkey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    credentialId: string;

    @Column('bytea')
    credentialPublicKey: Buffer;

    @Column()
    counter: number;

    @Column('simple-array')
    transports: string[];

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string; // Fk explicita

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
