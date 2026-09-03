import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeFinanceOverview, getFinanceTrend } from "@/lib/finance";
import { getPrisma } from "@/lib/prisma";

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") as string;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Mes inválido (formato YYYY-MM)" }, { status: 400 });
  }

  const prisma = getPrisma();
  const prev = prevMonth(month);

  const [current, previous, trend, closed] = await Promise.all([
    computeFinanceOverview(user.workspaceId, month),
    computeFinanceOverview(user.workspaceId, prev),
    getFinanceTrend(user.workspaceId, 6),
    prisma.monthlyClose.findUnique({
      where: { workspaceId_month: { workspaceId: user.workspaceId, month } },
    }),
  ]);

  return NextResponse.json({
    month,
    previousMonth: prev,
    current,
    previous,
    closed: Boolean(closed),
    trend,
  });
}
