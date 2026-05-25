import { getPrisma } from "@/lib/prisma";
import {
  products as mockProducts,
  purchaseOrders as mockPurchaseOrders,
  reorderRisks as mockReorderRisks,
  suppliers as mockSuppliers,
} from "@/lib/mock-data";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function scopedWhere(workspaceId?: string | null) {
  return workspaceId
    ? { OR: [{ workspaceId }, { workspaceId: null }] }
    : {};
}

export async function getProductsForDashboard(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const rows = await prisma.product.findMany({
      include: {
        sales: {
          orderBy: { saleDate: "desc" },
          take: 1,
        },
      },
      where: scopedWhere(workspaceId),
      orderBy: { name: "asc" },
      take: 100,
    });

    return rows.map((product) => {
      const costPrice = asNumber(product.costPrice);
      const sellingPrice = asNumber(product.sellingPrice);
      const margin =
        sellingPrice > 0
          ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)
          : 0;

      return {
        sku: product.sku,
        name: product.name,
        category: product.category ?? "Sin categoria",
        currentStock: product.currentStock,
        minStock: product.minStock,
        costPrice,
        sellingPrice,
        burnRate: 0,
        daysRemaining: 999,
        margin,
        lastSale: product.sales[0]?.saleDate.toISOString().slice(0, 10) ?? "-",
      };
    });
  } catch {
    return mockProducts;
  }
}

export async function getSuppliersForDashboard(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const rows = await prisma.supplier.findMany({
      where: scopedWhere(workspaceId),
      orderBy: { name: "asc" },
      take: 100,
    });

    return rows.map((supplier) => ({
      name: supplier.name,
      contactEmail: supplier.contactEmail ?? "Sin email",
      leadTime: supplier.leadTime,
      shippingCost: asNumber(supplier.shippingCost),
      reliability: supplier.reliability,
      focus: supplier.leadTime <= 4 ? "Entrega rapida" : "Compra planificada",
    }));
  } catch {
    return mockSuppliers;
  }
}

export async function getPurchaseOrdersForDashboard(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const rows = await prisma.purchaseOrder.findMany({
      where: scopedWhere(workspaceId),
      include: {
        supplier: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return rows.map((order) => ({
      id: order.id.slice(0, 8).toUpperCase(),
      supplier: order.supplier.name,
      status: order.status,
      items: order._count.items,
      totalAmount: asNumber(order.totalAmount),
      createdAt: order.createdAt.toISOString().slice(0, 10),
    }));
  } catch {
    return mockPurchaseOrders;
  }
}

export async function getPotentialSavings(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const products = await prisma.product.findMany({
      where: scopedWhere(workspaceId),
      include: {
        catalogItems: {
          include: { supplier: true },
        },
        sales: {
          where: { saleDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
      },
    });

    let totalSavings = 0;

    for (const product of products) {
      if (product.catalogItems.length < 2) continue;

      const prices = product.catalogItems.map((c) => Number(c.unitPrice));
      const cheapest = Math.min(...prices);
      const mostExpensive = Math.max(...prices);
      const savingPerUnit = mostExpensive - cheapest;

      const monthlyVolume = product.sales.reduce((s, sale) => s + sale.quantity, 0);
      const projectedAnnualVolume = Math.max(monthlyVolume * 12, product.minStock * 4);

      totalSavings += savingPerUnit * projectedAnnualVolume;
    }

    return Math.round(totalSavings);
  } catch {
    return 126000;
  }
}

export async function getReorderRisksForDashboard(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const products = await prisma.product.findMany({
      where: scopedWhere(workspaceId),
      include: {
        catalogItems: {
          include: { supplier: true },
          orderBy: { unitPrice: "asc" },
          take: 1,
        },
        sales: {
          where: { saleDate: { gte: since } },
        },
      },
      orderBy: { currentStock: "asc" },
      take: 100,
    });

    return products
      .map((product) => {
        const sold = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const burnRate = sold / 30;
        const daysRemaining =
          burnRate > 0 ? Math.max(1, Math.floor(product.currentStock / burnRate)) : 999;
        const catalogItem = product.catalogItems[0];
        const leadTime = catalogItem?.supplier.leadTime ?? 7;
        const urgency =
          daysRemaining <= leadTime
            ? "Critica"
            : daysRemaining <= leadTime + 7
              ? "Alta"
              : "Media";

        return {
          product: product.name,
          sku: product.sku,
          stock: product.currentStock,
          burnRate: Number(burnRate.toFixed(1)),
          daysRemaining,
          supplier: catalogItem?.supplier.name ?? "Sin proveedor",
          leadTime,
          suggestedQty: Math.max(product.minStock * 2, Math.ceil(burnRate * 30)),
          urgency,
        };
      })
      .filter((item) => item.daysRemaining <= item.leadTime + 14)
      .slice(0, 10);
  } catch {
    return mockReorderRisks;
  }
}
