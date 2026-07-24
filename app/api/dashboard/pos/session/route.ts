import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();

  const openRegister = await prisma.cashRegister.findFirst({
    where: {
      workspaceId: user.workspaceId!,
      openedBy: user.id,
      status: "OPEN",
    },
    include: {
      sales: {
        select: { totalAmount: true, paymentMethod: true },
      },
    },
  });

  if (!openRegister) {
    return NextResponse.json({ register: null });
  }

  const cashSales = openRegister.sales
    .filter((s) => s.paymentMethod === "CASH")
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  const totalSales = openRegister.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return NextResponse.json({
    register: {
      id: openRegister.id,
      openingAmount: Number(openRegister.openingAmount),
      status: openRegister.status,
      openedAt: openRegister.openedAt.toISOString(),
      totalSales,
      cashSales,
      transactionCount: openRegister.sales.length,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { openingAmount, notes } = body as { openingAmount: number; notes?: string };

  if (openingAmount === undefined || openingAmount < 0) {
    return NextResponse.json({ error: "Monto de apertura requerido" }, { status: 400 });
  }

  const prisma = getPrisma();

  const existingOpen = await prisma.cashRegister.findFirst({
    where: {
      workspaceId: user.workspaceId!,
      openedBy: user.id,
      status: "OPEN",
    },
  });

  if (existingOpen) {
    return NextResponse.json({ error: "Ya tenés una caja abierta" }, { status: 400 });
  }

  const register = await prisma.cashRegister.create({
    data: {
      workspaceId: user.workspaceId!,
      openedBy: user.id,
      openingAmount,
      notes: notes || null,
    },
  });

  return NextResponse.json({
    success: true,
    register: {
      id: register.id,
      openingAmount: Number(register.openingAmount),
      status: register.status,
      openedAt: register.openedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { registerId, closingAmount, notes } = body as {
    registerId: string;
    closingAmount: number;
    notes?: string;
  };

  if (!registerId) {
    return NextResponse.json({ error: "registerId requerido" }, { status: 400 });
  }

  if (closingAmount === undefined || closingAmount < 0) {
    return NextResponse.json({ error: "Monto de cierre requerido" }, { status: 400 });
  }

  const prisma = getPrisma();

  const register = await prisma.cashRegister.findFirst({
    where: {
      id: registerId,
      workspaceId: user.workspaceId!,
      status: "OPEN",
    },
    include: {
      sales: {
        where: { paymentMethod: "CASH" },
        select: { totalAmount: true },
      },
    },
  });

  if (!register) {
    return NextResponse.json({ error: "Caja no encontrada o ya cerrada" }, { status: 404 });
  }

  const cashFromSales = register.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const expectedCash = Number(register.openingAmount) + cashFromSales;
  const difference = closingAmount - expectedCash;

  const updated = await prisma.cashRegister.update({
    where: { id: registerId },
    data: {
      closedBy: user.id,
      closingAmount,
      expectedCash,
      difference,
      status: "CLOSED",
      closedAt: new Date(),
      notes: notes || register.notes,
    },
  });

  return NextResponse.json({
    success: true,
    register: {
      id: updated.id,
      openingAmount: Number(updated.openingAmount),
      closingAmount: Number(updated.closingAmount),
      expectedCash: Number(updated.expectedCash),
      difference: Number(updated.difference),
      status: updated.status,
      closedAt: updated.closedAt?.toISOString(),
    },
  });
}
