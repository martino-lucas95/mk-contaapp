import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    VerifiedRegistrationResponse,
    VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../../modules/users/user.entity';
import { Passkey } from '../../modules/users/passkey.entity';

// Configuración básica
const rpName = 'Honorix';
const rpID = 'localhost'; // En producción debería ser el dominio real e.g., 'contapp.mkstudios.net'
const origin = `http://${rpID}:5173`; // En producción debe coincidir con el puerto o https

@Injectable()
export class WebauthnService {
    // Almacenamiento en memoria para los challenges. En producción se recomienda Redis o DB.
    private currentChallenges = new Map<string, string>();

    constructor(
        @InjectRepository(Passkey)
        private passkeyRepository: Repository<Passkey>,
    ) { }

    async getRegistrationOptions(user: User) {
        const userPasskeys = await this.passkeyRepository.find({ where: { userId: user.id } });

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: new Uint8Array(Buffer.from(user.id)),
            userName: user.email,
            attestationType: 'none',
            excludeCredentials: userPasskeys.map((passkey) => ({
                id: passkey.credentialId,
                transports: passkey.transports as any,
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
        });

        this.currentChallenges.set(`reg_${user.id}`, options.challenge);
        return options;
    }

    async verifyRegistration(user: User, body: any): Promise<boolean> {
        const expectedChallenge = this.currentChallenges.get(`reg_${user.id}`);
        if (!expectedChallenge) {
            throw new BadRequestException('Challenge no encontrado o expirado');
        }

        let verification: VerifiedRegistrationResponse;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
            });
        } catch (error) {
            throw new BadRequestException(`Fallo en la verificación: ${(error as Error).message}`);
        }

        const { verified, registrationInfo } = verification;
        if (verified && registrationInfo) {
            const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

            const newPasskey = this.passkeyRepository.create({
                user,
                userId: user.id,
                credentialId: credential.id,
                credentialPublicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports as any || [],
            });

            await this.passkeyRepository.save(newPasskey);
            this.currentChallenges.delete(`reg_${user.id}`);
            return true;
        }

        return false;
    }

    async getAuthenticationOptions(user: User) {
        const userPasskeys = await this.passkeyRepository.find({ where: { userId: user.id } });

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: userPasskeys.map((passkey) => ({
                id: passkey.credentialId,
                transports: passkey.transports as any,
            })),
            userVerification: 'preferred',
        });

        this.currentChallenges.set(`auth_${user.id}`, options.challenge);
        return options;
    }

    async verifyAuthentication(user: User, body: any): Promise<boolean> {
        const expectedChallenge = this.currentChallenges.get(`auth_${user.id}`);
        if (!expectedChallenge) {
            throw new BadRequestException('Challenge de autenticación no encontrado');
        }

        const passkey = await this.passkeyRepository.findOne({ where: { credentialId: body.id, userId: user.id } });
        if (!passkey) {
            throw new BadRequestException('Passkey no encontrado para este usuario');
        }

        let verification: VerifiedAuthenticationResponse;
        try {
            verification = await verifyAuthenticationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: passkey.credentialId,
                    publicKey: new Uint8Array(passkey.credentialPublicKey),
                    counter: passkey.counter,
                    transports: passkey.transports as any,
                },
            });
        } catch (error) {
            throw new BadRequestException(`Fallo en la verificación de autenticación: ${(error as Error).message}`);
        }

        const { verified, authenticationInfo } = verification;
        if (verified) {
            // Actualizamos el counter para evitar ataques de replay
            passkey.counter = authenticationInfo.newCounter;
            await this.passkeyRepository.save(passkey);
            this.currentChallenges.delete(`auth_${user.id}`);
            return true;
        }

        return false;
    }
}
