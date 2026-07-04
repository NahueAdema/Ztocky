# API REST de Ztocky

Todas las rutas bajo `/api/dashboard/` requieren sesión activa y están scoped al workspace del usuario autenticado.

---

## Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/products` | Listar productos (con filtros: search, category, isActive) |
| POST | `/api/dashboard/products` | Crear producto |
| GET | `/api/dashboard/products/by-sku?sku=XXX` | Buscar producto por SKU (para escáner) |
| PATCH | `/api/dashboard/products/[id]` | Actualizar producto |
| DELETE | `/api/dashboard/products/[id]` | Eliminar producto |

## Ventas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/sales` | Listar ventas (limit=50, ordenadas por fecha descendente) |
| POST | `/api/dashboard/sales` | Registrar venta (descuenta stock atómicamente) |
| PATCH | `/api/dashboard/sales/[id]` | Editar venta (ajusta stock por diferencia) |
| DELETE | `/api/dashboard/sales/[id]` | Eliminar venta (restaura stock) |

## Proveedores

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/suppliers` | Listar proveedores |
| POST | `/api/dashboard/suppliers` | Crear proveedor |
| PATCH | `/api/dashboard/suppliers/[id]` | Actualizar proveedor |
| DELETE | `/api/dashboard/suppliers/[id]` | Eliminar proveedor |

## Catálogo de Proveedores

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/catalog` | Listar items del catálogo |
| POST | `/api/dashboard/catalog` | Vincular producto con proveedor (precio + cantidad mínima) |
| PATCH | `/api/dashboard/catalog/[id]` | Actualizar precio / cantidad mínima |
| DELETE | `/api/dashboard/catalog/[id]` | Desvincular producto-proveedor |
| POST | `/api/dashboard/catalog/import` | Importar precios desde CSV (preview + aplicar) |

## Órdenes de Compra

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/purchase-orders` | Listar órdenes con items |
| POST | `/api/dashboard/purchase-orders` | Crear orden con items |
| PATCH | `/api/dashboard/purchase-orders/[id]` | Cambiar estado (RECEIVED → +stock) |
| DELETE | `/api/dashboard/purchase-orders/[id]` | Eliminar orden (bloqueado si RECEIVED) |

### Transiciones de estado

```
DRAFT → SENT → CONFIRMED → SHIPPED → RECEIVED (+stock)
CANCELLED → DRAFT (reabrir)
```

## Alertas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/alerts` | Listar alertas (activas/resueltas) |
| POST | `/api/dashboard/alerts` | Generar alertas automáticas con dedup 24h |
| PATCH | `/api/dashboard/alerts/[id]` | Marcar como leída o resuelta |

## Importación / Exportación CSV

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/dashboard/import` | Importar CSV (products, sales, suppliers) |
| GET | `/api/dashboard/export/products` | Exportar productos a CSV |

## Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (primer usuario = SUPER_ADMIN) |
| POST | `/api/auth/login` | Iniciar sesión (cookie 30 días) |
| POST | `/api/auth/logout` | Cerrar sesión (elimina cookie + session de DB) |
| GET | `/api/auth/me` | Obtener perfil del usuario actual |
| PATCH | `/api/auth/me` | Actualizar perfil (name, cuitCuil) |
| PATCH | `/api/auth/password` | Cambiar contraseña (requiere contraseña actual) |
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña (envía email) |
| POST | `/api/auth/reset-password` | Ejecutar reset con token |
| GET | `/api/auth/verify-email` | Verificar email con token |
| POST | `/api/auth/resend-verification-email` | Reenviar email de verificación |

## Auth0 (Google OAuth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/auth0/login` | Redirigir a Auth0 Google login |
| GET | `/api/auth0/logout` | Cerrar sesión de Auth0 |

## IA

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ai/query` | Consulta en lenguaje natural → Groq LLM → respuesta estructurada |

## Análisis

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/analysis/reorder-check` | Productos en riesgo de agotamiento con urgencia |

## Administración (solo SUPER_ADMIN)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/users` | Listar todos los usuarios |
| PATCH | `/api/admin/users/[id]` | Suspendender / reactivar / cambiar rol |
| GET | `/api/admin/sessions` | Listar sesiones activas |
| GET | `/api/admin/workspaces` | Listar workspaces con miembros |
