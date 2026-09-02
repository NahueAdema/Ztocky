"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleToggle } from "@/components/ui/simple-toggle";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Play, BellRing, Mail, Bell, Smartphone } from "lucide-react";

type Rule = {
  id: string;
  name: string;
  type: "STOCK_STATE" | "EVENT" | "DIGEST";
  config: {
    states?: string[];
    events?: string[];
    frequency?: string;
  };
  channels: { email?: boolean; inApp?: boolean; push?: boolean };
  enabled: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

const STATE_LABELS: Record<string, string> = {
  CRITICAL_STOCK: "Crítico",
  LOW_STOCK: "Stock bajo",
  STAGNANT_STOCK: "Estancado",
};

const EVENT_LABELS: Record<string, string> = {
  ORDER_STATUS: "Órdenes de compra",
  REGISTER_DISCREPANCY: "Discrepancia de caja",
  PAYMENT_RECEIVED: "Pagos de clientes",
  PRICE_CHANGE: "Cambio de precios",
  SUPPLIER_RISK: "Riesgo proveedor",
  LOW_BALANCE: "Saldo bajo de clientes",
};

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Diario",
  EVERY_3_DAYS: "Cada 3 días",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
};

const TYPE_LABELS: Record<string, string> = {
  STOCK_STATE: "Umbral de stock",
  EVENT: "Seguir eventos",
  DIGEST: "Resumen periódico",
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  inApp: Bell,
  push: Smartphone,
};

export function RulesManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
      } else {
        setError("No se pudieron cargar las reglas.");
      }
    } catch {
      setError("Error de red al cargar reglas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRun = async () => {
    setRunning(true);
    setRunMessage(null);
    try {
      const res = await fetch("/api/dashboard/rules/check");
      if (res.ok) {
        const d = await res.json();
        setRunMessage(`OK: ${d.stock} stock, ${d.events} eventos, ${d.digests} resúmenes.`);
        load();
      } else {
        setRunMessage("No se pudieron ejecutar las reglas.");
      }
    } catch {
      setRunMessage("Error al ejecutar las reglas.");
    } finally {
      setRunning(false);
    }
  };

  const handleToggle = async (rule: Rule) => {
    await fetch("/api/dashboard/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta regla?")) return;
    await fetch("/api/dashboard/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <Card className="card-hover border-border/60">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BellRing className="h-4 w-4 text-primary" />
              Mis reglas
            </h2>
            <p className="text-sm text-muted-foreground">
              Ztocky te avisa lo que vos quieras, cuando lo quieras.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-9 px-3" onClick={handleRun} disabled={running}>
              <Play className={cn("h-4 w-4", running && "animate-spin")} />
              {running ? "Ejecutando..." : "Ejecutar ahora"}
            </Button>
            <Button className="h-9 px-3" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Nueva regla
            </Button>
          </div>
        </div>

        {runMessage && (
          <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{runMessage}</p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-danger-light/50 px-3 py-2 text-xs text-danger">{error}</p>
        )}

        {loading ? (
          <div className="mt-4 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium">Todavía no creaste ninguna regla</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Configurá qué alertas querés recibir y por dónde.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                onToggle={() => handleToggle(rule)}
                onDelete={() => handleDelete(rule.id)}
                onEdit={() => setCreating(true)}
              />
            ))}
          </div>
        )}

        {creating && (
          <RuleForm
            onClose={() => setCreating(false)}
            onSaved={() => { setCreating(false); load(); }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function RuleRow({
  rule,
  onToggle,
  onDelete,
  onEdit,
}: {
  rule: Rule;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const summary =
    rule.type === "STOCK_STATE"
      ? (rule.config.states ?? []).map((s) => STATE_LABELS[s] ?? s).join(", ")
      : rule.type === "EVENT"
        ? (rule.config.events ?? []).slice(0, 3).map((e) => EVENT_LABELS[e] ?? e).join(", ")
        : FREQ_LABELS[rule.config.frequency ?? ""] ?? rule.config.frequency;

  const activeChannels = Object.keys(rule.channels).filter((c) => rule.channels[c as keyof typeof rule.channels]);

  return (
    <div className={cn("rounded-xl border p-4 transition-colors", rule.enabled ? "border-border" : "border-border/40 opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{rule.name}</p>
            <Badge tone={rule.type === "DIGEST" ? "accent" : rule.type === "EVENT" ? "muted" : "warning"}>
              {TYPE_LABELS[rule.type]}
            </Badge>
            {!rule.enabled && <Badge tone="muted">En pausa</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{summary}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {activeChannels.map((c) => {
                const Icon = CHANNEL_ICONS[c] ?? Bell;
                return <Icon key={c} className="h-3.5 w-3.5" />;
              })}
              {activeChannels.length === 0 && "Sin canales"}
            </span>
            {rule.lastTriggeredAt && (
              <span className="text-[11px] text-muted-foreground/70">Últ. ejec: {new Date(rule.lastTriggeredAt).toLocaleDateString("es-AR")}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <SimpleToggle checked={rule.enabled} onChange={onToggle} />
          <button onClick={onEdit} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger" title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"STOCK_STATE" | "EVENT" | "DIGEST">("STOCK_STATE");
  const [name, setName] = useState("");
  const [states, setStates] = useState<string[]>(["CRITICAL_STOCK", "LOW_STOCK"]);
  const [events, setEvents] = useState<string[]>(["ORDER_STATUS"]);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [channels, setChannels] = useState<{ email: boolean; inApp: boolean; push: boolean }>({
    email: false,
    inApp: true,
    push: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleInList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const handleSave = async () => {
    setFormError(null);
    if (!name.trim()) { setFormError("Poné un nombre a la regla."); return; }

    let config: object;
    if (type === "STOCK_STATE") {
      if (states.length === 0) { setFormError("Elegí al menos un estado de stock."); return; }
      config = { states };
    } else if (type === "EVENT") {
      if (events.length === 0) { setFormError("Elegí al menos un evento."); return; }
      config = { events };
    } else {
      config = { frequency };
    }

    const payload = { name, type, config, channels };
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) onSaved();
      else {
        const d = await res.json();
        setFormError(d.error || "No se pudo crear la regla.");
      }
    } catch {
      setFormError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const channelBtn = (key: keyof typeof channels, label: string) => (
    <button
      type="button"
      onClick={() => setChannels((prev) => ({ ...prev, [key]: !prev[key] }))}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
        channels[key] ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {channels[key] && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-slide-down max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Nueva regla</h3>
        <p className="text-sm text-muted-foreground">Decidí qué querés que Ztocky vigile y cómo avisarte.</p>

        <label className="mt-4 block text-sm font-medium">Tipo de regla</label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_LABELS) as ("STOCK_STATE" | "EVENT" | "DIGEST")[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-medium transition",
                type === t ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Avisarme stock crítico"
          className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-card/50 px-3 text-sm outline-none focus:border-primary/40"
        />

        {type === "STOCK_STATE" && (
          <div>
            <label className="mt-4 block text-sm font-medium">Estados a vigilar</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.keys(STATE_LABELS).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStates((prev) => toggleInList(prev, s))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    states.includes(s) ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {STATE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "EVENT" && (
          <div>
            <label className="mt-4 block text-sm font-medium">Eventos a seguir</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(EVENT_LABELS).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setEvents((prev) => toggleInList(prev, k))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    events.includes(k) ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "DIGEST" && (
          <div>
            <label className="mt-4 block text-sm font-medium">Frecuencia del resumen</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(FREQ_LABELS).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFrequency(k)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    frequency === k ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mt-4 block text-sm font-medium">Cómo avisarte</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {channelBtn("inApp", "In-app")}
          {channelBtn("email", "Email")}
          {channelBtn("push", "Push")}
        </div>

        {formError && <p className="mt-3 text-xs text-danger">{formError}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" className="h-9 px-4" onClick={onClose}>Cancelar</Button>
          <Button className="h-9 px-4" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar regla"}
          </Button>
        </div>
      </div>
    </div>
  );
}