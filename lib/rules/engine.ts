import { getPrisma } from "@/lib/prisma";
import { sendPushToWorkspace } from "@/lib/push";
import { sendRuleDigestEmail } from "@/lib/rules/mail";
import type { $Enums } from "@prisma/client";

type Channels = { email?: boolean; inApp?: boolean; push?: boolean };

type ProductWithData = {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  saleItems: { quantity: number; sale?: { saleDate?: Date } }[];
};

function daysAgo(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

const FREQUENCY_MS: Record<string, number> = {
  DAILY: 24 * 60 * 60 * 1000,
  EVERY_3_DAYS: 3 * 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Evalúa las reglas de alerta de un workspace. Crea alertas in-app para
 * reglas STOCK_STATE y EVENT cuando aplican, y dispara DIGEST por email
 * según la frecuencia. Devuelve un resumen de lo hecho.
 */
export async function runRulesForWorkspace(workspaceId: string) {
  const prisma = getPrisma();
  const rules = await prisma.alertRule.findMany({
    where: { workspaceId, enabled: true },
    orderBy: { createdAt: "desc" },
  });

  const summary = { stock: 0, events: 0, digests: 0 };

  for (const rule of rules) {
    const channels = (rule.channels ?? {}) as Channels;
    const ruleType = rule.type;

    // ---- DIGEST: resumen periódico por email ----
    if (ruleType === "DIGEST") {
      const frequency = (rule.config as { frequency?: string })?.frequency;
      const interval = frequency ? FREQUENCY_MS[frequency] : FREQUENCY_MS.DAILY;
      if (!interval) continue;
      const since = rule.lastTriggeredAt ?? new Date(0);
      if (Date.now() - since.getTime() < interval) continue;

      try {
        const sinceDate = rule.lastTriggeredAt ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const alerts = await prisma.alert.findMany({
          where: {
            workspaceId,
            createdAt: { gte: sinceDate },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        const group = (type: string) =>
          alerts
            .filter((a) => a.type === type)
            .slice(0, 15)
            .map((a) => ({ productName: a.title ?? "", message: a.message }));

        const critical = group("CRITICAL_STOCK");
        const low = group("LOW_STOCK");
        const other = alerts
          .filter((a) => !["CRITICAL_STOCK", "LOW_STOCK"].includes(a.type))
          .slice(0, 15)
          .map((a) => ({ title: a.title ?? "", message: a.message, type: a.type }));

        if (alerts.length > 0) {
          await sendWorkspaceDigest(workspaceId, { critical, low }, other);
          summary.digests++;
        }
        await prisma.alertRule.update({
          where: { id: rule.id },
          data: { lastTriggeredAt: new Date() },
        });
      } catch {
        // errores de email no rompen la corrida
      }
      continue;
    }

    // ---- STOCK_STATE: escuchar estados de stock que eligió el usuario ----
    if (ruleType === "STOCK_STATE") {
      const states = (rule.config as { states?: string[] })?.states ?? [];
      if (states.length === 0) continue;
      try {
        const count = await evaluateStockRule(workspaceId, states, channels, rule.id);
        summary.stock += count;
      } catch {
        // continuar
      }
      continue;
    }

    // ---- EVENT: escuchar eventos del feed elegidos por el usuario ----
    if (ruleType === "EVENT") {
      const events = (rule.config as { events?: string[] })?.events ?? [];
      if (events.length === 0) continue;
      try {
        const count = await evaluateEventRule(workspaceId, events, channels, rule.id);
        summary.events += count;
      } catch {
        // continuar
      }
      continue;
    }
  }

  return summary;
}

async function sendWorkspaceDigest(
  workspaceId: string,
  digest: { critical: { productName: string; message: string }[]; low: { productName: string; message: string }[] },
  other: { title: string; message: string; type: string }[],
) {
  const prisma = getPrisma();
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { email: true, name: true, emailVerified: true } } },
  });
  for (const member of members) {
    if (member.user.emailVerified) {
      sendRuleDigestEmail(member.user.email, member.user.name, { digest, other }).catch(() => {});
    }
  }
}

async function evaluateStockRule(
  workspaceId: string,
  states: string[],
  channels: Channels,
  ruleId: string,
): Promise<number> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: { workspaceId },
    include: {
      saleItems: {
        where: { sale: { saleDate: { gte: since } } },
        select: { quantity: true, sale: { select: { saleDate: true } } },
      },
    },
    orderBy: { currentStock: "asc" },
  });

  const productsWithData = products as unknown as ProductWithData[];
  const candidates = productsWithData
    .map((p) => {
      const sold = p.saleItems.reduce((sum, item) => sum + item.quantity, 0);
      const burnRate = sold / 30;
      const daysRemaining = burnRate > 0 ? Math.floor(p.currentStock / burnRate) : 999;
      let state: "CRITICAL_STOCK" | "LOW_STOCK" | "STAGNANT_STOCK" | null = null;
      if (daysRemaining <= 7 && burnRate > 0) state = "CRITICAL_STOCK";
      else if (p.currentStock <= p.minStock) state = "LOW_STOCK";
      const lastSale = p.saleItems.length
        ? p.saleItems.reduce((a, b) =>
            (b.sale?.saleDate?.getTime() ?? 0) > (a.sale?.saleDate?.getTime() ?? 0) ? b : a,
          )
        : null;
      const daysSinceLastSale = lastSale?.sale?.saleDate ? daysAgo(lastSale.sale.saleDate) : 999;
      if (!state && daysSinceLastSale > 30 && p.currentStock > 0) state = "STAGNANT_STOCK";
      return { product: p, state, daysRemaining, burnRate, daysSinceLastSale };
    })
    .filter((c): c is typeof c & { state: "CRITICAL_STOCK" | "LOW_STOCK" | "STAGNANT_STOCK" } =>
      c.state !== null && states.includes(c.state),
    );

  if (candidates.length === 0) return 0;

  // De-dupe: no repetir alertas del mismo producto+estado en las últimas 24h
  const existing = await prisma.alert.findMany({
    where: {
      workspaceId,
      isResolved: false,
      createdAt: { gte: since },
    },
    select: { productId: true, type: true },
  });
  const existingSet = new Set(existing.map((a) => `${a.productId ?? ""}:${a.type}`));

  let created = 0;
  for (const match of candidates) {
    const key = `${match.product.id}:${match.state}`;
    if (existingSet.has(key)) continue;

    const message =
      match.state === "CRITICAL_STOCK"
        ? `${match.product.name} se agotará en ${match.daysRemaining} días.`
        : match.state === "LOW_STOCK"
          ? `${match.product.name} tiene ${match.product.currentStock} unidades (mínimo: ${match.product.minStock}).`
          : `${match.product.name} sin ventas hace ${match.daysSinceLastSale} días. ${match.product.currentStock} unidades en stock.`;
    const title =
      match.state === "CRITICAL_STOCK"
        ? "Stock crítico"
        : match.state === "LOW_STOCK"
          ? "Stock bajo"
          : "Stock estancado";

    if (channels.inApp) {
      await prisma.alert.create({
        data: {
          workspaceId,
          productId: match.product.id,
          type: match.state,
          title,
          message,
          metadata: {
            burnRate: Number(match.burnRate.toFixed(2)),
            daysRemaining: match.daysRemaining,
            currentStock: match.product.currentStock,
            minStock: match.product.minStock,
          },
        },
      });
    }
    existingSet.add(key);
    created++;
  }

  if (created > 0) {
    if (channels.push) {
      sendPushToWorkspace(workspaceId, {
        title: `📦 ${created} producto${created > 1 ? "s" : ""} en alerta de stock`,
        body: candidates.slice(0, 3).map((c) => c.product.name).join(", ") + (created > 3 ? ` y ${created - 3} más` : ""),
        url: "/dashboard/alerts",
        tag: `rule-stock-${ruleId}`,
      }).catch(() => {});
    }
  }

  await prisma.alertRule.update({
    where: { id: ruleId },
    data: { lastTriggeredAt: new Date() },
  });

  return created;
}

async function evaluateEventRule(
  workspaceId: string,
  events: string[],
  channels: Channels,
  ruleId: string,
): Promise<number> {
  const prisma = getPrisma();
  const since = ruleId
    ? await prisma.alertRule
        .findUnique({ where: { id: ruleId }, select: { lastTriggeredAt: true } })
        .then((r) => r?.lastTriggeredAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000))
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const alerts = await prisma.alert.findMany({
    where: {
      workspaceId,
      type: { in: events as $Enums.AlertType[] },
      isResolved: false,
      createdAt: { gte: since },
    },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (alerts.length === 0) {
    await prisma.alertRule.update({
      where: { id: ruleId },
      data: { lastTriggeredAt: new Date() },
    });
    return 0;
  }

  const seen = new Set<string>();
  const unique = alerts.filter((a) => {
    const key = `${a.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const group: Record<string, typeof unique> = {};
  for (const a of unique) {
    (group[a.type] ??= []).push(a);
  }

  const lines: { title: string; message: string }[] = [];
  for (const [type, items] of Object.entries(group)) {
    const head = items[0];
    const title = head?.title ?? type;
    lines.push({
      title,
      message: items.slice(0, 5).map((a) => a.message).join(" • "),
    });
  }

  if (channels.inApp) {
    // Los eventos ya existen como alertas en el feed; no se duplican acá.
    // Solo se usan para notificar por push/email en este ciclo.
  }

  if (lines.length > 0) {
    if (channels.push) {
      sendPushToWorkspace(workspaceId, {
        title: `🔔 ${lines.length} evento${lines.length > 1 ? "s" : ""} de seguimiento`,
        body: lines.slice(0, 2).map((l) => l.title).join(" • "),
        url: "/dashboard/alerts",
        tag: `rule-event-${ruleId}`,
      }).catch(() => {});
    }
    if (channels.email) {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: { select: { email: true, name: true, emailVerified: true } } },
      });
      for (const member of members) {
        if (member.user.emailVerified) {
          sendRuleDigestEmail(member.user.email, member.user.name, {
            digest: { critical: [], low: [] },
            other: lines.map((l, i) => ({ title: l.title, message: l.message, type: `EVENT_${i}` })),
          }).catch(() => {});
        }
      }
    }
  }

  await prisma.alertRule.update({
    where: { id: ruleId },
    data: { lastTriggeredAt: new Date() },
  });

  return unique.length;
}