# ContaApp — Documento de Concepto v0.2

**Sistema de Gestión Contable para Contador Independiente**  
Progressive Web App · React + NestJS + PostgreSQL + TypeORM  
*Versión 0.2 — Marzo 2026 · Lucas Martino — MK Studios*

---

## 1. Visión General

ContaApp es una Progressive Web App diseñada para gestionar de forma integral la operativa de un contador independiente en Uruguay. Centraliza la información de clientes, sus movimientos contables, credenciales de acceso a plataformas tributarias, el seguimiento de honorarios, y el calendario de vencimientos fiscales, actuando como asistente proactivo mediante notificaciones y recordatorios automáticos.

La aplicación está pensada inicialmente para uso personal, con arquitectura preparada para escalar hacia múltiples contadores (colegas), manteniendo la misma base de código y modelo de datos.

| Atributo | Valor |
|----------|-------|
| Nombre | ContaApp |
| Tipo | Progressive Web App (PWA) — responsive, instalable en PC y móvil |
| Stack | Frontend: React · Backend: NestJS · Base de datos: PostgreSQL · ORM: TypeORM |
| Usuarios iniciales | 3 roles: Admin, Contador, Cliente |
| Mercado objetivo | Uruguay (con potencial expansión regional a futuro) |
| Modelo | Uso personal → SaaS para colegas contadores |

---

## 2. Problema que Resuelve

El contador independiente típicamente opera con información dispersa entre planillas, carpetas físicas, sistemas tributarios de DGI/BPS, y comunicación informal con clientes. Esto genera:

- Riesgo de vencimiento de obligaciones tributarias por falta de seguimiento centralizado.
- Dificultad para saber rápidamente qué boletos de pago ya se emitieron y cuáles faltan.
- Gestión manual y propensa a error de credenciales de acceso de cada cliente a DGI, BPS, facturación electrónica, etc.
- Ausencia de un canal estructurado para que el cliente consulte su situación o cargue información.
- Falta de visibilidad sobre honorarios cobrados, pendientes y vencidos por cliente.

ContaApp resuelve estos problemas con una plataforma unificada, proactiva y accesible desde cualquier dispositivo.

---

## 3. Roles y Permisos

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| **Admin** | Total | Gestión de usuarios, configuración global del sistema, acceso a todo. |
| **Contador** | Alto — todos sus clientes | Gestión completa de clientes, movimientos, honorarios, vencimientos y credenciales. |
| **Cliente** | Limitado — sólo su empresa | Portal propio: facturación, impuestos pendientes, honorarios, cargar ventas, enviar dudas, recibir alertas. |

---

## 4. Módulos del Sistema

| Módulo | Descripción | Versión |
|--------|-------------|---------|
| Gestión de Clientes | Ficha completa: datos personales, empresa, RUT, perfil tributario, relación con el contador asignado. | MVP |
| Credenciales | Almacén seguro por cliente: DGI, BPS, Facturación Electrónica, CJPPU, FONASA y otras plataformas. | MVP |
| Vencimientos y Calendario | Calendario tributario con fechas DGI/BPS según perfil del cliente. Recordatorios automáticos configurables. | MVP |
| Boletos de Pago | Registro por tipo: IVA, IRAE, IRPF Cat I y II, FONASA, CJPPU, BPS, Fondo de Solidaridad. Estado: emitido/pagado/vencido/pendiente. | MVP |
| Honorarios | Definición por cliente, historial de cobros, estado de deuda, alertas de impago. | MVP |
| Ventas y Compras | Registro de ventas y compras. Totales mensuales/anuales, crédito/débito IVA. | MVP |
| Gastos Fijos | FONASA, CJPPU, Fondo de Solidaridad, BPS, etc. Proyección mensual. | MVP |
| Dashboard — Contador | Vencimientos próximos, boletos pendientes, honorarios por cobrar, movimientos recientes. | MVP |
| Portal del Cliente | Acceso propio: facturación, impuestos, honorarios, confirmar pagos, cargar ventas, enviar consultas. | v1.1 |
| Dashboard — Cliente | Situación fiscal resumida, próximos vencimientos, deuda de honorarios, alertas activas. | v1.1 |
| Notificaciones Push | Alertas push (PWA) y email: vencimientos, boletos sin emitir, honorarios vencidos. | v1.1 |
| Chat / Consultas | Mensajería entre contador y cliente. Historial, respuestas, adjuntos. | v1.2 |
| Reportes y Exportación | PDF/Excel: estado de cuenta, resumen IVA/IRAE, honorarios. | v1.2 |
| Multi-contador (SaaS) | Múltiples contadores independientes con su propia cartera de clientes. | v2.0 |

---

## 5. Detalle de Módulos Clave

### 5.1 Ficha de Cliente

- Datos personales: nombre, apellido, CI, teléfono, email, dirección.
- Datos de empresa: razón social, RUT, tipo (unipersonal, SAS, SA, etc.), giro, fecha de inicio de actividades.
- **Relación con el contador:** cada cliente tiene asignado un `contadorId` (FK), lo que permite en el futuro que múltiples contadores usen el sistema sin visibilidad cruzada de carteras.
- Perfil tributario: contribuyente de IVA, categoría IRPF, IRAE, empleador BPS, FONASA, CJPPU, Fondo de Solidaridad.
- Documentos adjuntos.
- Estado: activo / inactivo / suspendido.

### 5.2 Gestión de Credenciales

Almacenadas encriptadas (AES-256), visibles sólo para el contador y admin:

- DGI — Portal de consulta y declaraciones juradas.
- BPS — Portal empleadores / autónomos.
- Proveedor de Facturación Electrónica (e.gy, Uruware, Fiscalizador, etc.).
- CJPPU — Caja de Jubilaciones y Pensiones de Profesionales.
- FONASA — Sistema de salud.
- Banco (si el cliente autoriza).
- Campos libres configurables por el contador.

### 5.3 Calendario de Vencimientos

Construido automáticamente según el perfil tributario de cada cliente:

- Vencimientos de IVA mensual (según tabla DGI por terminal del RUT).
- Anticipos y liquidación anual de IRAE.
- IRPF Categoría I y II — retenciones y declaraciones anuales.
- Aportes BPS patronales y personales — mensual.
- FONASA — mensual.
- CJPPU — aporte mensual y declaraciones anuales.
- Fondo de Solidaridad — cuotas anuales.
- Declaraciones Juradas anuales (IRAE, IP, IRPF Cat I).
- Fechas personalizadas por el contador.

Recordatorios configurables: 10 días antes, 3 días antes, día del vencimiento — vía push y/o email.

### 5.4 Boletos de Pago

Por cada cliente, el contador registra qué boletos emitió:

- **Tipo:** IVA, IRAE anticipo, IRAE liquidación, IRPF Cat II retención, IRPF Cat I, FONASA, CJPPU, BPS, Fondo de Solidaridad, otro.
- **Período:** mes/año al que corresponde.
- **Monto:** importe del boleto.
- **Estado:** Emitido / Pagado (con fecha) / Vencido / Pendiente de emitir.
- El cliente puede confirmar el pago desde su portal.

### 5.5 Honorarios

- Monto fijo mensual, por servicio, o combinación.
- Registro de pagos recibidos con fecha y forma de pago.
- Estado de cuenta: al día / con saldo pendiente / vencido.
- Alertas automáticas cuando un cliente no paga en N días.
- Reporte global de honorarios cobrados vs. pendientes en el período.

### 5.6 Portal del Cliente

El cliente accede con sus propias credenciales y puede:

- Ver su facturación (ventas y compras registradas).
- Ver impuestos y boletos pendientes de pago.
- Ver su estado de honorarios.
- Confirmar que realizó un pago (sujeto a validación del contador).
- Cargar sus ventas del mes.
- Enviar consultas o dudas al contador.
- Recibir alertas de vencimientos.
- Ver un dashboard con su situación resumida.

---

## 6. Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | React + TypeScript | PWA con manifest + service worker. UI con Tailwind CSS o MUI. |
| Backend | NestJS (Node.js) | API REST + WebSockets para notificaciones en tiempo real. |
| Base de Datos | PostgreSQL | ORM: **TypeORM**. Migraciones versionadas. |
| Autenticación | JWT + Refresh Tokens | Roles: Admin, Contador, Cliente. Guards por módulo. |
| Notificaciones | Web Push API + Email | Push nativo de PWA + Nodemailer/SendGrid para email. |
| Encriptación | AES-256 (credenciales) | Las credenciales de clientes se almacenan encriptadas en BD. |
| Deploy | Docker + Docker Compose | Inicialmente en VPS propio o Render/Railway. CI/CD básico. |
| Calendario | FullCalendar (React) | Vista mensual/semanal con eventos por cliente y tipo. |

---

## 7. Roadmap de Desarrollo

| Fase | Versión | Alcance |
|------|---------|---------|
| Fase 1 | MVP (v1.0) | Gestión de clientes, credenciales, calendario de vencimientos, boletos de pago, honorarios, ventas/compras/gastos, dashboard del contador. 3 usuarios. |
| Fase 2 | v1.1 | Portal del cliente, dashboard del cliente, notificaciones push y email, confirmación de pagos, carga de ventas por el cliente. |
| Fase 3 | v1.2 | Chat/consultas interno, reportes en PDF/Excel, importación de XML de factura electrónica, mejoras UX. |
| Fase 4 | v2.0 | Multi-contador (SaaS), onboarding de colegas, facturación del servicio, panel de administración global. |

---

## 8. Modelo de Datos — Entidades Principales

### Contador
`id, nombre, apellido, email, configuración, activo`

### Cliente
`id, contadorId (FK → Contador), nombre, apellido, CI, RUT, razón social, tipo de empresa, giro, perfil tributario (flags: IVA, IRAE, IRPF Cat I, IRPF Cat II, BPS empleador, FONASA, CJPPU, Fondo Solidaridad), estado, fecha inicio actividades`

> La relación `Cliente → Contador` es clave para el modelo multi-contador futuro. Desde el MVP, cada cliente pertenece a un contador específico.

### Credencial
`id, clienteId (FK), plataforma, usuario, contraseña (encriptada AES-256), PIN, notas, vigente`

### Vencimiento
`id, clienteId (FK), tipo (IVA/IRAE/IRPF/BPS/etc.), fecha, estado (pendiente/completado/alertado), notas`

### BoletoPago
`id, clienteId (FK), tipo impuesto, período (mes/año), monto, estado, fecha emisión, fecha pago, quién confirmó pago`

### Honorario
`id, clienteId (FK), período, montoAcordado, montoCobrado, fechaCobro, formaPago, estado`

### Movimiento (Ventas / Compras / Gastos)
`id, clienteId (FK), tipo (venta/compra/gasto), fecha, descripción, monto, IVA incluido, categoría, adjunto`

### Consulta
`id, clienteId (FK), usuarioOrigen, texto, fecha, estado (abierta/respondida), respuesta, adjunto`

### Notificacion
`id, usuarioId (FK), tipo, mensaje, leído, fecha`

---

## 9. Consideraciones de Seguridad

- Las credenciales de clientes se almacenan encriptadas con AES-256.
- Autenticación con JWT de corta duración + refresh tokens rotatorios.
- HTTPS obligatorio. Variables de entorno para todos los secretos.
- Acceso por roles — el cliente sólo ve sus propios datos, sin acceso a otros clientes ni credenciales.
- Log de auditoría: quién accedió a credenciales y cuándo.
- Backups automáticos de PostgreSQL.

---

## 10. Próximos Pasos

- Definir wireframes / mockups de pantallas principales.
- Diseñar el modelo de base de datos completo con relaciones, restricciones e índices.
- Crear scaffolding del proyecto (NestJS + React + PostgreSQL con Docker Compose).
- Comenzar desarrollo del MVP: módulo de clientes + credenciales + vencimientos.
- Definir reglas del calendario tributario uruguayo (fechas DGI/BPS por terminal de RUT).

---

*ContaApp — MK Studios · Lucas Martino · 2026*
