# Arquitectura de Ztocky

## Estructura del Proyecto

```
app/
  api/
    admin/            → Gestión de usuarios, sesiones y workspaces (SUPER_ADMIN)
    admin/users/      → CRUD + suspender/reactivar + cambiar rol
    ai/query/         → Consultas en lenguaje natural con Groq
    analysis/reorder-check/ → Motor de análisis de reorden
    auth/             → Login, registro, perfil, contraseña, verificación email
    auth0/            → Google OAuth vía Auth0
    dashboard/        → API REST principal (scoped al workspace)
      products/       → CRUD + búsqueda por SKU
      sales/          → CRUD con ajuste transaccional de stock
      suppliers/      → CRUD
      catalog/        → CRUD + importación CSV de precios
      purchase-orders/ → CRUD + transiciones de estado
      alerts/         → CRUD + generación automática con dedup
      import/         → Importación CSV (productos, ventas, proveedores)
      export/         → Exportación CSV (productos)
  dashboard/          → Páginas protegidas (12 vistas)
    products/         → CRUD + importar/exportar CSV + escáner
    sales/            → CRUD + importación CSV masiva + undo
    suppliers/        → CRUD + catálogo vinculado
    purchase-orders/  → Ciclo completo de estados + PDF inline
    alerts/           → Alertas automáticas con acciones
    simulator/        → Proyección de escenarios de demanda
    ai-console/       → Consola de lenguaje natural con Groq
    search/           → Búsqueda global multi-entidad
    scan/             → Escáner de código de barras (cámara + manual)
    settings/         → Perfil, email, contraseña
  admin/              → Panel de administración (usuarios, sesiones, workspaces)
  login/              → AuthCard (login + registro)
```

## Flujo de Datos

```
Usuario → Next.js (App Router) → API Route → Prisma → PostgreSQL (Neon)
                ↓
         Server Components / Client Components
                ↓
         UI con shadcn/ui + Tailwind v4
```

### Capa de autenticación

```
Request → middleware.ts → ¿cookie session? → sí → pasa a dashboard/admin
                                        → no → redirect a /login
```

- Sessions con token hash en DB + cookie HTTP-only de 30 días
- Scrypt para hash de contraseñas
- Roles: USER / SUPER_ADMIN (global), OWNER / ADMIN / MEMBER (por workspace)

## Modelos Clave

### Núcleo del negocio

- **Product** → stock actual, precios, categoría, SKU único
- **Sale** → ventas históricas con fecha, calcula burn rate
- **Supplier** → lead time, costo de envío, confiabilidad
- **CatalogItems** → vincula producto-proveedor con precio y cantidad mínima
- **PurchaseOrder** → órdenes con items + estado
- **PurchaseOrderItem** → producto, cantidad, precio unitario dentro de una OC
- **Alert** → alertas automáticas con tipo, metadata JSON y producto asociado

### Multi-tenant

- **Workspace** → agrupa productos, proveedores, órdenes, alertas
- **WorkspaceMember** → usuario con rol dentro del workspace
- **User** → rol global (USER / SUPER_ADMIN)

## Motor de Reorden

Endpoint: `GET /api/analysis/reorder-check`

1. Obtiene todos los productos del workspace activos
2. Calcula ventas de los últimos 30 días por producto
3. Determina burn rate (unidades/día)
4. Calcula días hasta agotamiento (stock / burn rate)
5. Clasifica urgencia: critical / warning / stable
6. Sugiere cantidad a comprar según lead time y mínimo sugerido
7. Retorna también productos sin ventas (stagnant)

## Alertas

Se generan vía `POST /api/dashboard/alerts` con deduplicación de 24h:

- **CRITICAL_STOCK**: stock < 5 unidades
- **LOW_STOCK**: stock < mínimo sugerido
- **STAGNANT_STOCK**: sin ventas en > 30 días
- **PRICE_CHANGE**: cambio de precio significativo en catálogo
- **SUPPLIER_RISK**: lead time + riesgo combinado

## Stock Transaccional

Cada operación que afecta stock se maneja en una transacción atómica de Prisma:

- **Venta** (POST /sales): descuenta stock
- **Eliminar venta** (DELETE /sales/[id]): restaura stock
- **Editar venta** (PATCH /sales/[id]): ajusta stock según diferencia de cantidad
- **Orden recibida** (PATCH /purchase-orders/[id] → RECEIVED): incrementa stock
- **Salir de RECEIVED** (PATCH → otro status): descuenta stock
- **Protección**: no se eliminan órdenes ya recibidas

## Órdenes de Compra — Ciclo de Estados

```
DRAFT → SENT → CONFIRMED → SHIPPED → RECEIVED (+stock)
  ↓       ↓        ↓          ↓
CANCELLED (se puede reabrir a DRAFT)
```

Cada transición valida:
- Solo SENT puede ir a CONFIRMED
- Solo RECEIVED incrementa stock
- CANCELLED permite reabrir a DRAFT

## Importación CSV

Soporta 3 entidades: productos, ventas, proveedores.

Flujo general:
1. Usuario sube archivo CSV
2. Backend parsea y valida columnas según tipo
3. Para catálogo: preview con diff (nuevos, cambios, sin cambios)
4. Usuario confirma → se persisten los cambios en DB

## Consola IA

- Backend: Groq SDK con modelo Llama 3.3 70B
- Contexto: se envían datos reales del dashboard (productos, ventas, stock)
- Prompt optimizado para español argentino y dominio de inventario
- Frontend: interfaz tipo chat con queries de ejemplo predefinidas

## Escáner de Código de Barras

- API BarcodeDetector (cámaras compatibles) + entrada manual
- Lookup por SKU vía `GET /api/dashboard/products/by-sku?sku=XXX`
- Si no existe, formulario inline para crear producto y registrar venta
- Registro de venta instantáneo con verificación de stock disponible

## Búsqueda Global

- Endpoint unificado que busca en productos, proveedores y órdenes de compra
- Resultados en tiempo real con debounce
- Compartible vía query params en URL

## Simulador de Demanda

- Toma datos reales de ventas y stock
- Aplica porcentaje de aumento/disminución de demanda
- Recalcula burn rate proyectado y días restantes
- Identifica productos que colapsarían (<7 días)

## Panel de Administración

- Accesible solo para SUPER_ADMIN
- Métricas globales: usuarios, workspaces, sesiones activas
- Gestión de usuarios: suspender, reactivar, cambiar rol
- Monitoreo de sesiones activas y expiradas
- Listado de workspaces con cantidad de miembros
