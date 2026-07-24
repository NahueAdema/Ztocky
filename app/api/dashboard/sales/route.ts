import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const sales = await prisma.sale.findMany({
    where: {
      workspaceId: user.workspaceId,
    },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { saleDate: "desc" },
    take: limit,
  });

  return NextResponse.json({
    sales: sales.map((s) => ({
      id: s.id,
      receiptNumber: s.receiptNumber,
      items: s.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      totalAmount: Number(s.totalAmount),
      discountAmount: Number(s.discountAmount),
      paymentMethod: s.paymentMethod,
      status: s.status,
      saleDate: s.saleDate.toISOString().slice(0, 10),
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const prisma = getPrisma();

  const isLegacy = !!body.productId;

  if (isLegacy) {
    const { productId, quantity, saleDate, unitPrice } = body;
    if (!productId || !quantity || !saleDate || !unitPrice) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId: user.workspaceId },
    });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    if (product.currentStock < Number(quantity)) {
      return NextResponse.json({
        error: `Stock insuficiente. Hay ${product.currentStock} unidades disponibles.`,
      }, { status: 400 });
    }

    try {
      const totalAmount = Number(quantity) * Number(unitPrice);

      const maxSale = await prisma.sale.findFirst({
        where: { workspaceId: user.workspaceId },
        orderBy: { receiptNumber: "desc" },
      });
      const receiptNumber = (maxSale?.receiptNumber ?? 0) + 1;

      await prisma.$transaction([
        prisma.sale.create({
          data: {
            workspaceId: user.workspaceId,
            userId: user.id,
            receiptNumber,
            paymentMethod: "CASH",
            totalAmount,
            saleDate: new Date(saleDate),
            items: {
              create: {
                productId,
                quantity: Number(quantity),
                unitPrice: Number(unitPrice),
                totalPrice: totalAmount,
              },
            },
          },
        }),
        prisma.product.update({
          where: { id: productId },
          data: { currentStock: { decrement: Number(quantity) } },
        }),
      ]);

      const newStock = product.currentStock - Number(quantity);

      return NextResponse.json({
        success: true,
        newStock,
        saleDate: new Date(saleDate).toISOString().slice(0, 10),
        totalAmount,
      }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Error al crear la venta" }, { status: 500 });
    }
  }

  const { items, saleDate, paymentMethod, discountAmount, cashRegisterId } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Debe incluir al menos un item" }, { status: 400 });
  }

  try {
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, workspaceId: user.workspaceId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Producto ${item.productId} no encontrado` }, { status: 404 });
      }
      if (product.currentStock < item.quantity) {
        return NextResponse.json({
          error: `Stock insuficiente para ${product.name}. Hay ${product.currentStock} unidades.`,
        }, { status: 400 });
      }
    }

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
      0,
    ) - Number(discountAmount || 0);

    const maxSale = await prisma.sale.findFirst({
      where: { workspaceId: user.workspaceId },
      orderBy: { receiptNumber: "desc" },
    });
    const receiptNumber = (maxSale?.receiptNumber ?? 0) + 1;

    await prisma.$transaction(async (tx) => {
      await tx.sale.create({
        data: {
          workspaceId: user.workspaceId,
          userId: user.id,
          receiptNumber,
          paymentMethod: paymentMethod || "CASH",
          discountAmount: Number(discountAmount || 0),
          totalAmount,
          cashRegisterId: cashRegisterId || null,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          items: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }
    });

    return NextResponse.json({
      success: true,
      receiptNumber,
      totalAmount,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear la venta" }, { status: 500 });
  }
}
