import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from './credential.entity';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { EncryptionService } from '../../common/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([Credential])],
  providers: [CredentialsService, EncryptionService],
  controllers: [CredentialsController],
  exports: [CredentialsService],
})
export class CredentialsModule {}
