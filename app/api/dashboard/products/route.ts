import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: {
      OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }],
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      currentStock: p.currentStock,
      minStock: p.minStock,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      category: p.category,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, sku, description, currentStock, minStock, costPrice, sellingPrice, category, isActive } = body;

  if (!name || !sku) {
    return NextResponse.json({ error: "Nombre y SKU son obligatorios" }, { status: 400 });
  }

  const prisma = getPrisma();

  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description: description ?? null,
        currentStock: Number(currentStock) ?? 0,
        minStock: Number(minStock) ?? 10,
        costPrice: Number(costPrice) ?? 0,
        sellingPrice: Number(sellingPrice) ?? 0,
        category: category ?? null,
        isActive: isActive !== false,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.currentStock,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un producto con ese SKU" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear el producto" }, { status: 500 });
  }
}
