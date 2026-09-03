import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, permissionError } from "@/lib/permissions";
import { isMonthClosed } from "@/lib/finance";

const CATEGORIES = ["RENT", "PAYROLL", "SERVICES", "SUPPLIES", "MARKETING", "TRANSPORT", "TAXES", "OTHER"] as const;
const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;
const TAX_RATES = [0, 10.5, 21, 27] as const;

function toMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function assertMonthOpen(workspaceId: string, date: Date): Promise<string | null> {
  const month = toMonth(date);
  if (await isMonthClosed(workspaceId, month)) {
    return `El mes ${month} ya está cerrado y no puede modificarse`;
  }
  return null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("expense:edit", user.role)) {
    return NextResponse.json(permissionError().json, { status: permissionError().status });
  }

  const { id } = await params;
  const body = await request.json();
  const prisma = getPrisma();

  const existing = await prisma.expense.findFirst({
    where: { id, workspaceId: user.workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });

  if (body.date !== undefined) {
    const newDate = new Date(body.date);
    if (Number.isNaN(newDate.getTime())) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    const err = await assertMonthOpen(user.workspaceId, newDate);
    if (err) return NextResponse.json({ error: err }, { status: 409 });
  } else {
    const err = await assertMonthOpen(user.workspaceId, existing.date);
    if (err) return NextResponse.json({ error: err }, { status: 409 });
  }

  const data: Record<string, unknown> = {};
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }
    data.amount = Math.round(amount * 100) / 100;
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
    }
    data.category = body.category;
  }
  if (body.paymentMethod !== undefined) {
    if (!PAYMENT_METHODS.includes(body.paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }
    data.paymentMethod = body.paymentMethod;
  }
  if (body.taxRate !== undefined) {
    const taxRate = Number(body.taxRate);
    if (!TAX_RATES.includes(taxRate as (typeof TAX_RATES)[number])) {
      return NextResponse.json({ error: "Tasa de IVA inválida" }, { status: 400 });
    }
    data.taxRate = taxRate;
  }
  if (body.date !== undefined) {
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    data.date = date;
  }
  if (body.description !== undefined) data.description = (body.description ?? "").trim();
  if (body.recurring !== undefined) data.recurring = Boolean(body.recurring);
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios para guardar" }, { status: 400 });
  }

  const expense = await prisma.expense.update({ where: { id }, data });
  return NextResponse.json({ success: true, expense });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("expense:delete", user.role)) {
    return NextResponse.json(permissionError().json, { status: permissionError().status });
  }

  const { id } = await params;
  const prisma = getPrisma();

  const existing = await prisma.expense.findFirst({
    where: { id, workspaceId: user.workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });

  const err = await assertMonthOpen(user.workspaceId, existing.date);
  if (err) return NextResponse.json({ error: err }, { status: 409 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
