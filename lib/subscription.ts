import { getPrisma } from "@/lib/prisma";

// ===========================================================================
// Sublayer de suscripciones. Preparada pero SIN bloquear: el enforcement real
// se activa cuando exista un proveedor de pagos (BILLING_ENABLED=true).
// ===========================================================================

export const TRIAL_DAYS = 30;

export type PlanTierValue = "BASIC" | "PRO" | "UNLIMITED";
export type PlanStatusValue = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export type PlanRecord = {
  id: string;
  tier: PlanTierValue;
  name: string;
  description: string | null;
  priceUsd: number | null;
  limits: unknown;
  features: unknown;
  isActive: boolean;
  sortOrder: number;
};

export type SubscriptionRecord = {
  id: string;
  workspaceId: string;
  planId: string;
  status: PlanStatusValue;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  provider: string | null;
  providerSubscriptionId: string | null;
  billingEmail: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan: PlanRecord;
};

export type PlanLimits = {
  maxProducts: number; // Infinity = sin límite
  maxUsers: number; // Infinity = sin límite
  aiEnabled: boolean;
  pushEnabled: boolean;
  exportEnabled: boolean;
  suppliersEnabled: boolean;
  finanzasEnabled: boolean;
  multiWorkspace: boolean;
};

const PLAN_LIMITS_DEFAULTS: PlanLimits = {
  maxProducts: Infinity,
  maxUsers: Infinity,
  aiEnabled: false,
  pushEnabled: false,
  exportEnabled: true,
  suppliersEnabled: true,
  finanzasEnabled: true,
  multiWorkspace: false,
};

function numLimit(value: unknown, fallback: number): number {
  if (typeof value === "number") return value;
  if (value === null) return Infinity;
  return fallback;
}

function boolLimit(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseLimits(limits: unknown): PlanLimits {
  const raw = (limits ?? {}) as Record<string, unknown>;

  return {
    maxProducts: numLimit(raw.maxProducts, PLAN_LIMITS_DEFAULTS.maxProducts),
    maxUsers: numLimit(raw.maxUsers, PLAN_LIMITS_DEFAULTS.maxUsers),
    aiEnabled: boolLimit(raw.aiEnabled, PLAN_LIMITS_DEFAULTS.aiEnabled),
    pushEnabled: boolLimit(raw.pushEnabled, PLAN_LIMITS_DEFAULTS.pushEnabled),
    exportEnabled: boolLimit(raw.exportEnabled, PLAN_LIMITS_DEFAULTS.exportEnabled),
    suppliersEnabled: boolLimit(raw.suppliersEnabled, PLAN_LIMITS_DEFAULTS.suppliersEnabled),
    finanzasEnabled: boolLimit(raw.finanzasEnabled, PLAN_LIMITS_DEFAULTS.finanzasEnabled),
    multiWorkspace: boolLimit(raw.multiWorkspace, PLAN_LIMITS_DEFAULTS.multiWorkspace),
  };
}

export function isBillingEnabled() {
  return process.env.BILLING_ENABLED === "true";
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function daysLeft(from: Date, until: Date | null) {
  if (!until) return null;
  const delta = until.getTime() - from.getTime();
  return Math.max(0, Math.ceil(delta / (24 * 60 * 60 * 1000)));
}

// --------------------------------------------------------------------------
// DB helpers
// --------------------------------------------------------------------------

// Devuelve la suscripción de un workspace. Si todavía no existe (workspaces
// creados antes de billing), la crea de forma idempotente con 1 mes de trial.
export async function getOrCreateSubscription(workspaceId: string): Promise<SubscriptionRecord | null> {
  const prisma = getPrisma();

  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  if (existing) {
    return existing as unknown as SubscriptionRecord;
  }

  const defaultPlan = await prisma.plan.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" as const },
  });

  if (!defaultPlan) {
    return null;
  }

  const now = new Date();
  const trialEndsAt = addDays(now, TRIAL_DAYS);

  const created = await prisma.subscription.create({
    data: {
      workspaceId,
      planId: defaultPlan.id,
      status: "TRIAL",
      trialStartedAt: now,
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
    },
    include: { plan: true },
  });

  return created as unknown as SubscriptionRecord;
}

// Garantiza trial para el primer workspace OWNER del usuario (al registrarse).
export async function ensureWorkspaceTrial(userId: string): Promise<SubscriptionRecord | null> {
  const prisma = getPrisma();

  const owned = await prisma.workspaceMember.findFirst({
    where: { userId, role: "OWNER" as const },
    orderBy: { createdAt: "asc" as const },
  });

  if (!owned) {
    return null;
  }

  return getOrCreateSubscription(owned.workspaceId);
}

// --------------------------------------------------------------------------
// Cálculo de acceso (el enforcement propiamente dicho)
// --------------------------------------------------------------------------

export type SubscriptionAccessState = {
  allowed: boolean;
  enforcementEnabled: boolean;
  isSuperAdmin: boolean;
  plan: {
    tier: PlanTierValue | "NONE";
    name: string;
    priceUsd: number | null;
  };
  status: PlanStatusValue | "NONE" | "SUPER_ADMIN";
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  currentPeriodEnd: string | null;
  limits: PlanLimits;
  reason:
    | "none"
    | "no-subscription"
    | "trial-ended"
    | "expired"
    | "past-due"
    | "canceled";
};

const UNLIMITED_STATE: PlanLimits = {
  maxProducts: Infinity,
  maxUsers: Infinity,
  aiEnabled: true,
  pushEnabled: true,
  exportEnabled: true,
  suppliersEnabled: true,
  finanzasEnabled: true,
  multiWorkspace: true,
};

function deriveBaseState(subscription: SubscriptionRecord | null, isSuperAdmin: boolean, enforcementEnabled: boolean): Omit<SubscriptionAccessState, "allowed" | "reason"> {
  if (isSuperAdmin) {
    return {
      enforcementEnabled,
      isSuperAdmin: true,
      plan: { tier: "UNLIMITED", name: "Administrador", priceUsd: null },
      status: "SUPER_ADMIN",
      trialEndsAt: null,
      trialDaysLeft: null,
      currentPeriodEnd: null,
      limits: UNLIMITED_STATE,
    };
  }

  if (!subscription) {
    return {
      enforcementEnabled,
      isSuperAdmin: false,
      plan: { tier: "NONE", name: "Sin plan", priceUsd: null },
      status: "NONE",
      trialEndsAt: null,
      trialDaysLeft: null,
      currentPeriodEnd: null,
      limits: PLAN_LIMITS_DEFAULTS,
    };
  }

  const now = new Date();

  return {
    enforcementEnabled,
    isSuperAdmin: false,
    plan: {
      tier: subscription.plan.tier,
      name: subscription.plan.name,
      priceUsd: subscription.plan.priceUsd === null ? null : Number(subscription.plan.priceUsd),
    },
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft: daysLeft(now, subscription.trialEndsAt),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    limits: parseLimits(subscription.plan.limits),
  };
}

export function computeAccessState(params: {
  isSuperAdmin: boolean;
  subscription: SubscriptionRecord | null;
  now?: Date;
}): SubscriptionAccessState {
  const { isSuperAdmin, subscription } = params;
  const now = params.now ?? new Date();
  const enforcementEnabled = isBillingEnabled();

  const base = deriveBaseState(subscription, isSuperAdmin, enforcementEnabled);

  if (isSuperAdmin) {
    return { ...base, allowed: true, reason: "none" };
  }

  if (!enforcementEnabled) {
    // Billing no activo todavía → nunca bloqueamos.
    return { ...base, allowed: true, reason: "none" };
  }

  if (!subscription) {
    return { ...base, allowed: false, reason: "no-subscription" };
  }

  switch (subscription.status) {
    case "TRIAL": {
      const valid = subscription.trialEndsAt !== null && subscription.trialEndsAt > now;
      return { ...base, allowed: valid, reason: valid ? "none" : "trial-ended" };
    }
    case "ACTIVE": {
      const valid = subscription.currentPeriodEnd === null || subscription.currentPeriodEnd > now;
      return { ...base, allowed: valid, reason: valid ? "none" : "expired" };
    }
    case "CANCELED": {
      // Permite acceso hasta el final del período ya pago.
      const valid = subscription.currentPeriodEnd !== null && subscription.currentPeriodEnd > now;
      return { ...base, allowed: valid, reason: valid ? "canceled" : "expired" };
    }
    case "PAST_DUE": {
      return { ...base, allowed: false, reason: "past-due" };
    }
    case "EXPIRED": {
      return { ...base, allowed: false, reason: "expired" };
    }
    default: {
      return { ...base, allowed: false, reason: "expired" };
    }
  }
}

// Conveniencia: estado de acceso de un workspace sin inyectar super admin.
export async function getWorkspaceAccessState(workspaceId: string) {
  const subscription = await getOrCreateSubscription(workspaceId);
  return computeAccessState({ isSuperAdmin: false, subscription });
}

// --------------------------------------------------------------------------
// Enforcement de escritura para las API routes.
// Con billing activo: una cuenta vencida/cancelada no puede escribir,
// pero sí leer y exportar (allowed=false → read-only; allowed=true → full).
// --------------------------------------------------------------------------
export const READ_ONLY_ERROR =
  "Acceso de solo lectura: podés ver tu información y exportar tus datos, pero no crear ni editar nada.";

export async function assertCanWrite(user: {
  workspaceId: string | null;
  globalRole: string;
}): Promise<boolean> {
  if (!isBillingEnabled()) {
    return true;
  }

  if (user.globalRole === "SUPER_ADMIN" || !user.workspaceId) {
    return true;
  }

  const state = await getWorkspaceAccessState(user.workspaceId);
  return state.allowed;
}