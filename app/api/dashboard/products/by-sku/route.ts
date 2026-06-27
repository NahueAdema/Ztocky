import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku");

  if (!sku) {
    return NextResponse.json({ error: "SKU es requerido" }, { status: 400 });
  }

  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: {
      sku,
      workspaceId: user.workspaceId,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      minStock: true,
      costPrice: true,
      sellingPrice: true,
      category: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    sku: product.sku,
    currentStock: product.currentStock,
    minStock: product.minStock,
    costPrice: Number(product.costPrice),
    sellingPrice: Number(product.sellingPrice),
    category: product.category,
  });
}
