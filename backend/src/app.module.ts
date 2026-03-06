import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FeesModule } from './modules/fees/fees.module';
import { MovementsModule } from './modules/movements/movements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'contaapp'),
        password: config.get('DB_PASSWORD', 'contaapp_secret'),
        database: config.get('DB_NAME', 'contaapp'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development', // solo en dev
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    AuthModule,
    UsersModule,
    ClientsModule,
    CredentialsModule,
    CalendarModule,
    PaymentsModule,
    FeesModule,
    MovementsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
