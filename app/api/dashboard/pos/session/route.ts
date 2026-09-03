import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");

  const prisma = getPrisma();

  const openRegister = await prisma.cashRegister.findFirst({
    where: {
      workspaceId: user.workspaceId!,
      openedBy: user.id,
      status: "OPEN",
      // Si llega deviceId, sólo vemos la caja abierta en ese dispositivo.
      // Si no llega, mantenemos el comportamiento anterior (cualquier caja del usuario).
      ...(deviceId ? { deviceId } : {}),
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

  const señaPayments = await prisma.accountPayment.findMany({
    where: {
      workspaceId: user.workspaceId!,
      createdAt: { gte: openRegister.openedAt },
      note: { startsWith: "Seña venta" },
    },
    select: { amount: true },
  });

  const cashSales =
    openRegister.sales
      .filter((s) => s.paymentMethod === "CASH")
      .reduce((sum, s) => sum + Number(s.totalAmount), 0) +
    señaPayments.reduce((sum, s) => sum + Number(s.amount), 0);

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
  const { openingAmount, notes, deviceId } = body as { openingAmount: number; notes?: string; deviceId?: string };

  if (openingAmount === undefined || openingAmount < 0) {
    return NextResponse.json({ error: "Monto de apertura requerido" }, { status: 400 });
  }

  const prisma = getPrisma();

  // Si el mismo dispositivo ya tiene una caja abierta, no abrir otra.
  // Un mismo usuario puede abrir cajas distintas en dispositivos distintos (múltiples puntos de venta).
  if (deviceId) {
    const deviceOpen = await prisma.cashRegister.findFirst({
      where: {
        workspaceId: user.workspaceId!,
        deviceId,
        status: "OPEN",
      },
    });
    if (deviceOpen) {
      return NextResponse.json({ error: "Este punto de venta ya tiene una caja abierta" }, { status: 400 });
    }
  }

  const register = await prisma.cashRegister.create({
    data: {
      workspaceId: user.workspaceId!,
      openedBy: user.id,
      deviceId: deviceId || null,
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

  const señaPayments = await prisma.accountPayment.findMany({
    where: {
      workspaceId: user.workspaceId!,
      createdAt: { gte: register.openedAt },
      note: { startsWith: "Seña venta" },
    },
    select: { amount: true },
  });

  const cashFromSales = register.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const cashFromSeñas = señaPayments.reduce((sum, s) => sum + Number(s.amount), 0);
  const expectedCash = Number(register.openingAmount) + cashFromSales + cashFromSeñas;
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

  // Alerta in-app si hay discrepancia al cerrar la caja
  if (Math.abs(difference) > 0.01 && user.workspaceId) {
    try {
      const money2 = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
      const deficit = difference < 0;
      await prisma.alert.create({
        data: {
          workspaceId: user.workspaceId,
          type: "REGISTER_DISCREPANCY",
          title: deficit ? "Faltante en caja" : "Sobrante en caja",
          message: `Cierre de caja con ${
            deficit ? "faltante" : "sobrante"
          } de ${money2.format(Math.abs(difference))}. Esperado: ${money2.format(expectedCash)}, contado: ${money2.format(closingAmount)}.`,
          href: "/dashboard/pos",
          metadata: {
            registerId: register.id,
            difference,
            expectedCash,
            closingAmount,
            closedBy: user.id,
          },
        },
      });
    } catch { /* alert creation silent */ }
  }

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
