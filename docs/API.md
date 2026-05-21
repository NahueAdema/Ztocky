# API REST de Ztocky

Todas las rutas bajo `/api/dashboard/` requieren sesión activa y están scoped al workspace del usuario autenticado.

## Productos

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/dashboard/products | Listar productos     |
| POST   | /api/dashboard/products | Crear producto       |
| PATCH  | /api/dashboard/products/[id] | Actualizar producto |
| DELETE | /api/dashboard/products/[id] | Eliminar producto |

## Ventas

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/dashboard/sales | Listar ventas (limit=50) |
| POST   | /api/dashboard/sales | Registrar venta (descuesta stock) |
| PATCH  | /api/dashboard/sales/[id] | Editar venta (ajusta stock) |
| DELETE | /api/dashboard/sales/[id] | Eliminar venta (restaura stock) |

## Proveedores

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/dashboard/suppliers | Listar proveedores   |
| POST   | /api/dashboard/suppliers | Crear proveedor      |
| PATCH  | /api/dashboard/suppliers/[id] | Actualizar proveedor |
| DELETE | /api/dashboard/suppliers/[id] | Eliminar proveedor |

## Catálogo

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/dashboard/catalog | Listar items del catálogo |
| POST   | /api/dashboard/catalog | Vincular producto-proveedor |
| PATCH  | /api/dashboard/catalog/[id] | Actualizar precio/ cantidad mínima |
| DELETE | /api/dashboard/catalog/[id] | Desvincular |

## Órdenes de Compra

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/dashboard/purchase-orders | Listar órdenes |
| POST   | /api/dashboard/purchase-orders | Crear orden con items |
| PATCH  | /api/dashboard/purchase-orders/[id] | Cambiar estado (RECEIVED → +stock) |
| DELETE | /api/dashboard/purchase-orders/[id] | Eliminar (bloqueado si RECEIVED) |

## Alertas

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/dashboard/alerts | Listar alertas         |
| POST   | /api/dashboard/alerts | Generar alertas automáticas con dedup 24h |
| PATCH  | /api/dashboard/alerts/[id] | Marcar como leída/resuelta |

## Auth

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/auth/me       | Perfil del usuario actual |
| PATCH  | /api/auth/me       | Actualizar perfil        |
| POST   | /api/auth/register | Registro (primer usuario = SUPER_ADMIN) |
| POST   | /api/auth/login    | Iniciar sesión (cookie 30 días) |
| POST   | /api/auth/logout   | Cerrar sesión            |

## Importación

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| POST   | /api/dashboard/import | Importar CSV (productos, proveedores, ventas) |

## Análisis

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| GET    | /api/analysis/reorder-check | Productos en riesgo de agotamiento |
