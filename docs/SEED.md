# Seed de Datos

## Qué Genera

Ejecutando `npm run seed` se crea:

- **1 super admin** (si se configuran `SUPER_ADMIN_EMAIL` y `SUPER_ADMIN_PASSWORD` en .env)
- **10 productos** con nombres realistas
- **3 proveedores**
- **13 items de catálogo** vinculando productos con proveedores y precios
- **90 días de ventas** por producto (~900 ventas totales) con variación realista:
  - Factor de fin de semana (más ventas sábado/domingo)
  - Factor de semana de pago (más ventas del 1-10 de cada mes)
  - Onda estacional con pico cada ~30 días
  - Variación aleatoria del 30%

## Productos y Stocks

| Producto | SKU | Stock | Mínimo | Precio costo | Precio venta | Categoría |
|---|---|---|---|---|---|---|
| Cafe Brasil 1kg | CAF-001 | 18 | 24 | $7,400 | $11,800 | Almacen |
| Yerba organica 500g | YER-014 | 42 | 20 | $2,100 | $3,900 | Almacen |
| Aceite oliva extra virgen | ACE-090 | 7 | 14 | $5,600 | $8,300 | Gourmet |
| Conserva tomates perita | CON-032 | 120 | 40 | $920 | $1,550 | Almacen |
| Azucar blanca 1kg | AZU-005 | 65 | 30 | $1,200 | $2,100 | Almacen |
| Fideos spaghetti 500g | FID-011 | 88 | 35 | $850 | $1,400 | Almacen |
| Leche entera 1L | LEC-003 | 30 | 40 | $980 | $1,650 | Lacteos |
| Arroz largo fino 1kg | ARR-007 | 55 | 25 | $1,100 | $1,900 | Almacen |
| Galletitas surtidas | GAL-022 | 15 | 20 | $1,500 | $2,800 | Almacen |
| Detergente 750ml | DET-045 | 35 | 15 | $1,800 | $3,200 | Limpieza |

## Proveedores

| Nombre | Email | Teléfono | Lead time | Costo envío | Confiabilidad |
|---|---|---|---|---|---|
| Norte Distribuciones | compras@nortedist.com | 011-4567-8901 | 3 días | $18,000 | 4.8 |
| Mercado Mayorista Sur | ventas@mayoristasur.com | 011-4321-0987 | 7 días | $9,000 | 4.4 |
| Importadora Central | stock@centralimp.com | 011-5555-1234 | 12 días | $24,000 | 4.1 |

## Catálogo (items vinculados)

| Proveedor | Producto | Precio | Cant. mínima |
|---|---|---|---|
| Norte Distribuciones | CAF-001 | $7,200 | 20 |
| Norte Distribuciones | YER-014 | $2,000 | 30 |
| Norte Distribuciones | LEC-003 | $950 | 50 |
| Norte Distribuciones | GAL-022 | $1,400 | 25 |
| Mercado Mayorista Sur | CAF-001 | $7,000 | 50 |
| Mercado Mayorista Sur | ACE-090 | $5,400 | 20 |
| Mercado Mayorista Sur | AZU-005 | $1,100 | 40 |
| Mercado Mayorista Sur | FID-011 | $800 | 30 |
| Mercado Mayorista Sur | ARR-007 | $1,000 | 30 |
| Mercado Mayorista Sur | DET-045 | $1,700 | 20 |
| Importadora Central | ACE-090 | $5,200 | 10 |
| Importadora Central | CON-032 | $880 | 50 |
| Importadora Central | GAL-022 | $1,350 | 30 |

## Re-ejecución Segura

El seed usa `upsert` por SKU para productos y evita duplicar proveedores. Si ya existen, los actualiza.

Las ventas se insertan siempre (no hay guarda automática). Si querés evitar duplicar ventas al re-ejecutar, agregá un early return:

```ts
const saleCount = await prisma.sale.count();
if (saleCount > 0) {
  console.log("Ventas ya existen, saltando...");
  return;
}
```

## Workspace y Super Admin

- El seed se conecta al **workspace más antiguo** (primer `createdAt`).
- Si se configuran `SUPER_ADMIN_EMAIL` y `SUPER_ADMIN_PASSWORD` en `.env`, se crea/actualiza un super admin automáticamente.
- El primer usuario registrado vía `/api/auth/register` también obtiene rol `SUPER_ADMIN`.
