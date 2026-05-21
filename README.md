# Ztocky — Smart Procurement & Autonomous Inventory

**Ztocky** es un gestor de compras y stock que no solo muestra datos:
**analiza ventas, proyecta agotamientos y decide cuándo, cuánto y a quién comprar**.

El sistema conecta ventas históricas, stock actual y proveedores con sus condiciones para automatizar el reabastecimiento antes de que el usuario tenga que reaccionar.

---

## 🎯 Objetivo

Eliminar la gestión manual del stock mediante un motor que:

- Predice cuándo un producto se quedará sin unidades
- Genera alertas de reposición automáticas
- Selecciona el mejor proveedor según contexto
- Permite consultar los datos con lenguaje natural (IA — próximamente)

---

## 🧠 Concepto Central

Un sistema tradicional dice:

> "Te quedan 5 unidades."

Ztocky dice:

> "Al ritmo actual, te quedarás sin stock el martes.
> El proveedor tarda 3 días. Debo generar la orden hoy."

---

## Estado Actual (MVP) ✅

| Funcionalidad                                                    | Estado          |
| ---------------------------------------------------------------- | --------------- |
| CRUD productos, ventas, proveedores, órdenes de compra           | Completo        |
| Motor de burn rate y reorder-check                               | Completo        |
| Alertas automáticas (crítico, bajo stock, estancado)             | Completo        |
| Deducción/restauración de stock en ventas                        | Completo        |
| Catálogo de proveedores con precios por producto                 | Completo        |
| Órdenes de compra con incremento de stock al recibir             | Completo        |
| Seed realista (10 productos, 3 proveedores, 90 días ventas)      | Completo        |
| Dashboard con KPIs, tabla de agotamientos, acciones recomendadas | Completo        |
| Búsqueda global en tiempo real                                   | Completo        |
| Simulador de demanda                                             | Completo        |
| Consola IA (frontend)                                            | Esqueleto listo |
| Multi-tenant con workspaces y roles                              | Completo        |
| Autenticación propia con scrypt + cookies 30 días                | Completo        |

---

## 🧱 Stack Tecnológico

| Capa               | Tecnología                               |
| ------------------ | ---------------------------------------- |
| Backend & Frontend | **Next.js 16** + React 19                |
| Base de datos      | **PostgreSQL** (Neon)                    |
| ORM                | **Prisma 7** + Neon Adapter              |
| UI                 | **shadcn/ui** + Tailwind CSS v4 + Lucide |
| Auth               | Scrypt propio (sin NextAuth)             |
| Email              | Resend (integrado, pendiente de uso)     |
| IA                 | Groq SDK (backend por conectar)          |

---

## 🧩 Módulos del Sistema

### 1. Motor de Reabastecimiento Inteligente

- Cálculo automático del **burn rate** (ventas por día en 30 días)
- Proyección de agotamiento según stock y ventas
- Consideración del **lead time** del proveedor
- Alerta cuando `dias_restantes <= lead_time`

### 2. Agente Inteligente de Proveedores

- Catálogo con precios, tiempos y contacto por producto
- Comparación entre proveedores para un mismo producto
- Selección contextual (precio vs urgencia)

### 3. Dashboard de Datos + Consola IA

- Tablas filtrables por riesgo, stock estancado, margen
- Consola IA para consultar en lenguaje natural:
  - "¿Qué producto no se vendió en 30 días?"
  - "¿Cuál me hizo perder más dinero este mes?"
- Traducción: lenguaje natural → SQL → reporte

---

## 🗄️ Modelo de Datos

### `products`

| Campo         | Tipo    | Descripción         |
| ------------- | ------- | ------------------- |
| id            | UUID    | Identificador       |
| name          | String  | Nombre del producto |
| sku           | String  | Código único        |
| current_stock | Int     | Unidades actuales   |
| min_stock     | Int     | Mínimo sugerido     |
| cost_price    | Decimal | Costo por unidad    |
| selling_price | Decimal | Precio de venta     |
| category      | String? | Categoría           |
| workspace_id  | UUID?   | Tenant              |

### `sales`

| Campo        | Tipo    | Descripción           |
| ------------ | ------- | --------------------- |
| id           | UUID    | Identificador         |
| product_id   | UUID    | Relación con producto |
| sale_date    | Date    | Fecha de la venta     |
| quantity     | Int     | Unidades vendidas     |
| unit_price   | Decimal | Precio unitario       |
| total_amount | Decimal | Monto total           |

### `suppliers`

| Campo         | Tipo    | Descripción              |
| ------------- | ------- | ------------------------ |
| id            | UUID    | Identificador            |
| name          | String  | Nombre del proveedor     |
| lead_time     | Int     | Días promedio de entrega |
| shipping_cost | Decimal | Costo logístico          |
| contact_email | String? | Email de contacto        |
| contact_phone | String? | Teléfono                 |
| reliability   | Float   | Rating 1-5               |

### `catalog_items`

| Campo         | Tipo    | Descripción                            |
| ------------- | ------- | -------------------------------------- |
| id            | UUID    | Identificador                          |
| supplier_id   | UUID    | Proveedor                              |
| product_id    | UUID    | Producto                               |
| unit_price    | Decimal | Precio del proveedor para ese producto |
| min_order_qty | Int     | Cantidad mínima de pedido              |

### `purchase_orders`

| Campo           | Tipo    | Descripción                                               |
| --------------- | ------- | --------------------------------------------------------- |
| id              | UUID    | Identificador                                             |
| supplier_id     | UUID    | Proveedor seleccionado                                    |
| status          | Enum    | DRAFT / SENT / CONFIRMED / SHIPPED / RECEIVED / CANCELLED |
| total_amount    | Decimal | Monto total                                               |
| generated_by_ai | Boolean | Generada automáticamente                                  |

### `alerts`

| Campo       | Tipo    | Descripción                                                                |
| ----------- | ------- | -------------------------------------------------------------------------- |
| id          | UUID    | Identificador                                                              |
| product_id  | UUID    | Producto relacionado                                                       |
| type        | Enum    | LOW_STOCK / CRITICAL_STOCK / STAGNANT_STOCK / PRICE_CHANGE / SUPPLIER_RISK |
| message     | String  | Descripción de la alerta                                                   |
| is_read     | Boolean | Leída                                                                      |
| is_resolved | Boolean | Resuelta                                                                   |
| metadata    | JSON    | Datos adicionales (burn rate, días, etc.)                                  |

---

## ⚙️ Lógica del Motor Inteligente

### Cálculo de Burn Rate

```
burn_rate = unidades_vendidas_últimos_30_días / 30
dias_restantes = stock_actual / burn_rate
```

### Condición de alerta

```
si stock_actual < 5                      → CRITICAL_STOCK
si stock_actual < min_stock              → LOW_STOCK
si sin ventas en últimos 30 días         → STAGNANT_STOCK
si dias_restantes <= lead_time           → sugerir reorden
```

### Stock transaccional

- **Venta**: descuenta stock en una transacción atómica
- **Eliminar venta**: restaura stock automáticamente
- **Editar venta**: ajusta stock según la diferencia de cantidad
- **Orden recibida**: incrementa stock al marcar como RECEIVED
- **Protección**: no se eliminan órdenes ya recibidas

---

## 🧪 Simulador de Escenarios

Permite proyectar demanda futura usando datos reales:

> "¿Qué pasa si vendo un 30% más el próximo mes?"

El sistema recalcula el burn rate proyectado y muestra qué productos colapsan primero.

---

## 🤖 IA Query Engine (próximamente)

Flujo:

1. Usuario escribe consulta en lenguaje natural
2. LLM (Groq) traduce a SQL
3. Se ejecuta contra la base de datos
4. Se devuelve tabla o reporte estructurado

---

## 🖥️ Vistas del Dashboard

- **KPIs**: riesgo crítico, órdenes pendientes, stock estancado, ahorro potencial
- **Próximos agotamientos**: productos en riesgo con urgencia y cantidad sugerida
- **Acciones recomendadas**: checklist dinámico basado en datos reales
- **Productos**: tabla CRUD con importar/exportar CSV
- **Ventas**: listado con deducción de stock y totales
- **Proveedores**: tabla con catálogo vinculado por producto
- **Órdenes de compra**: gestión de estados con incremento de stock
- **Alertas**: listado con acciones marcar leída / resolver
- **Simulador**: proyección de demanda por producto
- **Consola IA**: interfaz de consultas en lenguaje natural
- **Búsqueda global**: resultados en tiempo real multi-entidad
- **Configuración**: perfil, datos de cuenta, zona de peligro

---

## 🚀 Primeros Pasos

```bash
# Clonar e instalar
git clone https://github.com/NahueAdema/Ztocky.git
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con DATABASE_URL y GROQ_API_KEY

# Inicializar base de datos
npx prisma migrate dev --name init
npm run seed

# Iniciar desarrollo
npm run dev
```

---

## 🧭 Roadmap

| Fase | Objetivo                                           | Estado       |
| ---- | -------------------------------------------------- | ------------ |
| 1    | Modelo de datos + CRUD + seed + dashboard          | ✅ Completo  |
| 2    | Alertas + motor de reorden + catálogo proveedores  | ✅ Completo  |
| 3    | Generación automática de órdenes + email           | ⏳ Pendiente |
| 4    | Consola IA con Groq (lenguaje natural → SQL)       | ⏳ Pendiente |
| 5    | Predicción de demanda + recomendaciones de pricing | 🔮 Futuro    |

---

## 🧩 Filosofía

Ztocky no es un sistema de stock.

Es un **sistema de decisiones automáticas basado en datos reales**.

---

## Arquitectura

```
app/
  api/dashboard/      → API REST (productos, ventas, proveedores, órdenes, alertas, catálogo)
  api/auth/           → Autenticación (login, logout, registro, perfil)
  api/analysis/       → Motor de análisis (reorder-check)
  dashboard/          → Páginas del dashboard
  login/              → Página de login
  admin/              → Panel de administración

components/
  layout/             → Sidebar, header, shells
  ui/                 → shadcn/ui components

lib/
  auth.ts             → Autenticación con scrypt
  data/inventory.ts   → Capa de acceso a datos
  mock-data.ts        → Datos de respaldo mock
  env.ts              → Validación de variables de entorno
  ai/                 → Motor de IA (Groq)
  mail.ts             → Cliente de email (Resend)

prisma/
  schema.prisma       → 11 modelos, 5 enums
  seed.ts             → Seed con datos realistas
```
