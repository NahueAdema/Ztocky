import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sendAlertNotification } from "@/lib/mail";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const alerts = await prisma.alert.findMany({
    where: {
      workspaceId: user.workspaceId,
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

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: {
      workspaceId: user.workspaceId,
    },
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
  });

  let created = 0;
  let generatedOrders = 0;
  const newAlerts: string[] = [];
  const newOrders: string[] = [];

  const productIds = products.map((p) => p.id);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [existingAlerts, pendingPOs] = await Promise.all([
    prisma.alert.findMany({
      where: {
        productId: { in: productIds },
        workspaceId: user.workspaceId,
        isResolved: false,
        createdAt: { gte: since24h },
      },
      select: { productId: true, type: true },
    }),
    prisma.purchaseOrder.findMany({
      where: {
        workspaceId: user.workspaceId,
        status: { in: ["DRAFT", "SENT", "CONFIRMED", "SHIPPED"] },
        items: { some: { productId: { in: productIds } } },
      },
      select: { items: { select: { productId: true } } },
    }),
  ]);

  const alertSet = new Set(existingAlerts.map((a) => `${a.productId}:${a.type}`));
  const poProductIds = new Set(pendingPOs.flatMap((po) => po.items.map((i) => i.productId)));

  for (const product of products) {
    const sold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
    const burnRate = sold / 30;
    const daysRemaining = burnRate > 0 ? Math.floor(product.currentStock / burnRate) : 999;
    const catalogItem = product.catalogItems[0];
    const leadTime = catalogItem?.supplier.leadTime ?? 7;

    let alertType: string | null = null;
    let message = "";

    if (daysRemaining <= leadTime && burnRate > 0) {
      alertType = "CRITICAL_STOCK";
      message = `${product.name} se agotará en ${daysRemaining} días. Lead time del proveedor: ${leadTime} días. Generar orden de compra urgente.`;
    } else if (product.currentStock <= product.minStock) {
      alertType = "LOW_STOCK";
      message = `${product.name} tiene ${product.currentStock} unidades (minimo: ${product.minStock}).`;
    } else if (daysRemaining <= leadTime + 7 && burnRate > 0) {
      alertType = "LOW_STOCK";
      message = `${product.name} se agotará en ${daysRemaining} días. Considerar reabastecer pronto.`;
    }

    if (alertType) {
      const key = `${product.id}:${alertType}`;
      if (!alertSet.has(key)) {
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
        alertSet.add(key);
        created++;
        newAlerts.push(product.name);

        if (alertType === "CRITICAL_STOCK" && product.catalogItems.length > 0 && !poProductIds.has(product.id)) {
          const bestCatalog = product.catalogItems[0];
          const suggestedQty = Math.max(
            product.minStock * 2,
            Math.ceil(burnRate * leadTime * 1.5),
          );
          const totalPrice = suggestedQty * Number(bestCatalog.unitPrice);

          await prisma.purchaseOrder.create({
            data: {
              workspaceId: user.workspaceId,
              supplierId: bestCatalog.supplierId,
              status: "DRAFT",
              totalAmount: totalPrice,
              notes: `Generada automáticamente por alerta crítica de ${product.name}. Stock actual: ${product.currentStock}, burn rate: ${burnRate.toFixed(1)}/dia`,
              generatedByAI: true,
              items: {
                create: {
                  productId: product.id,
                  quantity: suggestedQty,
                  unitPrice: bestCatalog.unitPrice,
                  totalPrice,
                },
              },
            },
          });
          generatedOrders++;
          newOrders.push(product.name);
        }
      }
    }
  }

  for (const product of products) {
    const lastSaleItem = product.saleItems.length > 0
      ? product.saleItems.sort((a, b) => {
          const saleA = (a as unknown as { sale?: { saleDate?: Date } }).sale;
          const saleB = (b as unknown as { sale?: { saleDate?: Date } }).sale;
          return (saleB?.saleDate?.getTime() ?? 0) - (saleA?.saleDate?.getTime() ?? 0);
        })[0]
      : null;

    const lastSaleDate = lastSaleItem
      ? (lastSaleItem as unknown as { sale?: { saleDate?: Date } }).sale?.saleDate ?? null
      : null;

    const daysSinceLastSale = lastSaleDate
      ? Math.floor((Date.now() - lastSaleDate.getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    if (daysSinceLastSale > 30 && product.currentStock > 0) {
      const key = `${product.id}:STAGNANT_STOCK`;
      if (!alertSet.has(key)) {
        await prisma.alert.create({
          data: {
            workspaceId: user.workspaceId,
            productId: product.id,
            type: "STAGNANT_STOCK",
            message: `${product.name} sin ventas hace ${daysSinceLastSale} días. ${product.currentStock} unidades en stock.`,
            metadata: {
              daysSinceLastSale,
              currentStock: product.currentStock,
              lastSaleDate: lastSaleDate?.toISOString() ?? null,
            },
          },
        });
        alertSet.add(key);
        created++;
        newAlerts.push(product.name);
      }
    }
  }

  let message = created > 0 ? `${created} nueva${created > 1 ? "s" : ""} alerta${created > 1 ? "s" : ""} generada${created > 1 ? "s" : ""}` : "Sin nuevas alertas";
  if (generatedOrders > 0) {
    message += ` y ${generatedOrders} orden${generatedOrders > 1 ? "es" : ""} de compra generada${generatedOrders > 1 ? "s" : ""} automáticamente`;
  }

  if (created > 0 && user.workspaceId) {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: user.workspaceId },
        include: { user: { select: { email: true, name: true, emailVerified: true } } },
      });
      for (const member of members) {
        if (member.user.emailVerified) {
          for (const alert of newAlerts) {
            const product = products.find((p) => p.name === alert);
            if (product) {
              sendAlertNotification(member.user.email, member.user.name, {
                type: "CRITICAL_STOCK",
                message: `Alerta generada para ${product.name}. Stock actual: ${product.currentStock}.`,
                productName: product.name,
              }).catch(() => {});
            }
          }
        }
      }
    } catch { /* email errors silent */ }
  }

  return NextResponse.json({
    generated: created,
    alerts: newAlerts,
    generatedOrders,
    orders: newOrders,
    message,
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
      workspaceId: user.workspaceId,
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
