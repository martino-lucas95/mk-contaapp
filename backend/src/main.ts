import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { runSeed } from './database/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // laxo en dev para no frenar iteración
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL   || 'http://localhost:5173',
      'http://localhost:3001',
    ],
    credentials: true,
  });

  // Auto-seed en desarrollo: crea usuarios base si no existen
  if (process.env.NODE_ENV !== 'production') {
    const usersService = app.get(UsersService);
    await usersService.ensureAdminExists();
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 ContaApp API  →  http://localhost:${port}/api/v1`);
  console.log(`📚 Entorno        →  ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
