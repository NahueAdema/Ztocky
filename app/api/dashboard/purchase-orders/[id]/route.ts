import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sendOrderNotification, sendOrderToSupplier } from "@/lib/mail";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const validStatuses = ["DRAFT", "SENT", "CONFIRMED", "SHIPPED", "RECEIVED", "CANCELLED"];

async function getOrderAndVerify(id: string, workspaceId: string | null) {
  const prisma = getPrisma();
  return prisma.purchaseOrder.findFirst({
    where: {
      id,
      workspaceId,
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

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      if (order.status !== "DRAFT") {
        return NextResponse.json({ error: "Solo se pueden editar items en ordenes borrador." }, { status: 400 });
      }

      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

      const itemsTotal = body.items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
        return sum + Number(item.quantity) * Number(item.unitPrice);
      }, 0);

      await prisma.purchaseOrderItem.createMany({
        data: body.items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
          purchaseOrderId: id,
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.quantity) * Number(item.unitPrice),
        })),
      });

      await prisma.purchaseOrder.update({
        where: { id },
        data: { totalAmount: itemsTotal },
      });
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

    // Notificar por email si el estado cambio a SENT, RECEIVED o CANCELLED
    const notifyStatuses = ["SENT", "RECEIVED", "CANCELLED"];
    if (body.status && notifyStatuses.includes(body.status) && user.workspaceId) {
      try {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId: user.workspaceId },
          include: { user: { select: { email: true, name: true, emailVerified: true } } },
        });
        const total = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(updated.totalAmount));
        for (const member of members) {
          if (member.user.emailVerified) {
            sendOrderNotification(member.user.email, member.user.name, {
              id: updated.id,
              status: updated.status,
              supplierName: order.supplier.name,
              totalAmount: total,
            }).catch(() => {});
          }
        }
      } catch { /* email errors silent */ }
    }

    // Enviar la orden al proveedor por email si se marco como SENT
    if (body.status === "SENT" && order.supplier.contactEmail) {
      try {
        const orderItems = order.items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: money.format(Number(i.unitPrice)),
          totalPrice: money.format(Number(i.totalPrice)),
        }));
        const total = money.format(Number(updated.totalAmount));

        sendOrderToSupplier(order.supplier.contactEmail, {
          id: updated.id,
          supplierName: order.supplier.name,
          totalAmount: total,
          notes: updated.notes,
          items: orderItems,
        }).catch(() => {});
      } catch { /* email errors silent */ }
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
