import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");
  const productId = searchParams.get("productId");

  const where: Record<string, unknown> = {};

  if (supplierId) where.supplierId = supplierId;
  if (productId) where.productId = productId;

  if (supplierId || productId) {
    const items = await prisma.catalogItems.findMany({
      where,
      include: {
        supplier: true,
        product: true,
      },
      orderBy: [{ supplier: { name: "asc" } }, { product: { name: "asc" } }],
    });

    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        supplierId: i.supplierId,
        supplierName: i.supplier.name,
        productId: i.productId,
        productName: i.product.name,
        productSku: i.product.sku,
        unitPrice: Number(i.unitPrice),
        minOrderQty: i.minOrderQty,
      })),
    });
  }

  const suppliers = await prisma.supplier.findMany({
    where: {
      OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }],
    },
    include: {
      catalog: {
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      products: s.catalog.map((c) => ({
        catalogId: c.id,
        productId: c.productId,
        productName: c.product.name,
        productSku: c.product.sku,
        unitPrice: Number(c.unitPrice),
        minOrderQty: c.minOrderQty,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { supplierId, productId, unitPrice, minOrderQty } = body;

  if (!supplierId || !productId || !unitPrice) {
    return NextResponse.json({ error: "Proveedor, producto y precio son obligatorios" }, { status: 400 });
  }

  const prisma = getPrisma();

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }] },
  });
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id: productId, OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }] },
  });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  try {
    const item = await prisma.catalogItems.create({
      data: {
        supplierId,
        productId,
        unitPrice: Number(unitPrice),
        minOrderQty: Number(minOrderQty) ?? 1,
      },
      include: {
        supplier: true,
        product: true,
      },
    });

    return NextResponse.json({
      id: item.id,
      supplierName: item.supplier.name,
      productName: item.product.name,
      unitPrice: Number(item.unitPrice),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe esta combinacion de proveedor y producto" }, { status: 409 });
  }
}
