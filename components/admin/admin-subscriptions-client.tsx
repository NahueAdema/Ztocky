"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Check, Loader2, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminSubscription } from "@/lib/data/admin";

type PlanOption = { id: string; tier: string; name: string; priceUsd: number };

type ActionsModalProps = {
  sub: AdminSubscription;
  plans: PlanOption[];
  onClose: () => void;
  onChanged: (message: string) => void;
};

function statusBadge(status: string) {
  switch (status) {
    case "TRIAL":
      return <Badge tone="accent">Trial</Badge>;
    case "ACTIVE":
      return <Badge tone="success">Activa</Badge>;
    case "PAST_DUE":
      return <Badge tone="danger">Pago vencido</Badge>;
    case "CANCELED":
      return <Badge tone="muted">Cancelada</Badge>;
    case "EXPIRED":
      return <Badge tone="danger">Vencida</Badge>;
    default:
      return <Badge tone="muted">{status}</Badge>;
  }
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toISOString().slice(0, 10);
}

function ActionsModal({ sub, plans, onClose, onChanged }: ActionsModalProps) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [days, setDays] = useState(15);
  const [planId, setPlanId] = useState(sub.planId);

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        onChanged(data.message || "Suscripción actualizada");
        onClose();
      } else {
        setMsg({ ok: false, text: data.error || "Error" });
      }
    } catch {
      setMsg({ ok: false, text: "Error de conexión" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gestionar suscripción</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {sub.workspace.name} · {sub.plan.name} · {statusBadge(sub.status)}
        </p>

        <div className="mt-4 space-y-4">
          {/* Cambiar plan */}
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Cambiar plan</p>
            <div className="mt-2 flex gap-2">
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — US${p.priceUsd}/mes
                  </option>
                ))}
              </select>
              <button
                onClick={() => run("changePlan", { planId })}
                disabled={busy}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </button>
            </div>
          </div>

          {/* Extender trial */}
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Extender prueba</p>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={days}
                min={1}
                max={365}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <span className="self-center text-sm text-muted-foreground">días</span>
              <button
                onClick={() => run("extendTrial", { days })}
                disabled={busy}
                className="ml-auto h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extender"}
              </button>
            </div>
          </div>

          {/* Manual */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => run("reactivate")}
              disabled={busy}
              className="h-10 flex-1 rounded-lg bg-success px-3 text-sm font-medium text-white hover:bg-success/90"
            >
              Reactivar (pago manual)
            </button>
            <button
              onClick={() => run("cancel")}
              disabled={busy}
              className="h-10 flex-1 rounded-lg bg-danger px-3 text-sm font-medium text-white hover:bg-danger/90"
            >
              Cancelar
            </button>
          </div>

          {/* Estado manual */}
          <div className="flex flex-wrap gap-2">
            {["PAST_DUE", "EXPIRED", "CANCELED", "ACTIVE", "TRIAL"].map((s) => (
              <button
                key={s}
                onClick={() => run("setStatus", { status: s })}
                disabled={busy}
                className="h-8 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
              >
                {s === "ACTIVE" ? "Marcar activa" : s === "PAST_DUE" ? "Marcar vencida pago" : `Estado ${s}`}
              </button>
            ))}
          </div>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminSubscriptionsClient({
  subscriptions,
  plans,
  total,
  page,
  totalPages,
  q,
}: {
  subscriptions: AdminSubscription[];
  plans: PlanOption[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<AdminSubscription | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`/admin/subscriptions?${params.toString()}`);
    },
    [router, searchParams],
  );

  const updateSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      router.push(`/admin/subscriptions?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Suscripciones</h1>
          <p className="text-sm text-muted-foreground">
            Planes y estado de facturación por workspace. {total} suscripción{total !== 1 ? "es" : ""}.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateSearch(String(fd.get("q") || ""));
          }}
          className="flex gap-2"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar workspace..."
            className="h-10 w-64 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-light/50 p-3 text-sm text-success">
          <Check className="h-4 w-4" />
          {notice}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No hay suscripciones todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-medium">Workspace</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium">Fin de trial</th>
                    <th className="py-3 px-4 font-medium">Fin de período</th>
                    <th className="py-3 px-4 font-medium">Miembros</th>
                    <th className="py-3 px-4 font-medium">Actualizada</th>
                    <th className="py-3 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/workspaces/${sub.workspace.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {sub.workspace.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{sub.workspace.slug}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{sub.plan.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {sub.plan.priceUsd ? `US$${Number(sub.plan.priceUsd)}/mes` : "—"}
                        </p>
                      </td>
                      <td className="py-3 px-4">{statusBadge(sub.status)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDate(sub.trialEndsAt)}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDate(sub.currentPeriodEnd)}
                      </td>
                      <td className="py-3 px-4">{sub.workspace._count.members}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDate(sub.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActive(sub)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {total} resultados — página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => goToPage(page - 1)}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              >
                Anterior
              </button>
            )}
            {page < totalPages && (
              <button
                onClick={() => goToPage(page + 1)}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      )}

      {active && (
        <ActionsModal
          sub={active}
          plans={plans}
          onClose={() => setActive(null)}
          onChanged={(m) => {
            setNotice(m);
            setTimeout(() => setNotice(null), 3000);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}