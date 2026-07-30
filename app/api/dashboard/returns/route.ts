import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();

  const returns = await prisma.return.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      items: {
        include: {
          saleItem: { include: { product: true } },
        },
      },
      sale: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    returns: returns.map((r) => ({
      id: r.id,
      saleId: r.saleId,
      receiptNumber: r.sale.receiptNumber,
      reason: r.reason,
      totalRefund: Number(r.totalRefund),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      items: r.items.map((item) => ({
        id: item.id,
        productName: item.saleItem.product.name,
        productSku: item.saleItem.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { saleId, items, reason } = body;

  if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Debe incluir al menos un item para devolver" }, { status: 400 });
  }

  const prisma = getPrisma();

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, workspaceId: user.workspaceId },
    include: { items: { include: { product: true } } },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  const saleItemsMap = new Map(sale.items.map((si) => [si.id, si]));

  let totalRefund = 0;
  const returnItemsData: {
    saleItemId: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];

  for (const item of items) {
    const saleItem = saleItemsMap.get(item.saleItemId);
    if (!saleItem) {
      return NextResponse.json({ error: `Item de venta ${item.saleItemId} no encontrado` }, { status: 404 });
    }
    if (item.quantity <= 0 || item.quantity > saleItem.quantity) {
      return NextResponse.json({
        error: `Cantidad inválida para ${saleItem.product.name}. Máximo: ${saleItem.quantity}`,
      }, { status: 400 });
    }
    const unitPrice = Number(saleItem.unitPrice);
    const total = unitPrice * item.quantity;
    totalRefund += total;
    returnItemsData.push({
      saleItemId: item.saleItemId,
      quantity: item.quantity,
      unitPrice,
      total,
    });
  }

  try {
    const return_ = await prisma.$transaction(async (tx) => {
      const createdReturn = await tx.return.create({
        data: {
          saleId,
          workspaceId: user.workspaceId,
          userId: user.id,
          reason: reason || null,
          totalRefund,
          status: "COMPLETED",
          items: {
            create: returnItemsData,
          },
        },
      });

      for (const item of returnItemsData) {
        const saleItem = saleItemsMap.get(item.saleItemId)!;
        await tx.product.update({
          where: { id: saleItem.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      return createdReturn;
    });

    return NextResponse.json({ success: true, returnId: return_.id, totalRefund }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear la devolución" }, { status: 500 });
  }
}
