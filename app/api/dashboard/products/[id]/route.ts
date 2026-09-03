import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, permissionError } from "@/lib/permissions";

async function getProductAndVerify(id: string, workspaceId: string | null) {
  const prisma = getPrisma();
  return prisma.product.findFirst({
    where: {
      id,
      workspaceId,
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const product = await getProductAndVerify(id, user.workspaceId);
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    currentStock: product.currentStock,
    minStock: product.minStock,
    costPrice: Number(product.costPrice),
    sellingPrice: Number(product.sellingPrice),
    category: product.category,
    isActive: product.isActive,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!can("product:edit", user.role)) {
    return NextResponse.json(permissionError().json, { status: permissionError().status });
  }

  const { id } = await params;
  const product = await getProductAndVerify(id, user.workspaceId);
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const body = await request.json();

  const prisma = getPrisma();
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.currentStock !== undefined && { currentStock: Number(body.currentStock) }),
        ...(body.minStock !== undefined && { minStock: Number(body.minStock) }),
        ...(body.costPrice !== undefined && { costPrice: Number(body.costPrice) }),
        ...(body.sellingPrice !== undefined && { sellingPrice: Number(body.sellingPrice) }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      sku: updated.sku,
      currentStock: updated.currentStock,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un producto con ese SKU" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!can("product:edit", user.role)) {
    return NextResponse.json(permissionError("No tenés permiso para eliminar productos").json, { status: permissionError().status });
  }

  const prisma = getPrisma();

  const { id } = await params;
  const product = await getProductAndVerify(id, user.workspaceId);
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
