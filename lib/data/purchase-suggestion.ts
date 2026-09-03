import { getPrisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

type CatalogItemWithSupplier = {
  unitPrice: { toString(): string } | number;
  supplierId: string;
  minOrderQty: number;
  supplier: { name: string; leadTime: number };
};

type ProductWithStock = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  catalogItems: CatalogItemWithSupplier[];
  saleItems: { quantity: number }[];
};

export type SuggestionItem = {
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  burnRate: number;
  daysRemaining: number;
  suggestedQty: number;
  unitPrice: number;
  priceEstimate: number;
  minOrderQty: number;
  daysOfCoverage: number;
};

export type SuggestionGroup = {
  supplierId: string;
  supplierName: string;
  leadTime: number;
  items: SuggestionItem[];
  totalEstimate: number;
};

export async function getPurchaseSuggestions(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const products = await prisma.product.findMany({
      where: workspaceId ? { workspaceId } : {},
      include: {
        catalogItems: {
          include: { supplier: true },
        },
        saleItems: {
          where: { sale: { saleDate: { gte: since } } },
        },
      },
    });

    const candidates: {
      product: ProductWithStock;
      burnRate: number;
      daysRemaining: number;
      leadTime: number;
      bestCatalog: CatalogItemWithSupplier;
    }[] = [];

    for (const product of products as unknown as ProductWithStock[]) {
      const sold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
      const burnRate = sold / 30;
      const daysRemaining = burnRate > 0 ? Math.floor(product.currentStock / burnRate) : 999;

      if (product.catalogItems.length === 0) continue;

      // Proveedor más barato
      const bestCatalog = product.catalogItems.reduce((best, c) =>
        asNumber(c.unitPrice) < asNumber(best.unitPrice) ? c : best,
      );
      const leadTime = bestCatalog.supplier.leadTime;

      const isLowStock = product.currentStock <= product.minStock;
      const isCritical = daysRemaining <= leadTime;
      const isApproaching = daysRemaining <= leadTime + 7;

      if (isLowStock || isCritical || isApproaching) {
        candidates.push({ product, burnRate, daysRemaining, leadTime, bestCatalog });
      }
    }

    // Ordenar por urgencia (menos días restantes primero)
    candidates.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const groups = new Map<string, SuggestionGroup>();
    for (const c of candidates) {
      const suggestedQty = Math.max(
        c.product.minStock * 2,
        Math.ceil(c.burnRate * c.leadTime * 1.5),
      );
      const minOrderQty = c.bestCatalog.minOrderQty || 1;
      const finalQty = Math.max(suggestedQty, minOrderQty);
      const unitPrice = asNumber(c.bestCatalog.unitPrice);
      const priceEstimate = finalQty * unitPrice;
      const daysOfCoverage = c.burnRate > 0 ? Math.floor(finalQty / c.burnRate) : 999;

      const item: SuggestionItem = {
        productId: c.product.id,
        productName: c.product.name,
        productSku: c.product.sku,
        currentStock: c.product.currentStock,
        minStock: c.product.minStock,
        burnRate: Number(c.burnRate.toFixed(1)),
        daysRemaining: c.daysRemaining,
        suggestedQty: finalQty,
        unitPrice,
        priceEstimate,
        minOrderQty,
        daysOfCoverage,
      };

      const group = groups.get(c.bestCatalog.supplierId);
      if (group) {
        group.items.push(item);
        group.totalEstimate += priceEstimate;
      } else {
        groups.set(c.bestCatalog.supplierId, {
          supplierId: c.bestCatalog.supplierId,
          supplierName: c.bestCatalog.supplier.name,
          leadTime: c.leadTime,
          items: [item],
          totalEstimate: priceEstimate,
        });
      }
    }

    const sortedGroups = Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length);
    const totalProducts = sortedGroups.reduce((sum, g) => sum + g.items.length, 0);
    const totalEstimate = sortedGroups.reduce((sum, g) => sum + g.totalEstimate, 0);

    return {
      groups: sortedGroups,
      summary: {
        totalProducts,
        totalOrders: sortedGroups.length,
        totalEstimate,
      },
    };
  } catch (e) {
    logger.error("getPurchaseSuggestions failed", e);
    return { groups: [], summary: { totalProducts: 0, totalOrders: 0, totalEstimate: 0 } };
  }
}

export async function createOrdersFromSuggestions(
  workspaceId: string,
  groups: { supplierId: string; items: { productId: string; quantity: number; unitPrice: number }[] }[],
) {
  const prisma = getPrisma();
  const created: { id: string; supplierName: string; itemsCount: number; totalAmount: number }[] = [];

  for (const group of groups) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: group.supplierId, workspaceId },
    });
    if (!supplier) continue;

    const validItems = group.items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) continue;

    const totalAmount = validItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);

    const notes = `Generada automáticamente con compra sugerida (${validItems.length} producto${validItems.length > 1 ? "s" : ""}).`;

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId: group.supplierId,
        workspaceId,
        status: "DRAFT",
        totalAmount,
        notes,
        generatedByAI: true,
        items: {
          create: validItems.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.quantity) * Number(i.unitPrice),
          })),
        },
      },
      include: { items: true },
    });

    created.push({
      id: order.id,
      supplierName: supplier.name,
      itemsCount: order.items.length,
      totalAmount: Number(order.totalAmount),
    });
  }

  return created;
}
