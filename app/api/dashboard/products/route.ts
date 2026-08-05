import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: {
      workspaceId: user.workspaceId,
    },
    include: {
      catalogItems: {
        include: { supplier: { select: { name: true } } },
      },
      saleItems: {
        where: { sale: { saleDate: { gte: ninetyDaysAgo } } },
        select: { quantity: true, sale: { select: { saleDate: true } } },
      },
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json({
    products: products.map((p) => {
      const totalSold = p.saleItems.reduce((sum, item) => sum + item.quantity, 0);
      const saleDates = p.saleItems.map((item) => item.sale.saleDate.getTime());
      const windowDays = saleDates.length > 0
        ? Math.max(1, Math.ceil((Math.max(...saleDates) - Math.min(...saleDates)) / (1000 * 60 * 60 * 24)) + 1)
        : 0;
      const burnRate = windowDays > 0 ? Math.round((totalSold / windowDays) * 10) / 10 : 0;
      const daysRemaining = burnRate > 0 ? Math.floor(p.currentStock / burnRate) : 999;

      return {
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
        burnRate,
        daysRemaining,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        suppliers: p.catalogItems.map((ci) => ({
          supplierId: ci.supplierId,
          supplierName: ci.supplier.name,
          unitPrice: Number(ci.unitPrice),
          minOrderQty: ci.minOrderQty,
        })),
      };
    }),
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
