import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

async function getCatalogItemAndVerify(id: string, workspaceId: string | null) {
  const prisma = getPrisma();
  const item = await prisma.catalogItems.findUnique({
    where: { id },
    include: { supplier: true, product: true },
  });

  if (!item) return null;

  const supplierOwned = item.supplier.workspaceId === workspaceId || item.supplier.workspaceId === null;
  const productOwned = item.product.workspaceId === workspaceId || item.product.workspaceId === null;

  return supplierOwned && productOwned ? item : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const item = await getCatalogItemAndVerify(id, user.workspaceId);
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await request.json();
  const prisma = getPrisma();

  try {
    const updated = await prisma.catalogItems.update({
      where: { id },
      data: {
        ...(body.unitPrice !== undefined && { unitPrice: Number(body.unitPrice) }),
        ...(body.minOrderQty !== undefined && { minOrderQty: Number(body.minOrderQty) }),
      },
      include: { supplier: true, product: true },
    });

    return NextResponse.json({
      id: updated.id,
      unitPrice: Number(updated.unitPrice),
      minOrderQty: updated.minOrderQty,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const item = await getCatalogItemAndVerify(id, user.workspaceId);
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const prisma = getPrisma();
  await prisma.catalogItems.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
