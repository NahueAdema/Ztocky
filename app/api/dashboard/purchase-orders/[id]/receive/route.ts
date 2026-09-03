import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { items, notes } = body as {
    items: { productId: string; receivedQty: number; unitCost: number }[];
    notes?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Al menos un producto a recibir es obligatorio" }, { status: 400 });
  }

  const prisma = getPrisma();

  const order = await prisma.purchaseOrder.findFirst({
    where: { id, workspaceId: user.workspaceId },
    include: {
      supplier: { select: { name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, currentStock: true, costPrice: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status === "DRAFT") {
    return NextResponse.json({ error: "Primero enviá la orden al proveedor para poder recibirla" }, { status: 400 });
  }
  if (order.status === "RECEIVED") {
    return NextResponse.json({ error: "Esta orden ya fue recibida por completo" }, { status: 400 });
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "No se puede recibir una orden cancelada" }, { status: 400 });
  }

  // Mapa de POItems por productId para validar cantidades pendientes
  const itemByProduct = new Map(order.items.map((i) => [i.productId, i]));

  const normalized = items.map((item) => {
    const existing = itemByProduct.get(item.productId);
    const receivedQty = Math.floor(item.receivedQty);
    if (!existing) return { error: `El producto con id ${item.productId} no pertenece a esta orden` };
    const pending = existing.quantity - existing.receivedQty;
    if (receivedQty < 0) return { error: "La cantidad recibida no puede ser negativa" };
    if (receivedQty > pending) {
      return { error: `La cantidad recibida para "${existing.product.name}" supera lo pendiente (quedan ${pending})` };
    }
    return {
      ok: true,
      existing,
      productId: item.productId,
      receivedQty,
      unitCost: Number(item.unitCost || 0),
    };
  });

  for (const r of normalized) {
    if (!r.ok) {
      const err = r as { error: string };
      return NextResponse.json({ error: err.error }, { status: 400 });
    }
  }

  const valid = normalized.filter((r) => r.ok) as Exclude<(typeof normalized)[number], { error: string }>[];
  if (valid.some((r) => r.receivedQty === 0)) {
    return NextResponse.json({ error: "Ingresá una cantidad recibida mayor a 0 en al menos un producto" }, { status: 400 });
  }

  const totalAmount = valid.reduce((sum, r) => sum + r.receivedQty * r.unitCost, 0);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.stockReceipt.create({
        data: {
          workspaceId: user.workspaceId!,
          purchaseOrderId: id,
          userId: user.id,
          totalAmount,
          notes: notes || null,
          items: {
            create: valid.map((r) => ({
              productId: r.productId,
              productName: r.existing.product.name,
              quantity: r.receivedQty,
              unitCost: r.unitCost,
              difference: r.receivedQty - r.existing.quantity,
            })),
          },
        },
        include: { items: true },
      });

      for (const r of valid) {
        const newReceivedQty = r.existing.receivedQty + r.receivedQty;

        // Actualizar stock del producto
        await tx.product.update({
          where: { id: r.productId },
          data: { currentStock: { increment: r.receivedQty } },
        });

        // Actualizar receivedQty acumulado en el item de la orden
        await tx.purchaseOrderItem.update({
          where: { id: r.existing.id },
          data: { receivedQty: newReceivedQty },
        });

        // Actualizar costPrice con promedio ponderado cuando el costo real difiere
        const currentStock = r.existing.product.currentStock + r.receivedQty;
        const currentCost = Number(r.existing.product.costPrice);
        if (Math.abs(currentCost - r.unitCost) > 0.001) {
          const newCost =
            currentStock > 0
              ? (currentCost * (currentStock - r.receivedQty) + r.unitCost * r.receivedQty) / currentStock
              : r.unitCost;
          await tx.product.update({
            where: { id: r.productId },
            data: { costPrice: newCost },
          });
        }
      }

      // Si todo lo pedido quedó recibido, marcar la orden como RECEIVED
      const stillOpen = order.items.some((i) => {
        const r = valid.find((v) => v.productId === i.productId);
        const received = r ? r.existing.receivedQty + r.receivedQty : i.receivedQty;
        return received < i.quantity;
      });

      const finalStatus = stillOpen ? order.status : "RECEIVED";
      if (finalStatus !== order.status) {
        await tx.purchaseOrder.update({ where: { id }, data: { status: finalStatus } });
      }

      return { receipt, finalStatus };
    });

    // Alerta in-app de recepción
    if (user.workspaceId) {
      try {
        const productsList = valid.map((r) => r.existing.product.name).join(", ");
        await prisma.alert.create({
          data: {
            workspaceId: user.workspaceId,
            type: "ORDER_STATUS",
            title: result.finalStatus === "RECEIVED" ? "Orden recibida" : "Recepción parcial registrada",
            message: `${productsList} — ${result.finalStatus === "RECEIVED" ? "Orden recibida, stock y costo actualizados." : "Se registró una recepción parcial, la orden sigue abierta."}`,
            href: "/dashboard/purchase-orders",
            metadata: {
              orderId: id,
              status: result.finalStatus,
              supplier: order.supplier.name,
              totalAmount: Number(totalAmount),
            },
            isResolved: false,
          },
        });
      } catch { /* alert creation silent */ }
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: result.receipt.id,
        totalAmount: Number(result.receipt.totalAmount),
      },
      status: result.finalStatus,
      itemsReceived: valid.map((r) => ({
        product: r.existing.product.name,
        quantity: r.receivedQty,
        cost: r.unitCost,
      })),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al registrar la recepción" }, { status: 500 });
  }
}
