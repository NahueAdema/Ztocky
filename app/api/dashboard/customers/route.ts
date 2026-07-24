import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const prisma = getPrisma();
  const customers = await prisma.customer.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const body = await request.json();
  const { name, email, phone, address } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const prisma = getPrisma();

  try {
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      createdAt: customer.createdAt.toISOString(),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear el cliente" }, { status: 500 });
  }
}
