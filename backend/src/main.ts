import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1');

  // Health check para k8s readiness/liveness probes
  app.use('/api/v1/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
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
