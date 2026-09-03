"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Clock, Package, TrendingUp, Truck, CheckCircle2 } from "lucide-react";

type AlertItem = {
  id: string;
  type: string;
  title: string | null;
  message: string;
  productName: string;
  href: string | null;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
};

const alertIcon = (type: string) => {
  switch (type) {
    case "CRITICAL_STOCK": return { icon: AlertTriangle, color: "bg-danger-light text-danger" };
    case "LOW_STOCK": return { icon: Clock, color: "bg-warning-light text-warning" };
    case "STAGNANT_STOCK": return { icon: Package, color: "bg-accent-soft text-accent" };
    case "PRICE_CHANGE": return { icon: TrendingUp, color: "bg-accent-soft text-accent" };
    case "SUPPLIER_RISK": return { icon: Truck, color: "bg-warning-light text-warning" };
    case "ORDER_STATUS": return { icon: Package, color: "bg-accent-soft text-accent" };
    case "REGISTER_DISCREPANCY": return { icon: AlertTriangle, color: "bg-danger-light text-danger" };
    case "PAYMENT_RECEIVED": return { icon: CheckCircle2, color: "bg-success-light text-success" };
    case "LOW_BALANCE": return { icon: AlertTriangle, color: "bg-warning-light text-warning" };
    default: return { icon: Bell, color: "bg-muted text-muted-foreground" };
  }
};

export function NotificationBell() {
  const [showNotif, setShowNotif] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch { /* fail silently */ }
    finally { setLoadingAlerts(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    if (showNotif) fetchAlerts();
  }, [showNotif, fetchAlerts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideNotif = notifRef.current?.contains(target);
      if (!insideNotif) setShowNotif(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = alerts.filter((a) => !a.isRead && !a.isResolved);
  const unresolved = alerts.filter((a) => !a.isResolved);
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setShowNotif(!showNotif)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
        type="button"
        aria-label="Ver notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-bold text-white px-1 shadow-sm">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>
      {showNotif && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-xl animate-slide-down">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold">Notificaciones</p>
            {unread.length > 0 && (
              <span className="text-xs text-muted-foreground">{unresolved.length} sin resolver</span>
            )}
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {loadingAlerts ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                <p className="text-xs text-muted-foreground/60">Todo en orden por ahora</p>
              </div>
            ) : (
              recentAlerts.map((alert) => {
                const { icon: Icon, color } = alertIcon(alert.type);
                return (
                  <Link
                    key={alert.id}
                    href={alert.href ?? "/dashboard/alerts"}
                    className={`flex items-start gap-3 rounded-lg p-2 transition ${alert.isResolved ? "opacity-50" : "hover:bg-muted/50"}`}
                    onClick={() => setShowNotif(false)}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title ?? alert.productName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="p-3 border-t border-border">
            <Link
              href="/dashboard/alerts"
              className="text-xs font-medium text-primary hover:underline block text-center"
              onClick={() => setShowNotif(false)}
            >
              {alerts.length > 0 ? `Ver todas (${alerts.length})` : "Ir a alertas"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}