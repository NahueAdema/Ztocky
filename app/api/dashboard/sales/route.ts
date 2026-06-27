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
      product: { workspaceId: user.workspaceId },
    },
    include: { product: true },
    orderBy: { saleDate: "desc" },
    take: limit,
  });

  return NextResponse.json({
    sales: sales.map((s) => ({
      id: s.id,
      productId: s.productId,
      productName: s.product.name,
      productSku: s.product.sku,
      quantity: s.quantity,
      saleDate: s.saleDate.toISOString().slice(0, 10),
      unitPrice: Number(s.unitPrice),
      totalAmount: Number(s.totalAmount),
      createdAt: s.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { productId, quantity, saleDate, unitPrice } = body;

  if (!productId || !quantity || !saleDate || !unitPrice) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }

  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      workspaceId: user.workspaceId,
    },
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

    await prisma.$transaction([
      prisma.sale.create({
        data: {
          productId,
          quantity: Number(quantity),
          saleDate: new Date(saleDate),
          unitPrice: Number(unitPrice),
          totalAmount,
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
