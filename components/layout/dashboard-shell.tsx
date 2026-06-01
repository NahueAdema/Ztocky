"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Command, LogOut, Search, Settings, User, ChevronDown, Package, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";

type DashboardUser = {
  name: string;
  email: string;
  workspaceName: string;
};

type AlertItem = {
  id: string;
  type: string;
  message: string;
  productName: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
};

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: DashboardUser;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

  // Re-fetch when dropdown opens
  useEffect(() => {
    if (showNotif) fetchAlerts();
  }, [showNotif, fetchAlerts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = alerts.filter((a) => !a.isResolved);
  const recentAlerts = alerts.slice(0, 5);

  const alertIcon = (type: string) => {
    switch (type) {
      case "CRITICAL_STOCK": return { icon: AlertTriangle, color: "bg-danger-light text-danger" };
      case "LOW_STOCK": return { icon: Clock, color: "bg-warning-light text-warning" };
      case "STAGNANT_STOCK": return { icon: Package, color: "bg-accent-soft text-accent-foreground" };
      default: return { icon: Bell, color: "bg-muted text-muted-foreground" };
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar workspaceName={user.workspaceName} />
      <div className="min-h-screen lg:pl-[230px]">
        <header className="hidden lg:flex sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-6 flex-1">
            <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar productos, proveedores, ordenes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-16 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground pointer-events-none">
                  <Command className="h-3 w-3" /> K
                </span>
              </div>
            </form>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
                aria-label="Ver notificaciones"
              >
                <Bell className="h-4 w-4" />
                {unread.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white px-1">
                    {unread.length > 9 ? "9+" : unread.length}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-card shadow-xl animate-slide-down">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold">Notificaciones</p>
                    {unread.length > 0 && (
                      <span className="text-xs text-muted-foreground">{unread.length} sin resolver</span>
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
                            href="/dashboard/alerts"
                            className={`flex items-start gap-3 rounded-lg p-2 transition ${alert.isResolved ? "opacity-50" : "hover:bg-muted/50"}`}
                            onClick={() => setShowNotif(false)}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{alert.productName}</p>
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

            {/* User menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-1.5 transition hover:bg-muted"
                type="button"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="truncate text-sm font-semibold leading-tight">{user.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground leading-tight">{user.email}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-card shadow-xl animate-slide-down">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Configuracion
                    </Link>
                    <Link href="/dashboard/search" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <Search className="h-4 w-4 text-muted-foreground" />
                      Busqueda global
                    </Link>
                  </div>
                  <div className="p-2 border-t border-border">
                    <form action="/api/auth/logout" method="post">
                      <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger-light" type="submit">
                        <LogOut className="h-4 w-4" />
                        Cerrar sesion
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
