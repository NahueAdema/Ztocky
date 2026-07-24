import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    items: { include: { product: true } };
    user: { select: { name: true } };
  };
}>;

async function getSaleAndVerify(id: string, workspaceId: string): Promise<SaleWithDetails | null> {
  const prisma = getPrisma();
  return prisma.sale.findFirst({
    where: {
      id,
      workspaceId,
    },
    include: {
      items: { include: { product: true } },
      user: { select: { name: true } },
    },
  }) as Promise<SaleWithDetails | null>;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sale = await getSaleAndVerify(id, user.workspaceId!);
  if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  return NextResponse.json({
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    sellerName: sale.user.name,
    items: sale.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    totalAmount: Number(sale.totalAmount),
    discountAmount: Number(sale.discountAmount),
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    saleDate: sale.saleDate.toISOString().slice(0, 10),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sale = await getSaleAndVerify(id, user.workspaceId!);
  if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  const body = await request.json();
  const prisma = getPrisma();

  try {
    if (body.items && Array.isArray(body.items)) {
      const oldItems = sale.items;
      const typedItems: { productId: string; quantity: number; unitPrice: number }[] = body.items;
      const newItemMap = new Map(typedItems.map((i) => [i.productId, i]));

      const stockDiffs: { productId: string; diff: number }[] = [];

      for (const oldItem of oldItems) {
        const newItem = newItemMap.get(oldItem.productId);
        const newQty = newItem?.quantity ?? 0;
        const diff = newQty - oldItem.quantity;
        if (diff !== 0) {
          stockDiffs.push({ productId: oldItem.productId, diff });
        }
      }

      for (const diff of stockDiffs) {
        if (diff.diff > 0) {
          const product = await prisma.product.findUnique({ where: { id: diff.productId } });
          if (product && product.currentStock < diff.diff) {
            return NextResponse.json({
              error: `Stock insuficiente para ${product.name}. Hay ${product.currentStock} unidades.`,
            }, { status: 400 });
          }
        }
      }

      const newTotal = typedItems.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0,
      ) - Number(body.discountAmount ?? sale.discountAmount);

      await prisma.$transaction(async (tx) => {
        for (const oldItem of oldItems) {
          await tx.saleItem.delete({ where: { id: oldItem.id } });
        }

        await tx.saleItem.createMany({
          data: typedItems.map((i) => ({
            saleId: id,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          })),
        });

        await tx.sale.update({
          where: { id },
          data: {
            totalAmount: newTotal,
            ...(body.discountAmount !== undefined && { discountAmount: Number(body.discountAmount) }),
            ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
            ...(body.saleDate !== undefined && { saleDate: new Date(body.saleDate) }),
          },
        });

        for (const diff of stockDiffs) {
          await tx.product.update({
            where: { id: diff.productId },
            data: { currentStock: { decrement: diff.diff } },
          });
        }
      });

      return NextResponse.json({ id: sale.id, totalAmount: newTotal });
    }

    if (body.status) {
      const updated = await prisma.sale.update({
        where: { id },
        data: { status: body.status },
      });
      return NextResponse.json({ id: updated.id, status: updated.status });
    }

    return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Error al actualizar la venta" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sale = await getSaleAndVerify(id, user.workspaceId!);
  if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  const prisma = getPrisma();

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      await tx.saleItem.deleteMany({ where: { saleId: id } });
      await tx.sale.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      restoredItems: sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  } catch {
    return NextResponse.json({ error: "Error al eliminar la venta" }, { status: 500 });
  }
}
