"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, TrendingDown, TrendingUp, Clock, RefreshCw, CheckCircle2, Eye,
  Search, CheckCheck, Filter, Package, Wallet, Truck,
} from "lucide-react";
import { SimpleToggle } from "@/components/ui/simple-toggle";
import { RulesManager } from "@/components/alerts/rules-manager";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  type: string;
  title: string | null;
  message: string;
  href: string | null;
  isRead: boolean;
  isResolved: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const typeConfig: Record<string, { label: string; tone: "danger" | "warning" | "muted" | "success"; icon: typeof AlertTriangle; priority: number }> = {
  CRITICAL_STOCK: { label: "Critico", tone: "danger", icon: AlertTriangle, priority: 0 },
  LOW_STOCK: { label: "Stock bajo", tone: "warning", icon: Clock, priority: 1 },
  STAGNANT_STOCK: { label: "Estancado", tone: "muted", icon: TrendingDown, priority: 2 },
  PRICE_CHANGE: { label: "Precio", tone: "muted", icon: TrendingUp, priority: 3 },
  SUPPLIER_RISK: { label: "Proveedor", tone: "warning", icon: Package, priority: 4 },
  ORDER_STATUS: { label: "Orden de compra", tone: "muted", icon: Package, priority: 5 },
  REGISTER_DISCREPANCY: { label: "Caja", tone: "danger", icon: AlertTriangle, priority: 4 },
  PAYMENT_RECEIVED: { label: "Pago", tone: "success", icon: Wallet, priority: 6 },
  LOW_BALANCE: { label: "Cliente", tone: "warning", icon: AlertTriangle, priority: 5 },
};

const TYPE_ORDER: Record<string, number> = {
  CRITICAL_STOCK: 0, LOW_STOCK: 1, STAGNANT_STOCK: 2,
  REGISTER_DISCREPANCY: 4, SUPPLIER_RISK: 4, PRICE_CHANGE: 3,
  ORDER_STATUS: 5, LOW_BALANCE: 5, PAYMENT_RECEIVED: 6,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-AR");
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const [view, setView] = useState<"active" | "resolved">("active");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState(false);

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

  const handleBulkResolve = async () => {
    setActing(true);
    try {
      const targets = filteredAlerts.filter((a) => !a.isResolved);
      await Promise.all(
        targets.map((a) =>
          fetch("/api/dashboard/alerts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alertId: a.id, action: "resolve" }),
          }),
        ),
      );
      fetchAlerts();
    } finally {
      setActing(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActing(true);
    try {
      const targets = alerts.filter((a) => !a.isRead && !a.isResolved);
      await Promise.all(
        targets.map((a) =>
          fetch("/api/dashboard/alerts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alertId: a.id, action: "read" }),
          }),
        ),
      );
      fetchAlerts();
    } finally {
      setActing(false);
    }
  };

  // Ordenar: sin resolver primero y luego por severidad y fecha.
  const sortedAlerts = useMemo(() => {
    const list = [...alerts];
    list.sort((a, b) => {
      const prioDiff = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
      if (prioDiff !== 0) return prioDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [alerts]);

  const activeAlerts = useMemo(() => sortedAlerts.filter((a) => !a.isResolved), [sortedAlerts]);
  const resolvedAlerts = useMemo(() => sortedAlerts.filter((a) => a.isResolved), [sortedAlerts]);
  const unreadCount = alerts.filter((a) => !a.isRead && !a.isResolved).length;

  const pool = useMemo(() => view === "active" ? activeAlerts : resolvedAlerts, [view, activeAlerts, resolvedAlerts]);

  const filteredAlerts = useMemo(() => {
    const q = search.toLowerCase();
    return pool.filter((a) => {
      if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
      if (q && !a.productName.toLowerCase().includes(q) && !a.productSku.toLowerCase().includes(q) && !(a.title ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pool, typeFilter, search]);

  const criticalCount = activeAlerts.filter((a) => a.type === "CRITICAL_STOCK").length;
  const lowCount = activeAlerts.filter((a) => a.type === "LOW_STOCK").length;
  const stagnantCount = activeAlerts.filter((a) => a.type === "STAGNANT_STOCK").length;
  const orderCount = activeAlerts.filter((a) => a.type === "ORDER_STATUS").length;
  const registerCount = activeAlerts.filter((a) => a.type === "REGISTER_DISCREPANCY").length;
  const paymentCount = activeAlerts.filter((a) => a.type === "PAYMENT_RECEIVED").length;

  const typeTabs = [
    { value: "ALL", label: "Todas", count: view === "active" ? activeAlerts.length : resolvedAlerts.length },
    { value: "CRITICAL_STOCK", label: "Critico", count: criticalCount },
    { value: "LOW_STOCK", label: "Stock bajo", count: lowCount },
    { value: "STAGNANT_STOCK", label: "Estancado", count: stagnantCount },
    { value: "ORDER_STATUS", label: "Órdenes", count: orderCount },
    { value: "REGISTER_DISCREPANCY", label: "Caja", count: registerCount },
    { value: "PAYMENT_RECEIVED", label: "Pagos", count: paymentCount },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <RulesManager />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title text-3xl font-bold tracking-tight">Alertas</h1>
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

      {unreadCount > 0 && view === "active" && (
        <div className="rounded-xl border border-danger/20 bg-danger-light/50 p-4 flex items-center gap-3 animate-slide-down">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-danger">{unreadCount} alerta{unreadCount > 1 ? "s" : ""} sin leer</p>
            <p className="text-xs text-danger/80">Revisar y tomar accion antes de que empeoren.</p>
          </div>
          {unreadCount > 1 && (
            <Button variant="secondary" className="h-9 px-3" onClick={handleMarkAllRead} disabled={acting}>
              <CheckCheck className="h-4 w-4 mr-1.5" /> Marcar leídas
            </Button>
          )}
        </div>
      )}

      <Card className="card-hover border-danger/20">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
              Alertas
            </CardTitle>
            <SimpleToggle
              checked={simpleMode}
              onChange={setSimpleMode}
              label={simpleMode ? "Explicación simple" : "Modo simple"}
            />
          </div>

          {/* Tabs: Activas / Resueltas */}
          <div className="flex rounded-xl border border-border bg-muted/40 p-1">
            {(["active", "resolved"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition",
                  view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "active" ? "Activas" : "Resueltas"}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {v === "active" ? activeAlerts.length : resolvedAlerts.length}
                </span>
              </button>
            ))}
          </div>

          {/* Filtros: tipo + búsqueda + acción masiva */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              {typeTabs.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition border",
                    typeFilter === t.value
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {t.label}
                  <span className="text-[10px] opacity-70">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto o SKU..."
                  className="pl-9 h-9 w-full sm:w-56"
                />
              </div>
              {view === "active" && activeAlerts.length > 0 && (
                <Button variant="secondary" className="h-9 px-3" onClick={handleBulkResolve} disabled={acting}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolver todas
                </Button>
              )}
            </div>
          </div>

          <CardDescription>Productos que necesitan atención según su estado de stock.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light">
                <TrendingUp className="h-7 w-7 text-success" />
              </div>
              <p className="text-sm font-semibold">
                {view === "active" ? "Sin alertas" : "Sin alertas resueltas"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {view === "active"
                  ? (search || typeFilter !== "ALL")
                    ? "No hay alertas que coincidan con el filtro."
                    : "Todo en orden. Generar alertas para verificar el estado actual."
                  : "Las alertas atendidas aparecerán acá."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const config = typeConfig[alert.type] ?? { label: alert.type, tone: "muted" as const, icon: AlertTriangle, priority: 9 };
                const Icon = config.icon;
                const currentStock = typeof alert.metadata?.currentStock === "number" ? alert.metadata.currentStock : null;
                const minStock = typeof alert.metadata?.minStock === "number" ? alert.metadata.minStock : null;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-xl border p-4 transition-colors",
                      alert.isRead
                        ? "border-border"
                        : config.tone === "danger"
                          ? "border-danger/30 bg-danger-light/40"
                          : config.tone === "warning"
                            ? "border-warning/30 bg-warning-light/40"
                            : "border-border bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          config.tone === "danger"
                            ? "bg-danger text-white"
                            : config.tone === "warning"
                              ? "bg-warning text-black"
                              : config.tone === "success"
                                ? "bg-success text-white"
                                : "bg-muted text-muted-foreground",
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{alert.title ?? alert.productName}</p>
                            <Badge tone={config.tone}>{config.label}</Badge>
                            {currentStock !== null && (
                              <Badge tone={currentStock <= (minStock ?? 0) ? "danger" : "muted"}>
                                Stock: {currentStock}
                              </Badge>
                            )}
                            {!alert.isRead && <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          {alert.metadata && (
                            simpleMode ? (
                              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                                {alert.metadata.burnRate !== undefined && (
                                  <p>📈 Vende unos <strong className="text-foreground">{String(alert.metadata.burnRate)} por día</strong></p>
                                )}
                                {alert.metadata.daysRemaining !== undefined && (
                                  <p>⏳ Le quedan cerca de <strong className="text-foreground">{String(alert.metadata.daysRemaining)} días de stock</strong></p>
                                )}
                                {alert.metadata.daysSinceLastSale !== undefined && Number(alert.metadata.daysSinceLastSale) > 5 && (
                                  <p>😴 Hace tiempo que no se vende este producto</p>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                {alert.metadata.burnRate !== undefined && <span>Venta: {String(alert.metadata.burnRate)}/dia</span>}
                                {alert.metadata.daysRemaining !== undefined && <span>Días restantes: {String(alert.metadata.daysRemaining)}</span>}
                                {alert.metadata.daysSinceLastSale !== undefined && <span>Sin ventas: {String(alert.metadata.daysSinceLastSale)} días</span>}
                                <span className="text-muted-foreground/70">· {relativeTime(alert.createdAt)}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!alert.isRead && (
                          <button onClick={() => handleAction(alert.id, "read")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Marcar como leida">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {!alert.isResolved && (
                          <button onClick={() => handleAction(alert.id, "resolve")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-success-light hover:text-success" title="Resolver">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}