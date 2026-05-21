import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const suppliers = await prisma.supplier.findMany({
    where: {
      OR: [{ workspaceId: user.workspaceId }, { workspaceId: null }],
    },
    include: {
      catalog: {
        include: { product: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      leadTime: s.leadTime,
      shippingCost: Number(s.shippingCost),
      reliability: s.reliability,
      notes: s.notes,
      products: s.catalog.map((c) => ({
        productId: c.productId,
        productName: c.product.name,
        unitPrice: Number(c.unitPrice),
        minOrderQty: c.minOrderQty,
      })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, contactEmail, contactPhone, leadTime, shippingCost, reliability, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const prisma = getPrisma();

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactEmail: contactEmail ?? null,
        contactPhone: contactPhone ?? null,
        leadTime: Number(leadTime) ?? 7,
        shippingCost: Number(shippingCost) ?? 0,
        reliability: Number(reliability) ?? 4.5,
        notes: notes ?? null,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({
      id: supplier.id,
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      leadTime: supplier.leadTime,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear el proveedor" }, { status: 500 });
  }
}
