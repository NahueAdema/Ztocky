import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const validStatuses = ["DRAFT", "SENT", "CONFIRMED", "SHIPPED", "RECEIVED", "CANCELLED"];

async function getOrderAndVerify(id: string, workspaceId: string | null) {
  const prisma = getPrisma();
  return prisma.purchaseOrder.findFirst({
    where: {
      id,
      OR: [{ workspaceId }, { workspaceId: null }],
    },
    include: {
      supplier: true,
      items: {
        include: { product: true },
      },
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderAndVerify(id, user.workspaceId);
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  return NextResponse.json({
    id: order.id,
    supplierId: order.supplierId,
    supplierName: order.supplier.name,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    notes: order.notes,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderAndVerify(id, user.workspaceId);
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const body = await request.json();
  const prisma = getPrisma();

  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: `Estado invalido. Validos: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const isBecomingReceived = body.status === "RECEIVED" && order.status !== "RECEIVED";
  const wasReceived = order.status === "RECEIVED" && body.status !== "RECEIVED";

  try {
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.supplierId !== undefined && { supplierId: body.supplierId }),
      },
    });

    if (isBecomingReceived) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }
    } else if (wasReceived) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }
    }

    const response: Record<string, unknown> = {
      id: updated.id,
      status: updated.status,
      totalAmount: Number(updated.totalAmount),
    };

    if (isBecomingReceived) {
      response.stockUpdated = true;
      response.itemsReceived = order.items.map((i) => ({
        product: i.product.name,
        quantity: i.quantity,
      }));
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Error al actualizar la orden" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderAndVerify(id, user.workspaceId);
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  if (order.status === "RECEIVED") {
    return NextResponse.json({
      error: "No se puede eliminar una orden recibida. Primero cambiala a otro estado.",
    }, { status: 400 });
  }

  const prisma = getPrisma();
  await prisma.purchaseOrder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
