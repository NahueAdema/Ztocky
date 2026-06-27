import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      workspaceId: user.workspaceId,
    },
    include: {
      supplier: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      supplierId: o.supplierId,
      supplierName: o.supplier.name,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      notes: o.notes,
      generatedByAI: o.generatedByAI,
      emailSentAt: o.emailSentAt?.toISOString() ?? null,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        productSku: i.product.sku,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { supplierId, status, notes, items } = body;

  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Proveedor y al menos un item son obligatorios" }, { status: 400 });
  }

  const prisma = getPrisma();
  const supplier = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      workspaceId: user.workspaceId,
    },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }

  try {
    const totalAmount = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
      return sum + Number(item.quantity) * Number(item.unitPrice);
    }, 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        status: status ?? "DRAFT",
        totalAmount,
        notes: notes ?? null,
        workspaceId: user.workspaceId,
        items: {
          create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.quantity) * Number(item.unitPrice),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      id: order.id,
      supplierId: order.supplierId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      itemsCount: order.items.length,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear la orden de compra" }, { status: 500 });
  }
}
