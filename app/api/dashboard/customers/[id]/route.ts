import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

async function getCustomerAndVerify(id: string, workspaceId: string) {
  const prisma = getPrisma();
  return prisma.customer.findFirst({
    where: { id, workspaceId },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const { id } = await params;
  const customer = await getCustomerAndVerify(id, user.workspaceId);
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const prisma = getPrisma();
  const [saleCount, totalSpent] = await Promise.all([
    prisma.sale.count({
      where: { customerId: id, workspaceId: user.workspaceId },
    }),
    prisma.sale.aggregate({
      where: { customerId: id, workspaceId: user.workspaceId },
      _sum: { totalAmount: true },
    }),
  ]);

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    createdAt: customer.createdAt.toISOString(),
    saleCount,
    totalSpent: Number(totalSpent._sum.totalAmount ?? 0),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const { id } = await params;
  const customer = await getCustomerAndVerify(id, user.workspaceId);
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const body = await request.json();
  const prisma = getPrisma();

  try {
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar el cliente" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const { id } = await params;
  const customer = await getCustomerAndVerify(id, user.workspaceId);
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const prisma = getPrisma();

  const saleCount = await prisma.sale.count({
    where: { customerId: id },
  });

  if (saleCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar un cliente con ventas asociadas" },
      { status: 409 },
    );
  }

  await prisma.customer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
