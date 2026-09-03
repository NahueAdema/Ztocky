import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, permissionError } from "@/lib/permissions";
import { isMonthClosed } from "@/lib/finance";

const CATEGORIES = ["RENT", "PAYROLL", "SERVICES", "SUPPLIES", "MARKETING", "TRANSPORT", "TAXES", "OTHER"] as const;
const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;
const TAX_RATES = [0, 10.5, 21, 27] as const;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const category = searchParams.get("category");

  const prisma = getPrisma();

  const where: Record<string, unknown> = { workspaceId: user.workspaceId };
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 1);
    where.date = { gte: from, lt: to };
  }
  if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    where.category = category;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });
  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  return NextResponse.json({ expenses, total });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("expense:create", user.role)) {
    return NextResponse.json(permissionError().json, { status: permissionError().status });
  }

  const body = await request.json();
  const prisma = getPrisma();

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }
  const category = body.category as (typeof CATEGORIES)[number];
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  const paymentMethod = (body.paymentMethod as (typeof PAYMENT_METHODS)[number]) || "CASH";
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
  }

  const taxRate = Number(body.taxRate ?? 0);
  if (!TAX_RATES.includes(taxRate as (typeof TAX_RATES)[number])) {
    return NextResponse.json({ error: "Tasa de IVA inválida" }, { status: 400 });
  }

  const date = body.date ? new Date(body.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (await isMonthClosed(user.workspaceId, month)) {
    return NextResponse.json({ error: `El mes ${month} ya está cerrado y no puede modificarse` }, { status: 409 });
  }

  const expense = await prisma.expense.create({
    data: {
      workspaceId: user.workspaceId,
      amount: Math.round(amount * 100) / 100,
      category,
      description: (body.description ?? "").trim(),
      date,
      recurring: Boolean(body.recurring),
      paymentMethod,
      taxRate,
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json({ success: true, expense }, { status: 201 });
}
