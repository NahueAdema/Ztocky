import { config } from "dotenv";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomBytes, scryptSync } from "node:crypto";

config({ path: join(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL no encontrada en el .env");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const productDefs = [
  { name: "Cafe Brasil 1kg", sku: "CAF-001", description: "Cafe molido premium", currentStock: 18, minStock: 24, costPrice: 7400, sellingPrice: 11800, category: "Almacen", dailySales: 5.6 },
  { name: "Yerba organica 500g", sku: "YER-014", description: "Yerba mate sin palo", currentStock: 42, minStock: 20, costPrice: 2100, sellingPrice: 3900, category: "Almacen", dailySales: 2.1 },
  { name: "Aceite oliva extra virgen", sku: "ACE-090", description: "Aceite de oliva 500ml", currentStock: 7, minStock: 14, costPrice: 5600, sellingPrice: 8300, category: "Gourmet", dailySales: 1.8 },
  { name: "Conserva tomates perita", sku: "CON-032", description: "Tomates perita en lata", currentStock: 120, minStock: 40, costPrice: 920, sellingPrice: 1550, category: "Almacen", dailySales: 0.2 },
  { name: "Azucar blanca 1kg", sku: "AZU-005", description: "Azucar de mesa", currentStock: 65, minStock: 30, costPrice: 1200, sellingPrice: 2100, category: "Almacen", dailySales: 3.2 },
  { name: "Fideos spaghetti 500g", sku: "FID-011", description: "Pasta seca de sémola", currentStock: 88, minStock: 35, costPrice: 850, sellingPrice: 1400, category: "Almacen", dailySales: 1.5 },
  { name: "Leche entera 1L", sku: "LEC-003", description: "Leche pasteurizada", currentStock: 30, minStock: 40, costPrice: 980, sellingPrice: 1650, category: "Lacteos", dailySales: 8.0 },
  { name: "Arroz largo fino 1kg", sku: "ARR-007", description: "Arroz grano largo", currentStock: 55, minStock: 25, costPrice: 1100, sellingPrice: 1900, category: "Almacen", dailySales: 2.5 },
  { name: "Galletitas surtidas", sku: "GAL-022", description: "Galletitas dulces surtidas", currentStock: 15, minStock: 20, costPrice: 1500, sellingPrice: 2800, category: "Almacen", dailySales: 1.2 },
  { name: "Detergente 750ml", sku: "DET-045", description: "Detergente concentrado", currentStock: 35, minStock: 15, costPrice: 1800, sellingPrice: 3200, category: "Limpieza", dailySales: 0.8 },
];

const supplierDefs = [
  { name: "Norte Distribuciones", contactEmail: "compras@nortedist.com", contactPhone: "011-4567-8901", leadTime: 3, shippingCost: 18000, reliability: 4.8 },
  { name: "Mercado Mayorista Sur", contactEmail: "ventas@mayoristasur.com", contactPhone: "011-4321-0987", leadTime: 7, shippingCost: 9000, reliability: 4.4 },
  { name: "Importadora Central", contactEmail: "stock@centralimp.com", contactPhone: "011-5555-1234", leadTime: 12, shippingCost: 24000, reliability: 4.1 },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminName = process.env.SUPER_ADMIN_NAME?.trim() || "Ztocky Admin";

  if (superAdminEmail && superAdminPassword) {
    await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: { name: superAdminName, role: "SUPER_ADMIN", status: "ACTIVE" },
      create: {
        name: superAdminName,
        email: superAdminEmail,
        passwordHash: hashPassword(superAdminPassword),
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Super admin: ${superAdminEmail}`);
  }

  const workspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!workspace) {
    console.log("⚠️ No hay workspace. Crear uno primero con registro de usuario.");
    return;
  }

  console.log(`📦 Workspace: ${workspace.name} (${workspace.id.slice(0, 8)})`);

  const createdProducts: { id: string; sku: string; dailySales: number }[] = [];

  for (const def of productDefs) {
    const product = await prisma.product.upsert({
      where: { sku: def.sku },
      update: {
        name: def.name,
        description: def.description,
        currentStock: def.currentStock,
        minStock: def.minStock,
        costPrice: def.costPrice,
        sellingPrice: def.sellingPrice,
        category: def.category,
        workspaceId: workspace.id,
      },
      create: {
        name: def.name,
        sku: def.sku,
        description: def.description,
        currentStock: def.currentStock,
        minStock: def.minStock,
        costPrice: def.costPrice,
        sellingPrice: def.sellingPrice,
        category: def.category,
        workspaceId: workspace.id,
      },
    });
    createdProducts.push({ id: product.id, sku: product.sku, dailySales: def.dailySales });
    console.log(`  ✅ ${def.name} (${def.sku})`);
  }

  const createdSuppliers: { id: string; name: string }[] = [];

  for (const def of supplierDefs) {
    const supplier = await prisma.supplier.upsert({
      where: { id: def.name },
      update: def,
      create: {
        ...def,
        id: undefined as unknown as string,
        workspaceId: workspace.id,
      },
    });

    const existing = await prisma.supplier.findFirst({ where: { name: def.name } });
    const supplierRecord = existing ?? supplier;
    createdSuppliers.push({ id: supplierRecord.id, name: supplierRecord.name });
    console.log(`  ✅ Proveedor: ${def.name}`);
  }

  const catalogMappings: [string, string, number, number][] = [
    ["Norte Distribuciones", "CAF-001", 7200, 20],
    ["Norte Distribuciones", "YER-014", 2000, 30],
    ["Norte Distribuciones", "LEC-003", 950, 50],
    ["Norte Distribuciones", "GAL-022", 1400, 25],
    ["Mercado Mayorista Sur", "CAF-001", 7000, 50],
    ["Mercado Mayorista Sur", "ACE-090", 5400, 20],
    ["Mercado Mayorista Sur", "AZU-005", 1100, 40],
    ["Mercado Mayorista Sur", "FID-011", 800, 30],
    ["Mercado Mayorista Sur", "ARR-007", 1000, 30],
    ["Mercado Mayorista Sur", "DET-045", 1700, 20],
    ["Importadora Central", "ACE-090", 5200, 10],
    ["Importadora Central", "CON-032", 880, 50],
    ["Importadora Central", "GAL-022", 1350, 30],
  ];

  for (const [supplierName, sku, price, minQty] of catalogMappings) {
    const supplier = await prisma.supplier.findFirst({ where: { name: supplierName } });
    const product = await prisma.product.findFirst({ where: { sku } });
    if (!supplier || !product) continue;

    await prisma.catalogItems.upsert({
      where: { supplierId_productId: { supplierId: supplier.id, productId: product.id } },
      update: { unitPrice: price, minOrderQty: minQty },
      create: {
        supplierId: supplier.id,
        productId: product.id,
        unitPrice: price,
        minOrderQty: minQty,
      },
    });
  }
  console.log(`  ✅ ${catalogMappings.length} items de catalogo`);

  console.log("📊 Generando 90 dias de ventas historicas...");

  const now = new Date();
  let totalSales = 0;

  for (const { id: productId, dailySales } of createdProducts) {
    for (let daysAgo = 90; daysAgo >= 1; daysAgo--) {
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - daysAgo);

      const dayOfWeek = saleDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendFactor = isWeekend ? 1.4 : 0.8;

      const weekOfMonth = Math.floor((daysAgo % 28) / 7);
      const payWeekFactor = weekOfMonth === 0 || weekOfMonth === 2 ? 1.2 : 0.9;

      const seasonalFactor = 1 + Math.sin((90 - daysAgo) / 90 * Math.PI) * 0.15;

      const variance = 0.7 + Math.random() * 0.6;

      const quantity = Math.max(1, Math.round(dailySales * weekendFactor * payWeekFactor * seasonalFactor * variance));

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) continue;

      await prisma.sale.create({
        data: {
          productId,
          quantity,
          saleDate,
          unitPrice: Number(product.sellingPrice),
          totalAmount: quantity * Number(product.sellingPrice),
        },
      });
      totalSales++;
    }
  }

  console.log(`  ✅ ${totalSales} ventas generadas (90 dias x ${createdProducts.length} productos)`);

  console.log("🎉 Seed completado!");
  console.log(`   ${createdProducts.length} productos`);
  console.log(`   ${createdSuppliers.length} proveedores`);
  console.log(`   ${catalogMappings.length} items de catalogo`);
  console.log(`   ${totalSales} ventas historicas`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
