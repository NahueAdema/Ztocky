import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { supplierId, rows, apply } = body;

  if (!supplierId || !rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Proveedor y lista de precios requeridos" }, { status: 400 });
  }

  const prisma = getPrisma();

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, workspaceId: user.workspaceId },
  });
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const existingCatalog = await prisma.catalogItems.findMany({
    where: { supplierId },
    include: { product: { select: { sku: true } } },
  });
  const existingBySku = new Map(existingCatalog.map((c) => [c.product.sku, c]));

  const skus = rows.map((r: { sku: string }) => r.sku).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { workspaceId: user.workspaceId, sku: { in: skus } },
    select: { id: true, sku: true, name: true },
  });
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const matchedNew: { sku: string; productName: string; unitPrice: number; minOrderQty: number }[] = [];
  const matchedUpdate: { sku: string; productName: string; unitPrice: number; minOrderQty: number; previousUnitPrice: number }[] = [];
  const unmatched: { sku: string; unitPrice: number }[] = [];

  for (const row of rows) {
    const sku = row.sku?.trim();
    const unitPrice = Number(row.unitPrice ?? row.precio ?? 0);
    const minOrderQty = Number(row.minOrderQty ?? row.minimo ?? 1);

    if (!sku || !unitPrice) continue;

    const product = productBySku.get(sku);
    if (!product) {
      unmatched.push({ sku, unitPrice });
      continue;
    }

    const existing = existingBySku.get(sku);
    if (existing) {
      matchedUpdate.push({
        sku,
        productName: product.name,
        unitPrice,
        minOrderQty,
        previousUnitPrice: Number(existing.unitPrice),
      });
    } else {
      matchedNew.push({
        sku,
        productName: product.name,
        unitPrice,
        minOrderQty,
      });
    }
  }

  if (apply) {
    for (const item of matchedNew) {
      const product = productBySku.get(item.sku)!;
      await prisma.catalogItems.upsert({
        where: { supplierId_productId: { supplierId, productId: product.id } },
        create: { supplierId, productId: product.id, unitPrice: item.unitPrice, minOrderQty: item.minOrderQty },
        update: { unitPrice: item.unitPrice, minOrderQty: item.minOrderQty },
      });
    }
    for (const item of matchedUpdate) {
      const product = productBySku.get(item.sku)!;
      await prisma.catalogItems.update({
        where: { supplierId_productId: { supplierId, productId: product.id } },
        data: { unitPrice: item.unitPrice, minOrderQty: item.minOrderQty },
      });
    }
  }

  return NextResponse.json({
    preview: !apply,
    applied: !!apply,
    summary: {
      total: rows.length,
      matchedNew: matchedNew.length,
      matchedUpdate: matchedUpdate.length,
      unmatched: unmatched.length,
    },
    matchedNew,
    matchedUpdate,
    unmatched,
  });
}
