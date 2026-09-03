"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, Search, BookOpen, MessageSquare, Building2, HelpCircle, Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

type DashboardUser = {
  name: string;
  email: string;
  workspaceName?: string;
  globalRole?: string;
};

export function UserMenu({ user, isMobile = false }: { user: DashboardUser; isMobile?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideUser = userRef.current?.contains(target);
      if (!insideUser) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={userRef}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`${isMobile ? 'flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/50 transition-all hover:bg-muted/60' : 'flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-1.5 transition-all hover:bg-muted/60'}`}
        type="button"
        aria-label="Menú de usuario"
      >
        <div className={`${isMobile ? 'flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-[10px] font-bold text-white' : 'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-xs font-bold text-white'}`}>
          {initials}
        </div>
        {!isMobile && (
          <>
            <div className="hidden sm:block text-left">
              <p className="truncate text-sm font-semibold leading-tight">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight">{user.email}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </>
        )}
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
  );
}