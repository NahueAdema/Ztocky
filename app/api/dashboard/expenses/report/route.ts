import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { computeMonth } from "@/lib/finance";

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) };
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
  const { from, to } = monthRange(month);

  const [current, previous, closed, monthExpenses] = await Promise.all([
    computeMonth(user.workspaceId, month),
    computeMonth(user.workspaceId, prev),
    prisma.monthlyClose.findUnique({
      where: { workspaceId_month: { workspaceId: user.workspaceId, month } },
    }),
    prisma.expense.findMany({
      where: { workspaceId: user.workspaceId, date: { gte: from, lt: to } },
      select: { amount: true, taxRate: true },
    }),
  ]);

  let deductibleTax = 0;
  for (const e of monthExpenses) {
    const rate = e.taxRate ?? 0;
    if (rate > 0) {
      const total = Number(e.amount);
      deductibleTax += total - total / (1 + rate / 100);
    }
  }

  return NextResponse.json({
    month,
    previousMonth: prev,
    current,
    previous,
    tax: { deductible: Math.round(deductibleTax * 100) / 100 },
    closed: Boolean(closed),
    close: closed ? { revenue: Number(closed.revenue), netProfit: Number(closed.netProfit) } : null,
    variance: {
      revenue: pct(current.revenue, previous.revenue),
      expenses: pct(current.expensesTotal, previous.expensesTotal),
      profit: pct(current.netProfit, previous.netProfit),
    },
  });
}

function pct(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
