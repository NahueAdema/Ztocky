import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const alerts = await prisma.alert.findMany({
    where: {
      OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }],
    },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      productId: a.productId,
      productName: a.product.name,
      productSku: a.product.sku,
      type: a.type,
      message: a.message,
      isRead: a.isRead,
      isResolved: a.isResolved,
      metadata: a.metadata,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: {
      OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }],
    },
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
  });

  let created = 0;
  const newAlerts: string[] = [];

  for (const product of products) {
    const sold = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const burnRate = sold / 30;
    const daysRemaining = burnRate > 0 ? Math.floor(product.currentStock / burnRate) : 999;
    const catalogItem = product.catalogItems[0];
    const leadTime = catalogItem?.supplier.leadTime ?? 7;

    let alertType: string | null = null;
    let message = "";

    if (daysRemaining <= leadTime && burnRate > 0) {
      alertType = "CRITICAL_STOCK";
      message = `${product.name} se agotara en ${daysRemaining} dias. Lead time del proveedor: ${leadTime} dias. Generar orden de compra urgente.`;
    } else if (product.currentStock <= product.minStock) {
      alertType = "LOW_STOCK";
      message = `${product.name} tiene ${product.currentStock} unidades (minimo: ${product.minStock}).`;
    } else if (daysRemaining <= leadTime + 7 && burnRate > 0) {
      alertType = "LOW_STOCK";
      message = `${product.name} se agotara en ${daysRemaining} dias. Considerar reabastecer pronto.`;
    }

    if (alertType) {
      const existing = await prisma.alert.findFirst({
        where: {
          productId: product.id,
          type: alertType as "LOW_STOCK" | "CRITICAL_STOCK" | "STAGNANT_STOCK",
          isResolved: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            workspaceId: user.workspaceId,
            productId: product.id,
            type: alertType as "LOW_STOCK" | "CRITICAL_STOCK" | "STAGNANT_STOCK",
            message,
            metadata: {
              burnRate: Number(burnRate.toFixed(2)),
              daysRemaining,
              leadTime,
              currentStock: product.currentStock,
              minStock: product.minStock,
              supplier: catalogItem?.supplier.name ?? null,
            },
          },
        });
        created++;
        newAlerts.push(product.name);
      }
    }
  }

  for (const product of products) {
    const lastSale = product.sales.length > 0
      ? product.sales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())[0].saleDate
      : null;

    const daysSinceLastSale = lastSale
      ? Math.floor((Date.now() - lastSale.getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    if (daysSinceLastSale > 30 && product.currentStock > 0) {
      const existing = await prisma.alert.findFirst({
        where: {
          productId: product.id,
          type: "STAGNANT_STOCK",
          isResolved: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            workspaceId: user.workspaceId,
            productId: product.id,
            type: "STAGNANT_STOCK",
            message: `${product.name} sin ventas hace ${daysSinceLastSale} dias. ${product.currentStock} unidades en stock.`,
            metadata: {
              daysSinceLastSale,
              currentStock: product.currentStock,
              lastSaleDate: lastSale?.toISOString() ?? null,
            },
          },
        });
        created++;
        newAlerts.push(product.name);
      }
    }
  }

  return NextResponse.json({
    generated: created,
    alerts: newAlerts,
    message: created > 0 ? `${created} nueva${created > 1 ? "s" : ""} alerta${created > 1 ? "s" : ""} generada${created > 1 ? "s" : ""}` : "Sin nuevas alertas",
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { alertId, action } = body;

  if (!alertId || !action) {
    return NextResponse.json({ error: "alertId y action son obligatorios" }, { status: 400 });
  }

  const prisma = getPrisma();
  const alert = await prisma.alert.findFirst({
    where: {
      id: alertId,
      OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }],
    },
  });

  if (!alert) return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 });

  const data: Record<string, boolean> = {};
  if (action === "read") data.isRead = true;
  else if (action === "resolve") data.isResolved = true;
  else return NextResponse.json({ error: "Accion invalida. Usar 'read' o 'resolve'" }, { status: 400 });

  const updated = await prisma.alert.update({
    where: { id: alertId },
    data,
  });

  return NextResponse.json({ success: true, alert: updated });
}
