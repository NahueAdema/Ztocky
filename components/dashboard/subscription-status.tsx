"use client";

import { useEffect, useState } from "react";
import { CreditCard, Gem } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AccessState = {
  allowed: boolean;
  enforcementEnabled: boolean;
  isSuperAdmin: boolean;
  plan: { tier: string; name: string; priceUsd: number | null };
  status: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  currentPeriodEnd: string | null;
};

const statusTone: Record<string, "success" | "accent" | "warning" | "danger" | "muted"> = {
  SUPER_ADMIN: "danger",
  TRIAL: "accent",
  ACTIVE: "success",
  PAST_DUE: "danger",
  CANCELED: "muted",
  EXPIRED: "danger",
};

export function SubscriptionStatus() {
  const [state, setState] = useState<AccessState | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/dashboard/subscription");
        if (res.ok) {
          setState(await res.json());
        }
      } catch {
        // silently fail
      }
    };
    fetchState();
  }, []);

  if (!state) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <CreditCard className="h-4 w-4" />
            </div>
            Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando estado de tu suscripción...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <CreditCard className="h-4 w-4" />
          </div>
          Suscripción
        </CardTitle>
        <CardDescription>Tu plan y estado de pago del comercio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.isSuperAdmin ? (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Gem className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Acceso de administrador</p>
                <p className="text-xs text-muted-foreground">
                  Tu cuenta es súper admin: no necesitás suscripción.
                </p>
              </div>
            </div>
            <Badge tone="danger">SUPER ADMIN</Badge>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Plan {state.plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {state.plan.priceUsd ? `US$${state.plan.priceUsd}/mes` : "—"}
                </p>
              </div>
              <Badge tone={statusTone[state.status] ?? "muted"}>{state.status}</Badge>
            </div>

            {state.trialDaysLeft !== null && state.status === "TRIAL" ? (
              <div className="flex items-center justify-between rounded-lg bg-accent-soft p-3">
                <div>
                  <p className="text-sm font-medium">Prueba gratuita</p>
                  <p className="text-xs text-muted-foreground">
                    {state.trialDaysLeft === 0
                      ? "Se termina hoy"
                      : `Te quedan ${state.trialDaysLeft} día${state.trialDaysLeft === 1 ? "" : "s"} de prueba`}
                  </p>
                </div>
                <Badge tone="accent">Trial</Badge>
              </div>
            ) : null}

            {state.trialEndsAt && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-xs text-muted-foreground">Fin de la prueba</span>
                <span className="text-xs font-medium">
                  {new Date(state.trialEndsAt).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}

            {!state.enforcementEnabled && (
              <p className="text-xs text-muted-foreground">
                La facturación se activará próximamente. Mientras tanto, tenés acceso completo.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}