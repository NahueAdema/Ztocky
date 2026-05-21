# Arquitectura de Ztocky

## Flujo de Datos

```
Usuario → Next.js RSC → Prisma → PostgreSQL (Neon)
                ↓
         API REST (server actions)
                ↓
         UI React (shadcn/ui)
```

## Modelos Clave

### Núcleo del negocio

- **Product** → stock actual, precios, categoría
- **Sale** → ventas históricas, calcula burn rate
- **Supplier** → lead time, costo de envío, confiabilidad
- **CatalogItems** → vincula producto con proveedor y su precio
- **PurchaseOrder** → órdenes con estado (DRAFT → SENT → RECEIVED)
- **Alert** → alertas automáticas con tipo y metadata

### Multi-tenant

- **Workspace** → agrupa productos/proveedores/órdenes/alertas
- **WorkspaceMember** → usuarios con rol dentro del workspace
- **User** → rol global (USER / SUPER_ADMIN)

## Motor de Reorden

El endpoint `/api/analysis/reorder-check`:

1. Obtiene todos los productos del workspace
2. Calcula ventas de los últimos 30 días por producto
3. Determina burn rate (unidades/día)
4. Calcula días hasta agotamiento (stock / burn rate)
5. Clasifica urgencia según días restantes vs lead time del proveedor
6. Sugiere cantidad a comprar

## Alertas

Se generan vía `POST /api/dashboard/alerts` con deduplicación de 24h:

- **CRITICAL_STOCK**: stock < 5 unidades
- **LOW_STOCK**: stock < mínimo sugerido
- **STAGNANT_STOCK**: sin ventas en > 30 días

## Stock Transaccional

- **Venta**: POST → descuenta stock en transacción atómica
- **Eliminar venta**: DELETE → restaura stock
- **Editar venta**: PATCH → ajusta stock según diferencia de cantidad
- **Orden recibida**: PATCH a status RECEIVED → incrementa stock
- **Cambiar status**: si sale de RECEIVED → descuenta stock
