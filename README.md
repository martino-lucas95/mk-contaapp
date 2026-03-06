# ContaApp

Sistema de gestión contable para contador independiente. Desarrollado con NestJS + PostgreSQL + React.

**MK Studios · Lucas Martino**

---

## Stack

| Capa       | Tecnología                               |
|------------|------------------------------------------|
| Backend    | NestJS 10 · TypeORM · PostgreSQL 16      |
| Frontend   | React + Vite · Tailwind-free CSS         |
| Auth       | JWT (access + refresh) · bcrypt          |
| Crypto     | AES-256-CBC para credenciales de clientes|
| Infra      | Docker + Docker Compose                  |

---

## Levantar en desarrollo (recomendado)

### 1. Clonar y configurar variables

```bash
git clone https://github.com/martino-lucas95/mk-contaapp.git
cd mk-contaapp

cp .env.example backend/.env
# Editá backend/.env si querés cambiar algún valor (en dev los defaults funcionan)
```

### 2. Levantar con Docker Compose

```bash
docker compose up -d
```

Esto levanta:
- **PostgreSQL** en `localhost:5432`
- **API NestJS** en `localhost:3000/api/v1`
- **Frontend React** en `localhost:5173`

La primera vez tarda ~2 minutos en descargar imágenes e instalar dependencias.

### 3. Seed automático

Al levantar la API en modo `development`, se ejecuta el seed automáticamente.
También podés correrlo manualmente:

```bash
cd backend
npm run seed
```

### 4. Cuentas disponibles

| Email                   | Contraseña | Rol       |
|-------------------------|------------|-----------|
| `admin@contaapp.uy`     | `admin123` | admin     |
| `lucas@mkstudios.uy`    | `demo123`  | contador  |
| `maria@fernandez.uy`    | `demo123`  | cliente   |
| `roberto@pereira.uy`    | `demo123`  | cliente   |
| `lucia@suarez.uy`       | `demo123`  | cliente   |
| `carlos@martinez.uy`    | `demo123`  | cliente   |

---

## Levantar sin Docker

### Backend

```bash
cd backend
npm install
cp ../.env.example .env   # ajustar DB_HOST=localhost

# Necesitás PostgreSQL corriendo localmente:
createdb contaapp

npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Estructura del proyecto

```
mk-contaapp/
├── backend/
│   └── src/
│       ├── common/
│       │   ├── encryption.service.ts     # AES-256 para credenciales
│       │   └── guards/                   # JWT + Roles
│       ├── database/
│       │   └── seed.ts                   # Datos iniciales
│       └── modules/
│           ├── auth/                     # Login, JWT, refresh tokens
│           ├── users/                    # CRUD usuarios (solo admin)
│           ├── clients/                  # Gestión de clientes
│           ├── calendar/
│           │   ├── uy-tax-calendar.ts    # ← Lógica DGI por terminal de RUT
│           │   └── uy-tax-calendar.spec.ts
│           ├── credentials/              # Credenciales encriptadas
│           ├── payments/                 # Boletos de pago
│           ├── fees/                     # Honorarios
│           ├── movements/                # Ventas / compras / gastos
│           └── notifications/            # Alertas en tiempo real
└── frontend/
    └── src/
        └── ContaApp_Preview.jsx          # UI completa (preview)
```

---

## API endpoints principales

```
POST   /api/v1/auth/login               → { accessToken, refreshToken, user }
POST   /api/v1/auth/refresh             → nuevo accessToken

GET    /api/v1/clients                  → lista de clientes del contador
POST   /api/v1/clients                  → crear cliente

GET    /api/v1/calendar/proximos        → vencimientos próximos (30 días)
POST   /api/v1/calendar/client/:id/generar  → generar vencimientos anuales DGI

GET    /api/v1/credentials/client/:id   → credenciales (sin password)
GET    /api/v1/credentials/:id/reveal   → credencial con password desencriptada

GET    /api/v1/payments/client/:id      → boletos de un cliente
PATCH  /api/v1/payments/:id/confirmar-pago  → cliente confirma pago

GET    /api/v1/fees/resumen             → resumen honorarios del contador
PATCH  /api/v1/fees/:id/pago            → registrar pago de honorario

GET    /api/v1/movements/client/:id/resumen/:periodo  → IVA débito/crédito mensual

GET    /api/v1/notifications            → notificaciones del usuario logueado
PATCH  /api/v1/notifications/read-all   → marcar todas como leídas
```

---

## Roles y acceso

| Funcionalidad              | admin | contador | cliente |
|----------------------------|:-----:|:--------:|:-------:|
| Ver todos los clientes     | ✓     | ✓ (suyos)| ✗       |
| Crear/editar clientes      | ✓     | ✓        | ✗       |
| Ver credenciales           | ✓     | ✓        | ✗       |
| Generar vencimientos DGI   | ✓     | ✓        | ✗       |
| Ver sus propios impuestos  | ✗     | ✗        | ✓       |
| Confirmar pago de boleto   | ✗     | ✗        | ✓       |
| Cargar sus movimientos     | ✗     | ✗        | ✓       |
| Gestionar usuarios         | ✓     | ✗        | ✗       |

---

## Tests

```bash
cd backend
npm test                  # todos los tests
npm test uy-tax-calendar  # solo el calendario tributario
npm run test:cov          # con coverage
```

---

## Roadmap

- [ ] Módulo de consultas contador ↔ cliente (mensajería)
- [ ] Notificaciones push (WebSocket o SSE)
- [ ] Exportación de reportes PDF/Excel
- [ ] Generación automática de boletos desde vencimientos
- [ ] Integración DGI (WebService oficial)
- [ ] App mobile (React Native / PWA)
- [ ] Multi-contador (agencia contable)
