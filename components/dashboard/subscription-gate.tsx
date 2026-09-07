"use client";

import { useEffect, useState } from "react";
import { Ban, Download, Lock } from "lucide-react";

type AccessState = {
  allowed: boolean;
  enforcementEnabled: boolean;
  isSuperAdmin: boolean;
  status: string;
  reason: string;
  plan: { name: string };
};

export function SubscriptionGate() {
  const [state, setState] = useState<AccessState | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchState = async () => {
      try {
        const res = await fetch("/api/dashboard/subscription");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setState(data);
            setChecking(false);
          }
        }
      } catch {
        if (mounted) setChecking(false);
      }
    };
    fetchState();
    return () => {
      mounted = false;
    };
  }, []);

  // Sin enforcement o sin datos → no mostramos nada.
  if (!state || !state.enforcementEnabled || state.allowed || state.isSuperAdmin) {
    return null;
  }

  const reasonLabel =
    state.reason === "trial-ended"
      ? "Tu prueba gratuita terminó."
      : state.reason === "expired"
        ? "Tu suscripción está vencida."
        : state.reason === "past-due"
          ? "Hay un pago pendiente en tu suscripción."
          : "Tu suscripción no está activa.";

  return (
    <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-center gap-2 font-semibold text-warning">
        <Lock className="h-4 w-4" />
        {reasonLabel}
      </div>
      <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center">
        <p className="flex items-center gap-2">
          <Ban className="h-4 w-4 shrink-0 text-danger" />
          Acceso de solo lectura: podés ver tu información y exportar tus datos, pero no crear ni editar nada.
        </p>
        <p className="flex items-center gap-2">
          <Download className="h-4 w-4 shrink-0 text-primary" />
          Tus datos son siempre tuyos y podés exportarlos.
        </p>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        Elegí un plan para volver a usar ztocky con todas sus funciones.
        {checking && " Cargando..."}
      </p>
    </div>
  );
}