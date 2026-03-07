/**
 * seed.ts
 * Datos iniciales para desarrollo.
 * Modos:
 *  - admin (default): crea/asegura solo el usuario admin
 *  - full: crea admin + contador + clientes demo y datos asociados
 *
 * Uso: npm run seed
 * El bootstrap también lo llama en modo development si no existe el admin.
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../modules/users/user.entity';
import { Client, TipoEmpresa } from '../modules/clients/client.entity';
import { Credential, PlataformaCredencial } from '../modules/credentials/credential.entity';
import { Honorario, EstadoHonorario, FormaPago } from '../modules/fees/honorario.entity';
import { generarVencimientosAnuales } from '../modules/calendar/uy-tax-calendar';
import { Vencimiento, EstadoVencimiento } from '../modules/calendar/vencimiento.entity';
import * as crypto from 'crypto';

// ─── Configuración de encriptación (debe coincidir con .env) ─────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'contaapp_dev_key_32bytes_padded!!';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv  = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// ─── Datos de seed ────────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    nombre: 'Admin', apellido: 'ContaApp',
    email: 'admin@contaapp.uy', password: 'admin123',
    role: UserRole.ADMIN,
  },
  {
    nombre: 'Lucas', apellido: 'Martino',
    email: 'lucas@mkstudios.uy', password: 'demo123',
    role: UserRole.CONTADOR,
  },
];

const SEED_CLIENTS = [
  {
    nombre: 'María', apellido: 'Fernández',
    razonSocial: 'Fernández & Asoc. SAS',
    rut: '213456789', email: 'maria@fernandez.uy',
    tipoEmpresa: TipoEmpresa.SAS,
    contribuyenteIva: true, liquidaIrae: true,
    irpfCat1: false, irpfCat2: true,
    empleadorBps: false, fonasa: true,
    cjppu: true, fondoSolidaridad: false,
    honorario: 8500,
    password: 'demo123',
    credenciales: [
      { plataforma: PlataformaCredencial.DGI, usuario: 'maria_fernandez', password: 'dgi2026!', pin: '4512' },
      { plataforma: PlataformaCredencial.BPS, usuario: 'mfernandez',      password: 'bps_2026'         },
    ],
  },
  {
    nombre: 'Roberto', apellido: 'Pereira',
    razonSocial: 'Pereira Tech SRL',
    rut: '214567890', email: 'roberto@pereira.uy',
    tipoEmpresa: TipoEmpresa.SRL,
    contribuyenteIva: true, liquidaIrae: true,
    irpfCat1: false, irpfCat2: true,
    empleadorBps: true, fonasa: true,
    cjppu: false, fondoSolidaridad: false,
    honorario: 12000,
    password: 'demo123',
    credenciales: [
      { plataforma: PlataformaCredencial.DGI, usuario: 'roberto_pereira', password: 'per2026dgi' },
      { plataforma: PlataformaCredencial.BPS, usuario: 'rpereira_bps',    password: 'bpsRoberto1' },
    ],
  },
  {
    nombre: 'Lucía', apellido: 'Suárez',
    razonSocial: 'Arq. Lucía Suárez',
    rut: '215678901', email: 'lucia@suarez.uy',
    tipoEmpresa: TipoEmpresa.UNIPERSONAL,
    contribuyenteIva: false, liquidaIrae: false,
    irpfCat1: true, irpfCat2: false,
    empleadorBps: false, fonasa: true,
    cjppu: true, fondoSolidaridad: true,
    honorario: 5500,
    password: 'demo123',
    credenciales: [
      { plataforma: PlataformaCredencial.DGI, usuario: 'lucia.suarez', password: 'lucia_dgi!23' },
      { plataforma: PlataformaCredencial.CJPPU, usuario: 'lsuarez_cjppu', password: 'cjppuPass1', pin: '8821' },
    ],
  },
  {
    nombre: 'Carlos', apellido: 'Martínez',
    razonSocial: 'Dra. Martínez Consulting SA',
    rut: '216789012', email: 'carlos@martinez.uy',
    tipoEmpresa: TipoEmpresa.SA,
    contribuyenteIva: true, liquidaIrae: true,
    irpfCat1: false, irpfCat2: true,
    empleadorBps: true, fonasa: false,
    cjppu: true, fondoSolidaridad: false,
    honorario: 9200,
    password: 'demo123',
    credenciales: [
      { plataforma: PlataformaCredencial.DGI,         usuario: 'cmartinez_sa',  password: 'sa_dgi2026' },
      { plataforma: PlataformaCredencial.BANCO,       usuario: 'cmartinez',     password: 'demo_banco_123', pin: '1234' },
    ],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────
export async function runSeed(dataSource?: DataSource): Promise<void> {
  const seedMode = (process.env.SEED_MODE || 'admin').toLowerCase() === 'full' ? 'full' : 'admin';
  let ds = dataSource;
  let shouldClose = false;

  if (!ds) {
    ds = new DataSource({
      type: 'postgres',
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER     || 'contaapp',
      password: process.env.DB_PASSWORD || 'contaapp_secret',
      database: process.env.DB_NAME     || 'contaapp',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
    });
    await ds.initialize();
    shouldClose = true;
  }

  const userRepo       = ds.getRepository(User);
  const clientRepo     = ds.getRepository(Client);
  const credRepo       = ds.getRepository(Credential);
  const honorarioRepo  = ds.getRepository(Honorario);
  const vencRepo       = ds.getRepository(Vencimiento);

  console.log('\n🌱 Iniciando seed...\n');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const usersToSeed = seedMode === 'full'
    ? SEED_USERS
    : SEED_USERS.filter((u) => u.role === UserRole.ADMIN);

  const savedUsers: Record<string, User> = {};
  for (const u of usersToSeed) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      savedUsers[u.email] = existing;
      console.log(`  ⏭  Usuario ya existe: ${u.email}`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 12);
    const user   = userRepo.create({ ...u, password: hashed });
    savedUsers[u.email] = await userRepo.save(user);
    console.log(`  ✓  Usuario creado: ${u.email} [${u.role}]`);
  }

  if (seedMode !== 'full') {
    if (shouldClose) await ds.destroy();
    console.log('\n✅ Seed admin completado.\n');
    console.log('── Cuentas disponibles ─────────────────────────────────');
    console.log('  admin@contaapp.uy      / admin123   [admin]');
    console.log('────────────────────────────────────────────────────────\n');
    return;
  }

  const contador = savedUsers['lucas@mkstudios.uy'];
  if (!contador) {
    throw new Error('Seed full inconsistente: no se encontró el usuario contador');
  }

  // ── Clientes ──────────────────────────────────────────────────────────────
  const year = new Date().getFullYear();

  for (const c of SEED_CLIENTS) {
    // Verificar si ya existe
    let client = await clientRepo.findOne({ where: { email: c.email } });

    if (!client) {
      // Crear usuario cliente
      const existing = await userRepo.findOne({ where: { email: c.email } });
      let clientUser = existing;
      if (!clientUser) {
        const hashed = await bcrypt.hash(c.password, 12);
        clientUser = await userRepo.save(userRepo.create({
          nombre: c.nombre, apellido: c.apellido,
          email: c.email, password: hashed,
          role: UserRole.CLIENTE,
        }));
      }

      // Crear cliente
      const { credenciales, password, ...clientData } = c;
      client = await clientRepo.save(clientRepo.create({
        ...clientData,
        contadorId: contador.id,
        usuarioClienteId: clientUser.id,
      }));
      console.log(`  ✓  Cliente creado: ${c.nombre} ${c.apellido}`);
    } else {
      console.log(`  ⏭  Cliente ya existe: ${c.nombre} ${c.apellido}`);
    }

    if (!client) {
      throw new Error(`Seed inconsistente: no se pudo obtener/crear el cliente ${c.email}`);
    }

    // ── Credenciales ────────────────────────────────────────────────────────
    const credsExistentes = await credRepo.count({ where: { clientId: client.id } });
    if (credsExistentes === 0) {
      for (const cred of c.credenciales) {
        await credRepo.save(credRepo.create({
          clientId:          client.id,
          plataforma:        cred.plataforma,
          nombrePlataforma:  cred.plataforma === PlataformaCredencial.BANCO ? 'BROU' : undefined,
          usuario:           cred.usuario,
          passwordEncriptado: encrypt(cred.password),
          pin:               cred.pin,
          vigente:           true,
        }));
      }
      console.log(`     + ${c.credenciales.length} credenciales creadas`);
    }

    // ── Honorarios (últimos 3 meses) ────────────────────────────────────────
    const today = new Date();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const honExiste = await honorarioRepo.findOne({ where: { clientId: client.id, periodo } });
      if (!honExiste) {
        const pagado = i > 0; // los dos meses anteriores están pagados, el actual no
        await honorarioRepo.save(honorarioRepo.create({
          clientId:     client.id,
          periodo,
          montoAcordado: c.honorario,
          montoCobrado:  pagado ? c.honorario : 0,
          fechaCobro:    pagado ? new Date(d.getFullYear(), d.getMonth() + 1, 5) : undefined,
          formaPago:     pagado ? FormaPago.TRANSFERENCIA : undefined,
          estado:        pagado ? EstadoHonorario.AL_DIA : EstadoHonorario.PENDIENTE,
        }));
      }
    }

    // ── Vencimientos anuales (generados por el calendario DGI) ──────────────
    const vencExistentes = await vencRepo.count({ where: { clientId: client.id } });
    if (vencExistentes === 0) {
      const vencGenerados = generarVencimientosAnuales(client.rut, client, year);
      const entidades = vencGenerados.map(v =>
        vencRepo.create({
          ...v,
          clientId: client.id,
          estado:   new Date(v.fechaVencimiento) < today
            ? EstadoVencimiento.COMPLETADO
            : EstadoVencimiento.PENDIENTE,
        }),
      );
      await vencRepo.save(entidades);
      console.log(`     + ${entidades.length} vencimientos generados (${year})`);
    }
  }

  if (shouldClose) await ds.destroy();

  console.log('\n✅ Seed completado.\n');
  console.log('── Cuentas disponibles ─────────────────────────────────');
  console.log('  admin@contaapp.uy      / admin123   [admin]');
  console.log('  lucas@mkstudios.uy     / demo123    [contador]');
  console.log('  maria@fernandez.uy     / demo123    [cliente]');
  console.log('  roberto@pereira.uy     / demo123    [cliente]');
  console.log('  lucia@suarez.uy        / demo123    [cliente]');
  console.log('  carlos@martinez.uy     / demo123    [cliente]');
  console.log('────────────────────────────────────────────────────────\n');
}

// Permite correr directamente: ts-node seed.ts
if (require.main === module) {
  runSeed().catch(console.error);
}
