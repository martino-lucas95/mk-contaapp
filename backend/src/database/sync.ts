import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function sync() {
    console.log('🔄 Iniciando sincronización de base de datos...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        await dataSource.synchronize(false); // false = no borrar datos
        console.log('✅ Base de datos sincronizada correctamente.');
    } catch (error) {
        console.error('❌ Error sincronizando base de datos:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

sync();
