import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Credential } from './credential.entity';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { EncryptionService } from '../../common/encryption.service';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential]),
    JwtModule.register({}),
    ConfigModule,
  ],
  providers: [CredentialsService, EncryptionService],
  controllers: [CredentialsController],
  exports: [CredentialsService],
})
export class CredentialsModule {}
