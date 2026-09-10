import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { assertCanWrite, READ_ONLY_ERROR } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const hasPagination = limitParam !== null || offsetParam !== null;
  const limit = hasPagination ? Math.min(Math.max(Number(limitParam) || 50, 1), 500) : undefined;
  const offset = hasPagination ? Math.max(Number(offsetParam) || 0, 0) : undefined;

  const where: Record<string, unknown> = { workspaceId: user.workspaceId };
  if (search) {
    const numSearch = Number(search);
    const productWhere: Record<string, unknown> = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    };
    const conditions: Record<string, unknown>[] = [
      { items: { some: { saleItem: { product: productWhere } } } },
    ];
    if (Number.isFinite(numSearch)) {
      conditions.push({ sale: { receiptNumber: numSearch } });
    }
    where.OR = conditions;
  }

  const [total, returns] = await Promise.all([
    prisma.return.count({ where }),
    prisma.return.findMany({
      where,
      include: {
        items: {
          include: {
            saleItem: { include: { product: true } },
          },
        },
        sale: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(limit !== undefined ? { skip: offset ?? 0, take: limit } : {}),
    }),
  ]);

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
    total,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await assertCanWrite(user))) {
    return NextResponse.json({ error: READ_ONLY_ERROR }, { status: 403 });
  }

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
