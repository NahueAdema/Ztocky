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
  const payments = await prisma.accountPayment.findMany({
    where: { customerId: id, workspaceId: user.workspaceId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      note: p.note,
      userName: p.user?.name ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const { id } = await params;
  const customer = await getCustomerAndVerify(id, user.workspaceId);
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const body = await request.json();
  const { amount, note } = body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
  }

  const prisma = getPrisma();

  try {
    const payment = await prisma.accountPayment.create({
      data: {
        customerId: id,
        workspaceId: user.workspaceId,
        userId: user.id,
        amount: numAmount,
        note: note?.trim() || null,
      },
    });

    try {
      const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
      await prisma.alert.create({
        data: {
          workspaceId: user.workspaceId,
          type: "PAYMENT_RECEIVED",
          title: "Pago recibido",
          message: `${customer.name} realizo un pago de ${money.format(numAmount)}${payment.note ? ` — ${payment.note}` : ""}.`,
          href: `/dashboard/customers/${id}`,
          metadata: {
            customerId: id,
            amount: numAmount,
            userId: user.id,
            note: payment.note,
          },
        },
      });
    } catch { /* alert creation silent */ }

    return NextResponse.json({
      id: payment.id,
      amount: Number(payment.amount),
      note: payment.note,
      createdAt: payment.createdAt.toISOString(),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 });
  }
}
