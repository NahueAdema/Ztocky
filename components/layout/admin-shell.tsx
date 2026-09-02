"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
  Building2,
  KeyRound,
  ArrowLeft,
  X,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/admin/sessions", label: "Sesiones", icon: KeyRound },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

function AdminSidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex h-13 items-center gap-2 px-6 py-2 pt-5 transition-colors hover:bg-primary-light/20"
      >
        <Image
          src="/logo.png"
          alt="Ztocky"
          width={130}
          height={37}
          className="object-contain"
          priority
        />
        <span className="inline-flex items-center rounded-md bg-success-light px-1.5 py-0.5 text-[10px] font-semibold text-success border border-success-border">
          Admin
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 mt-1">
        <p className="mb-1 px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Administracion
        </p>
        <div className="space-y-[1px]">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-muted-foreground/60",
                  )}
                />
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 p-2 space-y-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Sun className="h-4 w-4 shrink-0 hidden dark:block" />
          <Moon className="h-4 w-4 shrink-0 block dark:hidden" />
          {mounted ? (theme === "dark" ? "Modo claro" : "Modo oscuro") : "Modo oscuro"}
        </button>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary-light/20 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Ir a mi dashboard
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-danger-light hover:text-danger"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[230px] flex-col border-r border-border/60 bg-background">
        <AdminSidebarContent />
      </aside>

      {/* ── Mobile: top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Ztocky"
            width={100}
            height={28}
            className="object-contain"
            priority
          />
          <span className="inline-flex items-center rounded-md bg-success-light px-1.5 py-0.5 text-[10px] font-semibold text-success border border-success-border">
            Admin
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile: overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ── */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[270px] bg-background border-r border-border/60 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Cerrar menu"
        >
          <X className="h-4 w-4" />
        </button>
        <AdminSidebarContent onNavigate={() => setOpen(false)} />
      </aside>

      {/* ── Main content ── */}
      <div className="lg:pl-[230px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-primary">Ztocky soporte</p>
              <p className="text-xs text-muted-foreground">Consola interna de administracion</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
