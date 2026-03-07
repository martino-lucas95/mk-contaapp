# ContaApp — Plan de Desarrollo

> Última actualización: 2026-03-07 · v1.1.0 en producción

---

## Estado actual

### ✅ Módulos completados (en producción)

| Módulo | Archivo | Estado |
|--------|---------|--------|
| Layout + Sidebar (roles + temas) | `Layout.tsx` | ✅ |
| Login | `LoginPage.tsx` | ✅ |
| Admin Dashboard | `AdminDashboard.tsx` | ✅ |
| Admin Contadores | `ContadoresPage.tsx` | ✅ |
| Dashboard contador (KPIs) | `DashboardPage.tsx` | ✅ |
| Clientes (listado + CRUD) | `ClientsPage.tsx` | ✅ |
| Detalle cliente (tabs) | `ClientDetailPage.tsx` | ✅ |
| Calendario de vencimientos | `CalendarPage.tsx` | ✅ |
| Credenciales global | `CredentialsPage.tsx` | ✅ |
| Honorarios (CRUD + pago) | `HonorariosPage.tsx` | ✅ |
| Movimientos contables + IVA | `MovimientosPage.tsx` | ✅ |
| Notificaciones | `NotificationsPage.tsx` | ✅ |
| Portal del cliente | `ClientPortalPage.tsx` | ✅ |

### Rutas registradas

```
/login  /  /admin  /admin/contadores  /dashboard
/clients  /clients/:id  /calendar  /credentials
/honorarios  /notifications  /movimientos  /portal
```

---

## Cambios aplicados en v1.1.0

### Fix theming `ClientDetailPage`
- `CredField` y `HonField` ya no usan colores hardcodeados (`#6D28D9`, `#2563eb`)
- Ahora consumen `useThemeStore()` directamente — respetan los 3 temas (light/blue/dark)

### Responsive mobile — tablas → cards/listas

| Página | Cambio |
|--------|--------|
| `ClientsPage` | Lista mobile de cards con avatar, estado y acciones inline |
| `CalendarPage` | Cards con borde lateral de color según estado |
| `CredentialsPage` | Grid 1 columna en mobile (ya era cards) |
| `ClientDetailPage` | Tabs con scroll horizontal, padding responsive |
| `DashboardPage` | KPIs 2 columnas en mobile, lista compacta de vencimientos |

Todos los cambios usan el hook reactivo `useIsMobile(768)` — responde a resize.

---

## Pendientes conocidos

### Issues técnicos
- [ ] **Portal cliente** — validar flujo completo con cuenta `maria@fernandez.uy` / `demo123`
- [ ] **Módulo boletos** — backend `/api/v1/payments` completo; verificar si `ClientPortalPage` consume `confirmar-pago`

---

## Roadmap

| # | Feature | Prioridad | Notas |
|---|---------|-----------|-------|
| R3 | **Exportación PDF/Excel** | 🔴 Alta | Honorarios, movimientos, vencimientos por cliente |
| R4 | **Boletos automáticos desde vencimientos** | 🔴 Alta | Backend `payments` ya existe |
| R1 | Mensajería contador ↔ cliente | 🟡 Media | WebSocket o polling |
| R2 | Notificaciones push (WebSocket/SSE) | 🟡 Media | Reemplazar polling actual |
| R5 | Integración DGI WebService | 🟢 Baja | Consulta estado contribuyente |
| R6 | Multi-contador | 🟢 Baja | Un estudio con N contadores |

### Próximos pasos (orden validado)

1. ✅ ~~Fix theming `ClientDetailPage`~~ — hecho en v1.1.0
2. ✅ ~~Responsive mobile — tablas → cards~~ — hecho en v1.1.0
3. Validar portal del cliente con cuenta `cliente`
4. **Exportación PDF/Excel** — empezar por honorarios del cliente
5. Boletos automáticos desde vencimientos

---

## Notas técnicas

- **Stack**: React + TypeScript (frontend) / NestJS + TypeORM + PostgreSQL (backend)
- **Deploy**: Kubernetes, namespace `contaapp`, `sudo ./deploy.sh all` desde `~/mk-contaapp`
- **URL producción**: https://contapp.mkstudios.net
- **Backend entity**: `nombre` y `apellido` son `NOT NULL` — siempre aplicar fallback en frontend
- **Logs**: `sudo kubectl logs deployment/contaapp-backend -n contaapp --tail=50`
- **Versiones**: `versions.env` — actualmente `1.1.0`
- **PWA**: VitePWA genera `manifest.webmanifest` automáticamente en build
- **Token GitHub**: ⚠️ revocar en github.com → Settings → Developer settings → Personal access tokens
