import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

async function getSaleAndVerify(id: string, workspaceId: string | null | undefined) {
  const prisma = getPrisma();
  return prisma.sale.findFirst({
    where: {
      id,
      product: { workspaceId },
    },
    include: { product: true },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sale = await getSaleAndVerify(id, user.workspaceId);
  if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  return NextResponse.json({
    id: sale.id,
    productId: sale.productId,
    productName: sale.product.name,
    quantity: sale.quantity,
    saleDate: sale.saleDate.toISOString().slice(0, 10),
    unitPrice: Number(sale.unitPrice),
    totalAmount: Number(sale.totalAmount),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sale = await getSaleAndVerify(id, user.workspaceId);
  if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  const body = await request.json();
  const prisma = getPrisma();

  const newQuantity = body.quantity !== undefined ? Number(body.quantity) : sale.quantity;
  const quantityDiff = newQuantity - sale.quantity;

  if (quantityDiff > 0 && sale.product.currentStock < quantityDiff) {
    return NextResponse.json({
      error: `Stock insuficiente. Hay ${sale.product.currentStock} unidades disponibles.`,
    }, { status: 400 });
  }

  const totalAmount = body.quantity !== undefined && body.unitPrice !== undefined
    ? Number(body.quantity) * Number(body.unitPrice)
    : undefined;

  try {
    await prisma.$transaction([
      prisma.sale.update({
        where: { id },
        data: {
          ...(body.productId !== undefined && { productId: body.productId }),
          ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
          ...(body.saleDate !== undefined && { saleDate: new Date(body.saleDate) }),
          ...(body.unitPrice !== undefined && { unitPrice: Number(body.unitPrice) }),
          ...(totalAmount !== undefined && { totalAmount }),
        },
      }),
      ...(quantityDiff !== 0 ? [
        prisma.product.update({
          where: { id: sale.productId },
          data: { currentStock: { decrement: quantityDiff } },
        }),
      ] : []),
    ]);

    return NextResponse.json({
      id: sale.id,
      quantity: newQuantity,
      newStock: sale.product.currentStock - quantityDiff,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar la venta" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sale = await getSaleAndVerify(id, user.workspaceId);
  if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  const prisma = getPrisma();

  try {
    await prisma.$transaction([
      prisma.sale.delete({ where: { id } }),
      prisma.product.update({
        where: { id: sale.productId },
        data: { currentStock: { increment: sale.quantity } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      restoredStock: sale.quantity,
      newStock: sale.product.currentStock + sale.quantity,
    });
  } catch {
    return NextResponse.json({ error: "Error al eliminar la venta" }, { status: 500 });
  }
}
