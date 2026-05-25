"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, TrendingUp, Clock, RefreshCw, CheckCircle2, Eye } from "lucide-react";

type Alert = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const typeConfig: Record<string, { label: string; tone: "danger" | "warning" | "muted"; icon: typeof AlertTriangle }> = {
  CRITICAL_STOCK: { label: "Critico", tone: "danger", icon: AlertTriangle },
  LOW_STOCK: { label: "Stock bajo", tone: "warning", icon: Clock },
  STAGNANT_STOCK: { label: "Estancado", tone: "muted", icon: TrendingDown },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch("/api/dashboard/alerts", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        let msg = data.message;
        if (data.generatedOrders > 0 && data.orders) {
          msg = `${data.generatedOrders} orden${data.generatedOrders > 1 ? "es" : ""} de compra generada${data.generatedOrders > 1 ? "s" : ""} para: ${data.orders.join(", ")}`;
        }
        setGenerateResult(msg);
        fetchAlerts();
        setTimeout(() => setGenerateResult(null), 6000);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (alertId: string, action: "read" | "resolve") => {
    try {
      const res = await fetch("/api/dashboard/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action }),
      });
      if (res.ok) fetchAlerts();
    } catch {
      // silently fail
    }
  };

  const activeAlerts = alerts.filter((a) => !a.isResolved);
  const resolvedAlerts = alerts.filter((a) => a.isResolved);
  const unreadCount = alerts.filter((a) => !a.isRead && !a.isResolved).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alertas automaticas generadas por el motor de reabastecimiento.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generando..." : "Generar alertas"}
        </Button>
      </div>

      {generateResult && (
        <div className="rounded-xl border border-success/20 bg-success-light/50 p-4 flex items-center gap-3 animate-slide-down">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm font-medium text-success">{generateResult}</p>
        </div>
      )}

      {unreadCount > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger-light/50 p-4 flex items-center gap-3 animate-slide-down">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-danger">{unreadCount} alerta{unreadCount > 1 ? "s" : ""} sin leer</p>
            <p className="text-xs text-danger/80">Revisar y tomar accion antes de que empeoren.</p>
          </div>
        </div>
      )}

      <Card className="card-hover border-danger/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white">
              <AlertTriangle className="h-4 w-4" />
            </div>
            Alertas activas
          </CardTitle>
          <CardDescription>Productos que necesitan atencion inmediata.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando alertas...</p>
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light">
                <TrendingUp className="h-7 w-7 text-success" />
              </div>
              <p className="text-sm font-semibold">Sin alertas activas</p>
              <p className="text-xs text-muted-foreground mt-1">Todo en orden. Generar alertas para verificar el estado actual.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const config = typeConfig[alert.type] ?? { label: alert.type, tone: "muted" as const, icon: AlertTriangle };
                const Icon = config.icon;
                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      !alert.isRead
                        ? config.tone === "danger"
                          ? "border-danger/30 bg-danger-light/40"
                          : config.tone === "warning"
                            ? "border-warning/30 bg-warning-light/40"
                            : "border-border bg-muted/30"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          config.tone === "danger" ? "bg-danger text-white" : config.tone === "warning" ? "bg-warning text-white" : "bg-muted"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{alert.productName}</p>
                            <Badge tone={config.tone}>{config.label}</Badge>
                            {!alert.isRead && <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          {alert.metadata && (
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              {alert.metadata.burnRate !== undefined && <span>Burn rate: {String(alert.metadata.burnRate)}/dia</span>}
                              {alert.metadata.daysRemaining !== undefined && <span>Dias restantes: {String(alert.metadata.daysRemaining)}</span>}
                              {alert.metadata.daysSinceLastSale !== undefined && <span>Sin ventas: {String(alert.metadata.daysSinceLastSale)} dias</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!alert.isRead && (
                          <button onClick={() => handleAction(alert.id, "read")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Marcar como leida">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleAction(alert.id, "resolve")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-success-light hover:text-success" title="Resolver">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {resolvedAlerts.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              Resueltas
            </CardTitle>
            <CardDescription>Alertas que ya fueron atendidas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border p-3 opacity-60">
                  <div>
                    <p className="text-sm font-medium line-through">{alert.productName}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge tone="success">Resuelta</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
