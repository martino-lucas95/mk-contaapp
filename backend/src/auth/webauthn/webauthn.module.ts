import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebauthnController } from './webauthn.controller';
import { WebauthnService } from './webauthn.service';
import { User } from '../../modules/users/user.entity';
import { Passkey } from '../../modules/users/passkey.entity';
import { UsersModule } from '../../modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Passkey]),
    UsersModule,
  ],
  controllers: [WebauthnController],
  providers: [WebauthnService]
})
export class WebauthnModule { }
