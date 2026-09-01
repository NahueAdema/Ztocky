"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Command, LogOut, Search, Settings, ChevronDown, Package, AlertTriangle, Clock, CheckCircle2, Sun, Moon, BookOpen, MessageSquare, Building2, HelpCircle, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";

function getModifierKey() {
  if (typeof navigator === "undefined") return "Cmd";
  return navigator.userAgent.includes("Mac") ? "Cmd" : "Ctrl";
}

import { Sidebar } from "@/components/layout/sidebar";

type DashboardUser = {
  name: string;
  email: string;
  workspaceName?: string;
  globalRole?: string;
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
  const { theme, setTheme } = useTheme();
  const [searchInput, setSearchInput] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRefMobile = useRef<HTMLDivElement>(null);
  const userRefMobile = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [modifierKey, setModifierKey] = useState("Cmd");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setModifierKey(getModifierKey());
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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
      const target = e.target as Node;
      const insideNotif =
        notifRef.current?.contains(target) || notifRefMobile.current?.contains(target);
      const insideUser =
        userRef.current?.contains(target) || userRefMobile.current?.contains(target);
      if (!insideNotif) setShowNotif(false);
      if (!insideUser) setShowUserMenu(false);
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
      case "STAGNANT_STOCK": return { icon: Package, color: "bg-accent-soft text-accent" };
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
      <Sidebar />
      <div className="min-h-screen lg:pl-[230px]">
        <header className="hidden lg:flex sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-6 flex-1">
            <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar productos, proveedores, órdenes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/60 bg-card/50 pl-10 pr-16 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground pointer-events-none">
                  {modifierKey}+K
                </span>
              </div>
            </form>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
              aria-label="Cambiar tema"
            >
              <Sun className="h-4 w-4 hidden dark:block" />
              <Moon className="h-4 w-4 block dark:hidden" />
            </button>

            {/* Notifications */}
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
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-1.5 transition-all hover:bg-muted/60"
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
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card shadow-xl animate-slide-down">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <Link href="/dashboard/team" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Equipo
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Configuración
                    </Link>
                    {user.globalRole === "SUPER_ADMIN" && (
                      <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        Panel de administración
                      </Link>
                    )}
                    <Link href="/dashboard/search" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <Search className="h-4 w-4 text-muted-foreground" />
                      Búsqueda global
                    </Link>
                    <Link href="/dashboard/guide" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Guía de uso
                    </Link>
                    <Link href="/dashboard/help" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      Centro de ayuda
                    </Link>
                    <Link href="/dashboard/feedback" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Feedback
                    </Link>
                    <button
                      onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setShowUserMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
                    >
                      <Sun className="h-4 w-4 text-muted-foreground hidden dark:block" />
                      <Moon className="h-4 w-4 text-muted-foreground block dark:hidden" />
                      {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                    </button>
                  </div>
                  <div className="p-2 border-t border-border">
                    <form action="/api/auth/logout" method="post">
                      <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger-light" type="submit">
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* ── Mobile: action bar ── */}
        <div className="lg:hidden fixed top-14 left-0 right-0 z-30 flex h-11 items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur-xl px-3">
          <Link
            href="/dashboard/search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRefMobile}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
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
              <div className="absolute left-0 top-12 w-80 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card shadow-xl animate-slide-down lg:left-auto lg:right-0">
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
          <div className="relative ml-auto" ref={userRefMobile}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/50 transition-all hover:bg-muted/60"
              type="button"
              aria-label="Menú de usuario"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-[10px] font-bold text-white">
                {initials}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card shadow-xl animate-slide-down">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <Link href="/dashboard/team" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Equipo
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configuración
                  </Link>
                  {user.globalRole === "SUPER_ADMIN" && (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      Panel de administración
                    </Link>
                  )}
                  <Link href="/dashboard/search" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Búsqueda global
                  </Link>
                  <Link href="/dashboard/guide" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Guía de uso
                  </Link>
                  <Link href="/dashboard/help" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Centro de ayuda
                  </Link>
                  <Link href="/dashboard/feedback" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Feedback
                  </Link>
                  <button
                    onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setShowUserMenu(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
                  >
                    <Sun className="h-4 w-4 text-muted-foreground hidden dark:block" />
                    <Moon className="h-4 w-4 text-muted-foreground block dark:hidden" />
                    {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                  </button>
                </div>
                <div className="p-2 border-t border-border">
                  <form action="/api/auth/logout" method="post">
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger-light" type="submit">
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8 pt-[100px] lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
