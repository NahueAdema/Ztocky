# Seed de Datos

## Qué Genera

Ejecutando `npm run seed` se crea:

- **10 productos** con nombres realistas (Arroz, Harina, Aceite, etc.)
- **3 proveedores** (Distribuidora del Centro, Alimentos del Sur, Proveedor Express)
- **13 items de catálogo** vinculando productos con proveedores y precios
- **90 días de ventas** con variación realista:
  - Factor de fin de semana (menos ventas sábado/domingo)
  - Factor de semana de pago (más ventas del 1-10 de cada mes)
  - Onda estacional con pico cada ~30 días

## Productos y Stocks

| Producto    | SKU      | Stock | Precio   |
| ----------- | -------- | ----- | -------- |
| Arroz       | ARZ-001  | 42    | $1,050   |
| Harina      | HAR-002  | 28    | $900     |
| Aceite      | ACE-003  | 15    | $2,400   |
| Azúcar      | AZU-004  | 55    | $850     |
| Sal         | SAL-005  | 120   | $300     |
| Fideos      | FID-006  | 33    | $700     |
| Lentejas    | LEN-007  | 8     | $1,100   |
| Puré de tomate | TOM-008 | 22  | $950     |
| Café        | CAF-009  | 12    | $3,200   |
| Leche        | LEC-010  | 5     | $1,500   |

## Re-ejecución Segura

El seed usa `upsert` por SKU para productos y por nombre para proveedores. Si ya existen, los actualiza.

Las ventas se insertan siempre (no hay guarda automática). Si querés evitar duplicar ventas al re-ejecutar, agregá un early return en el seed:

```ts
const saleCount = await prisma.sale.count();
if (saleCount > 0) {
  console.log("Ventas ya existen, saltando...");
  return;
}
```

## Workspace y Usuario

El seed se conecta al **workspace más antiguo** (primer `createdAt`). El primer usuario registrado vía `/api/auth/register` obtiene rol `SUPER_ADMIN` automáticamente.
