import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { assertCanWrite, READ_ONLY_ERROR } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const hasPagination = limitParam !== null || offsetParam !== null;
  const limit = hasPagination ? Math.min(Math.max(Number(limitParam) || 15, 1), 500) : undefined;
  const offset = hasPagination ? Math.max(Number(offsetParam) || 0, 0) : undefined;

  const where: Record<string, unknown> = {
    workspaceId: user.workspaceId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactEmail: { contains: search, mode: "insensitive" } },
      { contactPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      include: {
        catalog: {
          include: { product: true },
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...(limit !== undefined ? { skip: offset ?? 0, take: limit } : {}),
    }),
  ]);

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
    total,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await assertCanWrite(user))) {
    return NextResponse.json({ error: READ_ONLY_ERROR }, { status: 403 });
  }

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
