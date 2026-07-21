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
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {};

  if (supplierId) where.supplierId = supplierId;
  if (productId) where.productId = productId;

  const [items, total] = await Promise.all([
    prisma.priceHistory.findMany({
      where,
      include: {
        catalogItem: {
          include: {
            supplier: { select: { id: true, name: true } },
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.priceHistory.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      catalogItemId: item.catalogItemId,
      supplierId: item.supplierId,
      supplierName: item.catalogItem?.supplier?.name ?? "N/A",
      productId: item.productId,
      productName: item.catalogItem?.product?.name ?? "N/A",
      productSku: item.catalogItem?.product?.sku ?? "N/A",
      previousPrice: item.previousPrice ? Number(item.previousPrice) : null,
      newPrice: Number(item.newPrice),
      previousMinQty: item.previousMinQty,
      newMinQty: item.newMinQty,
      changeType: item.changeType,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
