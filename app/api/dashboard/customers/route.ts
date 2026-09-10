import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { assertCanWrite, READ_ONLY_ERROR } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const hasPagination = limitParam !== null || offsetParam !== null;
  const limit = hasPagination ? Math.min(Math.max(Number(limitParam) || 50, 1), 500) : undefined;
  const offset = hasPagination ? Math.max(Number(offsetParam) || 0, 0) : undefined;

  const prisma = getPrisma();

  const where: Record<string, unknown> = { workspaceId: user.workspaceId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        _count: { select: { sales: true, accountPayments: true } },
      },
      ...(limit !== undefined ? { skip: offset ?? 0, take: limit } : {}),
    }),
  ]);

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      createdAt: c.createdAt.toISOString(),
      _count: { sales: c._count.sales, accountPayments: c._count.accountPayments },
      sales: [],
    })),
    total,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });
  if (!(await assertCanWrite(user))) {
    return NextResponse.json({ error: READ_ONLY_ERROR }, { status: 403 });
  }

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
