import { cache } from "react";
import { getPrisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function scopedWhere(workspaceId?: string | null) {
  return workspaceId
    ? { workspaceId }
    : {};
}

export const getProductsForDashboard = cache(async (workspaceId?: string | null) => {
  try {
    const prisma = getPrisma();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rows = await prisma.product.findMany({
      include: {
        saleItems: {
          include: { sale: { select: { saleDate: true } } },
          where: { sale: { saleDate: { gte: thirtyDaysAgo } } },
        },
      },
      where: scopedWhere(workspaceId),
      orderBy: { name: "asc" },
      take: 200,
    });

    return rows.map((product) => {
      const costPrice = asNumber(product.costPrice);
      const sellingPrice = asNumber(product.sellingPrice);
      const margin =
        sellingPrice > 0
          ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)
          : 0;

      const totalSoldLast30 = product.saleItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const burnRate = Math.round((totalSoldLast30 / 30) * 10) / 10;
      const daysRemaining =
        burnRate > 0 ? Math.floor(product.currentStock / burnRate) : 999;

      const lastSaleDate = product.saleItems.length > 0
        ? product.saleItems.sort(
            (a, b) => b.sale.saleDate.getTime() - a.sale.saleDate.getTime()
          )[0]?.sale.saleDate.toISOString().slice(0, 10)
        : "-";

      return {
        sku: product.sku,
        name: product.name,
        category: product.category ?? "Sin categoria",
        currentStock: product.currentStock,
        minStock: product.minStock,
        costPrice,
        sellingPrice,
        burnRate,
        daysRemaining,
        margin,
        lastSale: lastSaleDate,
      };
    });
  } catch (e) {
    logger.error("DB query failed", e);
    return [];
  }
});

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
  } catch (e) {
    logger.error("DB query failed", e);
    return [];
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
  } catch (e) {
    logger.error("DB query failed", e);
    return [];
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
        saleItems: {
          where: {
            sale: { saleDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          },
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

      const monthlyVolume = product.saleItems.reduce((s, item) => s + item.quantity, 0);
      const projectedAnnualVolume = Math.max(monthlyVolume * 12, product.minStock * 4);

      totalSavings += savingPerUnit * projectedAnnualVolume;
    }

    return Math.round(totalSavings);
  } catch (e) {
    logger.error("DB query failed", e);
    return [];
  }
}

export const getReorderRisksForDashboard = cache(async (workspaceId?: string | null) => {
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
        saleItems: {
          where: {
            sale: { saleDate: { gte: since } },
          },
        },
      },
      orderBy: { currentStock: "asc" },
      take: 100,
    });

    return products
      .map((product) => {
        const sold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
        const burnRate = sold / 30;
        const daysRemaining =
          burnRate > 0 ? Math.max(1, Math.floor(product.currentStock / burnRate)) : 999;
        const catalogItem = product.catalogItems[0];
        const leadTime = catalogItem?.supplier.leadTime ?? 7;

        const isLowStock = product.currentStock <= product.minStock;
        const isCriticalStock = product.currentStock <= product.minStock * 0.5;

        let urgency: string;
        if (isCriticalStock || daysRemaining <= leadTime) {
          urgency = "Crítica";
        } else if (isLowStock || daysRemaining <= leadTime + 7) {
          urgency = "Alta";
        } else {
          urgency = "Media";
        }

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
      .filter((item) => {
        const product = products.find((p) => p.sku === item.sku);
        const isLowStock = product ? product.currentStock <= product.minStock : false;
        return item.urgency === "Crítica" || item.urgency === "Alta" || isLowStock || item.daysRemaining <= item.leadTime + 14;
      })
      .slice(0, 10);
  } catch (e) {
    logger.error("DB query failed", e);
    return [];
  }
});

export const getTodayStats = cache(async (workspaceId?: string | null) => {
  try {
    const prisma = getPrisma();

    const whereClause = workspaceId ? { workspaceId } : {};

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastDay = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const [recentSales, olderSales, latestSales] = await Promise.all([
      prisma.sale.findMany({
        where: {
          ...whereClause,
          saleDate: { gte: last7Days },
        },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sale.findMany({
        where: {
          ...whereClause,
          saleDate: { gte: last30Days, lt: last7Days },
        },
        include: { items: true },
      }),
      prisma.sale.findMany({
        where: {
          ...whereClause,
          saleDate: { gte: lastDay },
        },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const recentRevenue = recentSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const olderRevenue = olderSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

    const recentUnits = recentSales.reduce((sum, s) => {
      const saleUnits = s.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) ?? 0;
      return sum + saleUnits;
    }, 0);
    const olderUnits = olderSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const transactions = recentSales.length;

    const weeklyAvgRevenue = olderRevenue / 3 || 0;
    const revenueChange = weeklyAvgRevenue > 0 ? ((recentRevenue - weeklyAvgRevenue) / weeklyAvgRevenue) * 100 : 0;
    const weeklyAvgUnits = olderUnits / 3 || 0;
    const unitsChange = weeklyAvgUnits > 0 ? ((recentUnits - weeklyAvgUnits) / weeklyAvgUnits) * 100 : 0;

    return {
      revenue: recentRevenue,
      revenueChange: Math.round(revenueChange),
      units: recentUnits,
      unitsChange: Math.round(unitsChange),
      transactions,
      recentSales: (latestSales.length > 0 ? latestSales : recentSales.slice(0, 10)).map((s) => {
        const firstItem = s.items?.[0];
        return {
          id: s.id,
          productName: firstItem?.product.name ?? "N/A",
          productSku: firstItem?.product.sku ?? "N/A",
          quantity: s.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
          totalAmount: Number(s.totalAmount),
          unitPrice: firstItem ? Number(firstItem.unitPrice) : 0,
          time: s.createdAt.toISOString(),
        };
      }),
    };
  } catch (e) {
    logger.error("getTodayStats failed", e);
    return { revenue: 0, revenueChange: 0, units: 0, unitsChange: 0, transactions: 0, recentSales: [] };
  }
});

export const getTopProducts = cache(async (workspaceId?: string | null) => {
  try {
    const prisma = getPrisma();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const whereClause = workspaceId ? { workspaceId } : {};

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        saleItems: {
          where: {
            sale: { saleDate: { gte: since } },
          },
          include: { sale: { select: { totalAmount: true } } },
        },
        catalogItems: {
          include: { supplier: { select: { name: true } } },
          orderBy: { unitPrice: "asc" },
          take: 1,
        },
      },
      take: 50,
    });

    const ranked = products
      .map((p) => {
        const sold = p.saleItems.reduce((sum, item) => sum + item.quantity, 0);
        const revenue = p.saleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
        const burnRate = sold / 30;
        const daysRemaining = burnRate > 0 ? Math.floor(p.currentStock / burnRate) : 999;
        return {
          name: p.name,
          sku: p.sku,
          stock: p.currentStock,
          sold30d: sold,
          revenue30d: revenue,
          burnRate: Number(burnRate.toFixed(1)),
          daysRemaining,
          category: p.category ?? "Sin categoria",
          supplier: p.catalogItems[0]?.supplier?.name ?? "-",
        };
      })
      .sort((a, b) => b.sold30d - a.sold30d)
      .slice(0, 10);

    return ranked;
  } catch (e) {
    logger.error("getTopProducts failed", e);
    return [];
  }
});

export async function getWeeklySales(workspaceId?: string | null) {
  try {
    const prisma = getPrisma();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const whereClause = workspaceId ? { workspaceId } : {};

    const sales = await prisma.sale.findMany({
      where: {
        ...whereClause,
        saleDate: { gte: weekAgo },
      },
      select: { saleDate: true, totalAmount: true },
    });

    const dayMap = new Map<string, { sales: number; revenue: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), { sales: 0, revenue: 0 });
    }

    for (const s of sales) {
      const key = s.saleDate.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.sales++;
        entry.revenue += Number(s.totalAmount);
      }
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      revenue: data.revenue,
    }));
  } catch (e) {
    logger.error("getWeeklySales failed", e);
    return [];
  }
}
