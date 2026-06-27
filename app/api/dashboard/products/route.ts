import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: {
      workspaceId: user.workspaceId,
    },
    include: {
      catalogItems: {
        include: { supplier: { select: { name: true } } },
      },
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
      suppliers: p.catalogItems.map((ci) => ({
        supplierId: ci.supplierId,
        supplierName: ci.supplier.name,
        unitPrice: Number(ci.unitPrice),
        minOrderQty: ci.minOrderQty,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, sku, description, currentStock, minStock, costPrice, sellingPrice, category, isActive, supplierId, catalogUnitPrice, catalogMinQty } = body;

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

    if (supplierId && catalogUnitPrice) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, workspaceId: user.workspaceId },
      });
      if (supplier) {
        await prisma.catalogItems.create({
          data: {
            supplierId,
            productId: product.id,
            unitPrice: Number(catalogUnitPrice),
            minOrderQty: Number(catalogMinQty) || 1,
          },
        }).catch(() => {});
      }
    }

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
