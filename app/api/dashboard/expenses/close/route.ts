import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { can, permissionError } from "@/lib/permissions";
import { closeMonth, listMonthlyCloses, isMonthClosed } from "@/lib/finance";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });

  const closes = await listMonthlyCloses(user.workspaceId);
  return NextResponse.json({
    closes: closes.map((c) => ({
      id: c.id,
      month: c.month,
      revenue: Number(c.revenue),
      manualExpenses: Number(c.manualExpenses),
      purchases: Number(c.purchases),
      netProfit: Number(c.netProfit),
      closedAt: c.closedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("expense:closeMonth", user.role)) {
    return NextResponse.json(permissionError("Solo el propietario o administrador puede cerrar el mes").json, { status: permissionError().status });
  }

  const body = await request.json();
  const { month } = body as { month?: string };
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Mes inválido (formato YYYY-MM)" }, { status: 400 });
  }

  const closed = await isMonthClosed(user.workspaceId, month);
  if (closed) {
    return NextResponse.json({ error: "Ese mes ya fue cerrado" }, { status: 409 });
  }

  const result = await closeMonth(user.workspaceId, month, user.id);
  if (!result) {
    return NextResponse.json({ error: "Ese mes ya fue cerrado" }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    close: {
      id: result.id,
      month: result.month,
      revenue: Number(result.revenue),
      manualExpenses: Number(result.manualExpenses),
      purchases: Number(result.purchases),
      netProfit: Number(result.netProfit),
    },
  });
}
