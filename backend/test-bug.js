"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const clients_service_1 = require("./src/modules/clients/clients.service");
const user_entity_1 = require("./src/modules/users/user.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const clientsService = app.get(clients_service_1.ClientsService);
    const testEmail = `test_${Date.now()}@example.com`;
    try {
        console.log('--- 1. Creando cliente ---');
        const client = await clientsService.create({
            nombre: 'Test',
            apellido: 'User',
            razonSocial: 'Test Company',
            rut: (Math.floor(Math.random() * 900000000000) + 100000000000).toString(),
            email: testEmail
        }, '64687d3a-161b-4029-9e8c-9c9d54e56588');
        console.log('Cliente creado:', client.id);
        console.log('--- 2. Creando usuario para cliente ---');
        const updatedClient = await clientsService.createUserForClient(client.id, { email: testEmail, password: 'password123' }, '64687d3a-161b-4029-9e8c-9c9d54e56588', user_entity_1.UserRole.ADMIN);
        console.log('Usuario vinculado con éxito:', updatedClient.usuarioClienteId);
    }
    catch (err) {
        console.error('ERROR DETECTADO:', err);
        if (err.response)
            console.error('Detalles:', err.response);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=test-bug.js.map