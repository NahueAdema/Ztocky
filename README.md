# Ztocky — Gestión inteligente de stock y compras

**Ztocky** analiza ventas, proyecta agotamientos y decide cuándo, cuánto y a quién comprar. Conecta ventas históricas, stock actual y proveedores para automatizar el reabastecimiento antes de que el usuario tenga que reaccionar.

```
Stock actual: 12 unidades
Burn rate: 4 unid/día
Días restantes: 3
Lead time del proveedor: 5 días → ¡ALERTA!
```

---

## Estado Actual (MVP)

| Funcionalidad | Estado |
|---|---|
| CRUD productos, ventas, proveedores, órdenes de compra | ✅ Completo |
| Motor de burn rate y reorder-check | ✅ Completo |
| Alertas automáticas (crítico, bajo stock, estancado) | ✅ Completo |
| Deducción/restauración de stock en ventas (transaccional) | ✅ Completo |
| Catálogo de proveedores con precios por producto | ✅ Completo |
| Importación de precios desde CSV (preview + aplicar) | ✅ Completo |
| Órdenes de compra con ciclo completo de estados + incremento stock | ✅ Completo |
| Seed realista (10 productos, 3 proveedores, 90 días ventas) | ✅ Completo |
| Dashboard con KPIs, tabla de agotamientos, acciones recomendadas | ✅ Completo |
| Búsqueda global multi-entidad (productos, proveedores, OC) | ✅ Completo |
| Simulador de escenarios de demanda | ✅ Completo |
| Escáner de código de barras (cámara + manual + venta rápida) | ✅ Completo |
| Consola IA con Groq (consultas en lenguaje natural) | ✅ Completo |
| Panel de administración (usuarios, sesiones, workspaces) | ✅ Completo |
| Multi-tenant con workspaces y roles (OWNER/ADMIN/MEMBER) | ✅ Completo |
| Autenticación propia (scrypt + cookies 30 días) | ✅ Completo |
| Auth0 Google OAuth | ✅ Completo |
| Importación CSV de ventas y proveedores | ✅ Completo |
| Exportación de productos a CSV | ✅ Completo |
| Recuperación de contraseña + verificación de email | ✅ Completo |
| **Sistema de feedback comercio → admin** | ⏳ Fase 1.5 |
| **Link público de precios para proveedores** | ⏳ Fase 2 |
| **WhatsApp Bot para actualización de precios** | ⏳ Fase 3 |
| **Red de proveedores (marketplace inverso)** | ⏳ Fase 4 |

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend & Frontend | **Next.js 16** + React 19 |
| Base de datos | **PostgreSQL** (Neon serverless) |
| ORM | **Prisma 7** + Neon Adapter |
| UI | **shadcn/ui** + Tailwind CSS v4 + Lucide icons |
| Auth | Scrypt propio + Auth0 (Google OAuth) |
| Email | Resend + Nodemailer (Gmail fallback) |
| IA | **Groq SDK** (Llama 3.3 70B) |
| Lenguaje | TypeScript |

---

## Fases del proyecto

Cada fase tiene sus tareas detalladas con checkboxes en [`etapas.md`](./etapas.md).

| Fase | Objetivo | Estado |
|---|---|---|
| **1** | Subir listas (MVP) — CRUD, stock, CSV, catálogo, alertas, OC | ✅ Completo |
| **1.5** | Feedback de usuarios + IA explicativa + mejoras UX | ⏳ En desarrollo |
| **2** | Link público de precios para proveedores | ⏳ Pendiente |
| **3** | Precios por WhatsApp (bot con Twilio) | ⏳ Pendiente |
| **4** | Red de proveedores (marketplace inverso) | 🔮 Futuro |

---

## Vistas del Dashboard

| Vista | Descripción |
|---|---|
| **Inicio** | KPIs: riesgo crítico, órdenes pendientes, stock estancado, ahorro potencial. Tabla de próximos agotamientos con urgencia. Acciones recomendadas dinámicas. |
| **Productos** | CRUD completo, búsqueda en tiempo real, importar/exportar CSV, escáner de barras. |
| **Ventas** | CRUD con deducción automática de stock, edición ajusta stock, eliminar restaura. Importación CSV masiva. |
| **Proveedores** | CRUD con catálogo vinculado por producto, lead time, costo envío, rating. |
| **Órdenes de Compra** | Ciclo completo DRAFT→SENT→CONFIRMED→SHIPPED→RECEIVED, PDF inline, incremento stock al recibir. |
| **Alertas** | Generación automática con dedup 24h, marcar leída/resolver. |
| **Simulador** | Proyección de demanda futura, colapsos en <7 días. |
| **Consola IA** | Consultas en lenguaje natural con Groq. |
| **Búsqueda** | Resultados multi-entidad en tiempo real (productos, proveedores, OC). |
| **Escáner** | Código de barras por cámara + ingreso manual, venta instantánea. |
| **Configuración** | Perfil, CUIT/CUIL, verificación email, cambio de contraseña. |
| **Admin** | Usuarios, sesiones activas, workspaces, métricas del sistema. |

---

## Primeros Pasos

```bash
git clone https://github.com/NahueAdema/Ztocky.git
npm install
cp .env.example .env   # Editar DATABASE_URL, GROQ_API_KEY, etc.
npx prisma migrate dev --name init
npm run seed
npm run dev
```

---

## Arquitectura

```
app/
  api/dashboard/      → API REST (productos, ventas, proveedores, OC, alertas, catálogo)
  api/auth/           → Autenticación (login, registro, perfil, password)
  api/analysis/       → Motor de reorder-check
  api/ai/             → Consultas con Groq
  api/admin/          → Gestión de usuarios/admin
  dashboard/          → Páginas protegidas del dashboard (12 vistas)
  admin/              → Panel de administración
  login/              → Login / registro

components/
  layout/             → Sidebar, header, dashboard-shell, admin-shell
  ui/                 → shadcn/ui (button, card, input, badge)

lib/
  auth.ts             → Scrypt + sesiones + cookies
  data/inventory.ts   → Capa de acceso a datos del dashboard
  data/admin.ts       → Capa de acceso a datos de admin
  ai/groq.ts          → Cliente Groq SDK
  mail.ts             → Resend + Nodemailer

prisma/
  schema.prisma       → 10 modelos, 5 enums
  seed.ts             → Seed realista
```

Ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para más detalle.

---

## Documentación

| Archivo | Contenido |
|---|---|
| [`etapas.md`](./etapas.md) | Plan de desarrollo detallado por fases con checkboxes |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitectura, data flow, multi-tenant, lógica del motor |
| [`docs/API.md`](./docs/API.md) | Referencia completa de la API REST |
| [`docs/SEED.md`](./docs/SEED.md) | Detalle de los datos de seed |
