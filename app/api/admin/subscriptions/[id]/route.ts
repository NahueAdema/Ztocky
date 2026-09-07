import { NextResponse } from "next/server";

import { getRequiredSuperAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const VALID_STATUS = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getRequiredSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const prisma = getPrisma();

  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
  }

  // ── Cambiar plan ─────────────────────────────────────────────
  if (body.action === "changePlan") {
    if (existing.status === "EXPIRED") {
      return NextResponse.json(
        { error: "No podés cambiar de plan una suscripción vencida. Reactivala primero." },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 400 });
    }

    await prisma.subscription.update({
      where: { id },
      data: { planId: body.planId },
    });
    return NextResponse.json({ ok: true });
  }

  // ── Extender trial ───────────────────────────────────────────
  if (body.action === "extendTrial") {
    const days = Number(body.days);
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      return NextResponse.json({ error: "Días inválidos (1-365)" }, { status: 400 });
    }

    const base = existing.trialEndsAt && existing.trialEndsAt > new Date()
      ? existing.trialEndsAt
      : new Date();
    const end = new Date(base);
    end.setDate(end.getDate() + days);

    await prisma.subscription.update({
      where: { id },
      data: {
        status: "TRIAL",
        trialEndsAt: end,
        currentPeriodEnd: end,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // ── Cancelar ─────────────────────────────────────────────────
  if (body.action === "cancel") {
    await prisma.subscription.update({
      where: { id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  // ── Reactivar manualmente (pago recibido por otra vía) ───────
  if (body.action === "reactivate") {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await prisma.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        canceledAt: null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // ── Marcar estado manual ─────────────────────────────────────
  if (body.action === "setStatus") {
    const status = String(body.status || "");
    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const data: Record<string, unknown> = { status };
    if (status === "ACTIVE" && !existing.currentPeriodEnd) {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      data.currentPeriodEnd = periodEnd;
      data.canceledAt = null;
    }
    if (status === "CANCELED") {
      data.canceledAt = new Date();
    }

    await prisma.subscription.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}