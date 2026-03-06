# ContaApp

**Sistema de Gestión Contable para Contador Independiente**  
Progressive Web App · React + NestJS + PostgreSQL + TypeORM

---

## Descripción

ContaApp es una PWA diseñada para gestionar de forma integral la operativa de un contador independiente en Uruguay. Centraliza la información de clientes, movimientos contables, credenciales de acceso a plataformas tributarias (DGI, BPS, etc.), seguimiento de honorarios y calendario de vencimientos fiscales, actuando como asistente proactivo mediante notificaciones y recordatorios automáticos.

Pensada inicialmente para uso personal, con arquitectura preparada para escalar hacia múltiples contadores (modelo SaaS).

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript (PWA) |
| Backend | NestJS (Node.js) |
| Base de Datos | PostgreSQL |
| ORM | TypeORM |
| Autenticación | JWT + Refresh Tokens |
| Notificaciones | Web Push API + Email |
| Encriptación | AES-256 (credenciales) |
| Deploy | Docker + Docker Compose |
| Calendario | FullCalendar (React) |

---

## Roles

| Rol | Descripción |
|-----|-------------|
| **Admin** | Gestión global del sistema y usuarios |
| **Contador** | Gestión completa de su cartera de clientes |
| **Cliente** | Portal propio: facturación, impuestos, honorarios, consultas |

> La relación `Cliente → Contador` es parte del modelo de datos desde el inicio, preparando la arquitectura multi-contador.

---

## Módulos

### MVP (v1.0)
- Gestión de clientes (con relación al contador asignado)
- Gestión de credenciales (DGI, BPS, facturación electrónica, CJPPU, FONASA, etc.)
- Calendario de vencimientos tributarios (IVA, IRAE, IRPF, BPS, FONASA, CJPPU, Fondo de Solidaridad)
- Boletos de pago — registro y seguimiento de estado
- Honorarios — definición, cobros y estado de cuenta
- Ventas, compras y gastos del cliente
- Dashboard del contador

### v1.1
- Portal del cliente (acceso propio)
- Dashboard del cliente
- Notificaciones push y email
- Confirmación de pagos por el cliente
- Carga de ventas por el cliente

### v1.2
- Chat / consultas interno
- Reportes en PDF/Excel
- Importación de XML de factura electrónica

### v2.0
- Multi-contador (SaaS)
- Panel de administración global

---

## Modelo de Datos — Entidades Principales

- **Contador** — id, nombre, email, configuración
- **Cliente** — id, contadorId *(FK)*, nombre, RUT, razón social, perfil tributario
- **Credencial** — id, clienteId, plataforma, usuario, contraseña (encriptada)
- **Vencimiento** — id, clienteId, tipo, fecha, estado
- **BoletoPago** — id, clienteId, tipo impuesto, período, monto, estado
- **Honorario** — id, clienteId, período, monto acordado, estado de cobro
- **Movimiento** — id, clienteId, tipo (venta/compra/gasto), fecha, monto, IVA
- **Consulta** — id, clienteId, texto, estado, respuesta
- **Notificacion** — id, usuarioId, tipo, mensaje, leído

---

## Seguridad

- Credenciales de clientes encriptadas con **AES-256**
- Autenticación con **JWT de corta duración + refresh tokens rotatorios**
- HTTPS obligatorio
- Acceso estrictamente por roles
- Log de auditoría para accesos a credenciales
- Backups automáticos de PostgreSQL

---

## Roadmap

| Fase | Versión | Estado |
|------|---------|--------|
| Fase 1 | MVP v1.0 | 🔵 En planificación |
| Fase 2 | v1.1 — Portal cliente | ⬜ Pendiente |
| Fase 3 | v1.2 — Chat + Reportes | ⬜ Pendiente |
| Fase 4 | v2.0 — Multi-contador SaaS | ⬜ Pendiente |

---

## Documentación

- [`docs/ContaApp_Concepto_v01.pdf`](docs/ContaApp_Concepto_v01.pdf) — Documento de concepto completo
- [`docs/ContaApp_Concepto_v01.md`](docs/ContaApp_Concepto_v01.md) — Versión Markdown del documento

---

## Autor

**Lucas Martino** — [MK Studios](https://github.com/martino-lucas95)  
Uruguay · 2026
