import { getPrisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function getSupplierDetail(supplierId: string, workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [supplier, catalogItems, orders, recentPriceHistory] = await Promise.all([
      prisma.supplier.findFirst({
        where: { id: supplierId, workspaceId },
      }),
      prisma.catalogItems.findMany({
        where: { supplierId },
        include: {
          product: true,
          supplier: true,
        },
      }),
      prisma.purchaseOrder.findMany({
        where: { supplierId, workspaceId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.priceHistory.findMany({
        where: {
          supplierId,
          createdAt: { gte: since30 },
        },
        include: { catalogItem: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    if (!supplier) return null;

    // Universo de productos: todos los catalogItems de todos los proveedores
    const productIds = catalogItems.map((c) => c.productId);
    const allCatalogForProducts = productIds.length > 0
      ? await prisma.catalogItems.findMany({
          where: { productId: { in: productIds } },
          include: { supplier: true },
        })
      : [];

    // Indexamos precios por producto
    const priceByProduct = new Map<string, number[]>();
    for (const c of allCatalogForProducts) {
      const arr = priceByProduct.get(c.productId) ?? [];
      arr.push(asNumber(c.unitPrice));
      priceByProduct.set(c.productId, arr);
    }

    const products = catalogItems.map((c) => {
      const unitPrice = asNumber(c.unitPrice);
      const prices = priceByProduct.get(c.productId) ?? [unitPrice];
      const cheapestPrice = Math.min(...prices);
      const supplierCount = new Set(
        allCatalogForProducts.filter((x) => x.productId === c.productId).map((x) => x.supplierId),
      ).size;

      return {
        productId: c.productId,
        productName: c.product.name,
        productSku: c.product.sku,
        unitPrice,
        minOrderQty: c.minOrderQty,
        isCheapest: unitPrice <= cheapestPrice,
        cheapestPrice,
        supplierCount,
      };
    });

    const convenientCount = products.filter((p) => p.isCheapest).length;
    const totalSpent = orders.reduce((sum, o) => sum + asNumber(o.totalAmount), 0);
    const lastOrder = orders[0] ?? null;

    // Productos con aumento reciente (solo UPDATED/IMPORTED con precio nuevo > anterior)
    const seenIncrease = new Set<string>();
    const recentPriceIncreases = recentPriceHistory
      .filter((h) => {
        if (h.previousPrice === null) return false;
        if (asNumber(h.newPrice) <= asNumber(h.previousPrice)) return false;
        if (seenIncrease.has(h.productId)) return false;
        seenIncrease.add(h.productId);
        return true;
      })
      .map((h) => ({
        productId: h.productId,
        productName: h.catalogItem?.product.name ?? "",
        productSku: h.catalogItem?.product.sku ?? "",
        previousPrice: asNumber(h.previousPrice),
        newPrice: asNumber(h.newPrice),
        changeDate: h.createdAt.toISOString(),
      }));

    // Frase resumen
    let summary = "";
    if (products.length > 0) {
      const pctConvenient = Math.round((convenientCount / products.length) * 100);
      summary = `Es el más barato en ${convenientCount} de ${products.length} producto${products.length > 1 ? "s" : ""} (${pctConvenient}%)`;
      if (recentPriceIncreases.length > 0) {
        const categories = new Set(
          recentPriceIncreases
            .map((r) => r.productName)
            .slice(0, 3),
        );
        summary += `, pero viene aumentando en: ${Array.from(categories).join(", ")}.`;
      } else {
        summary += " y sin aumentos recientes de precio.";
      }
    } else {
      summary = "Sin productos cargados en el catálogo todavía.";
    }

    return {
      id: supplier.id,
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      contactPhone: supplier.contactPhone,
      leadTime: supplier.leadTime,
      shippingCost: asNumber(supplier.shippingCost),
      reliability: supplier.reliability,
      notes: supplier.notes,
      products,
      stats: {
        totalOrders: orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt.toISOString() ?? null,
        lastOrderStatus: lastOrder?.status ?? null,
        lastOrderAmount: lastOrder ? asNumber(lastOrder.totalAmount) : null,
        productCount: products.length,
        convenientCount,
      },
      recentPriceIncreases,
      summary,
    };
  } catch (e) {
    logger.error("getSupplierDetail failed", e);
    return null;
  }
}
