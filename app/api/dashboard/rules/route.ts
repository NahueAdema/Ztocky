import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const VALID_TYPES = ["STOCK_STATE", "EVENT", "DIGEST"];
const VALID_FREQUENCIES = ["DAILY", "EVERY_3_DAYS", "WEEKLY", "MONTHLY"];
const VALID_STATES = ["CRITICAL_STOCK", "LOW_STOCK", "STAGNANT_STOCK"];
const VALID_EVENTS = [
  "ORDER_STATUS",
  "REGISTER_DISCREPANCY",
  "PAYMENT_RECEIVED",
  "PRICE_CHANGE",
  "SUPPLIER_RISK",
  "LOW_BALANCE",
];
const VALID_CHANNELS = ["email", "inApp", "push"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateConfig(type: string, config: unknown): { ok: true; config: Prisma.InputJsonValue } | { ok: false; error: string } {
  if (!isObject(config)) return { ok: false, error: "config debe ser un objeto" };

  if (type === "STOCK_STATE") {
    const states = config.states;
    if (!Array.isArray(states) || states.length === 0) {
      return { ok: false, error: "Selecciona al menos un estado (crítico y/o bajo)." };
    }
    for (const s of states) {
      if (!VALID_STATES.includes(s as string)) {
        return { ok: false, error: `Estado inválido: ${String(s)}` };
      }
    }
    return { ok: true, config: { states } };
  }

  if (type === "EVENT") {
    const events = config.events;
    if (!Array.isArray(events) || events.length === 0) {
      return { ok: false, error: "Selecciona al menos un evento." };
    }
    for (const e of events) {
      if (!VALID_EVENTS.includes(e as string)) {
        return { ok: false, error: `Evento inválido: ${String(e)}` };
      }
    }
    return { ok: true, config: { events } };
  }

  if (type === "DIGEST") {
    const frequency = config.frequency as string | undefined;
    if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
      return { ok: false, error: "Frecuencia inválida." };
    }
    return { ok: true, config: { frequency } };
  }

  return { ok: false, error: "Tipo de regla inválido." };
}

function validateChannels(channels: unknown): { ok: true; channels: Prisma.InputJsonValue } | { ok: false; error: string } {
  if (!isObject(channels)) return { ok: false, error: "channels debe ser un objeto" };
  const clean: Record<string, boolean> = {};
  if (channels.inApp === true || channels.inApp === undefined) clean.inApp = true;
  let included = false;
  for (const c of VALID_CHANNELS) {
    if (channels[c] === true) {
      clean[c] = true;
      included = true;
    } else {
      clean[c] = false;
    }
  }
  if (!included) return { ok: false, error: "Selecciona al menos un canal." };
  return { ok: true, channels: clean };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const prisma = getPrisma();
  const rules = await prisma.alertRule.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    rules: rules.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      config: r.config,
      channels: r.channels,
      enabled: r.enabled,
      lastTriggeredAt: r.lastTriggeredAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const body = await request.json();
  const { name, type, config, channels } = body;

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "La regla necesita un nombre." }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as string)) {
    return NextResponse.json({ error: "Tipo de regla inválido." }, { status: 400 });
  }

  const configResult = validateConfig(type as string, config);
  if (!configResult.ok) {
    return NextResponse.json({ error: configResult.error }, { status: 400 });
  }
  const channelsResult = validateChannels(channels);
  if (!channelsResult.ok) {
    return NextResponse.json({ error: channelsResult.error }, { status: 400 });
  }

  const prisma = getPrisma();
  const rule = await prisma.alertRule.create({
    data: {
      workspaceId: user.workspaceId,
      name: String(name).trim(),
      type: type as "STOCK_STATE" | "EVENT" | "DIGEST",
      config: configResult.config,
      channels: channelsResult.channels,
      enabled: body.enabled === false ? false : true,
    },
  });

  return NextResponse.json({
    id: rule.id,
    name: rule.name,
    type: rule.type,
    config: rule.config,
    channels: rule.channels,
    enabled: rule.enabled,
    lastTriggeredAt: rule.lastTriggeredAt?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const body = await request.json();
  const { id, name, config, channels, enabled, type } = body;

  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const prisma = getPrisma();
  const existing = await prisma.alertRule.findFirst({
    where: { id, workspaceId: user.workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!String(name).trim()) return NextResponse.json({ error: "El nombre no puede estar vacío." }, { status: 400 });
    data.name = String(name).trim();
  }
  if (enabled !== undefined) {
    data.enabled = !!enabled;
  }
  if (config !== undefined || type !== undefined) {
    const ruleType = type ?? existing.type;
    const configResult = validateConfig(ruleType as string, config ?? existing.config);
    if (!configResult.ok) return NextResponse.json({ error: configResult.error }, { status: 400 });
    data.config = configResult.config;
  }
  if (channels !== undefined) {
    const channelsResult = validateChannels(channels);
    if (!channelsResult.ok) return NextResponse.json({ error: channelsResult.error }, { status: 400 });
    data.channels = channelsResult.channels;
  }

  const rule = await prisma.alertRule.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    id: rule.id,
    name: rule.name,
    type: rule.type,
    config: rule.config,
    channels: rule.channels,
    enabled: rule.enabled,
    lastTriggeredAt: rule.lastTriggeredAt?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const prisma = getPrisma();
  const existing = await prisma.alertRule.findFirst({
    where: { id, workspaceId: user.workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });

  await prisma.alertRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}