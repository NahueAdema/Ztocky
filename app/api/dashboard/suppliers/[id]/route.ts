import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

async function getSupplierAndVerify(id: string, workspaceId: string | null) {
  const prisma = getPrisma();
  return prisma.supplier.findFirst({
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
  const supplier = await getSupplierAndVerify(id, user.workspaceId);
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  return NextResponse.json({
    id: supplier.id,
    name: supplier.name,
    contactEmail: supplier.contactEmail,
    contactPhone: supplier.contactPhone,
    leadTime: supplier.leadTime,
    shippingCost: Number(supplier.shippingCost),
    reliability: supplier.reliability,
    notes: supplier.notes,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supplier = await getSupplierAndVerify(id, user.workspaceId);
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const body = await request.json();
  const prisma = getPrisma();

  try {
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.leadTime !== undefined && { leadTime: Number(body.leadTime) }),
        ...(body.shippingCost !== undefined && { shippingCost: Number(body.shippingCost) }),
        ...(body.reliability !== undefined && { reliability: Number(body.reliability) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      contactEmail: updated.contactEmail,
      leadTime: updated.leadTime,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar el proveedor" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supplier = await getSupplierAndVerify(id, user.workspaceId);
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const prisma = getPrisma();
  await prisma.supplier.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
