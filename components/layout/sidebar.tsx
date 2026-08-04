"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Bot,
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  Factory,
  Gauge,
  LogOut,
  Menu,
  ScanLine,
  ShoppingCart,
  Siren,
  Undo2,
  Wallet,
  X,
  Bell,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

const navigation = [
  { href: "/dashboard", label: "Resumen", icon: Gauge },
  { href: "/dashboard/pos", label: "Punto de Venta", icon: Wallet },
  { href: "/dashboard/alerts", label: "Alertas", icon: Siren },
  { href: "/dashboard/products", label: "Productos", icon: Boxes },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/returns", label: "Devoluciones", icon: Undo2 },
  { href: "/dashboard/scan", label: "Escanear", icon: ScanLine },
  { href: "/dashboard/suppliers", label: "Proveedores", icon: Factory },
  { href: "/dashboard/supplier-notifications", label: "Notif. Proveedores", icon: Bell },
  { href: "/dashboard/purchase-orders", label: "Órdenes", icon: ClipboardList },
  {
    href: "/dashboard/simulator",
    label: "Simulador",
    icon: ChartNoAxesCombined,
  },
  { href: "/dashboard/ai-console", label: "Consola IA", icon: Bot },
];

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex h-13 items-center px-6 py-2 pt-5 transition-colors hover:bg-primary-light/20"
      >
        <Image
          src="/logo.png"
          alt="Ztocky"
          width={160}
          height={45}
          className="object-contain"
          priority
        />
      </Link>

      {/* Workspace Switcher */}
      <div className="px-2 pt-3 pb-1">
        <WorkspaceSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 mt-1">
        <p className="mb-1 px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Menu principal
        </p>
        <div className="space-y-[1px]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/50",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 p-2 space-y-1">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Configuración
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[230px] flex-col border-r border-border/40 bg-gradient-to-b from-background via-background to-primary/[0.03]">
        <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary to-primary/60" />
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar con hamburguesa ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background px-4">
        <Link href="/dashboard">
          <Image
            src="/logo.png"
            alt="Ztocky"
            width={100}
            height={28}
            className="object-contain"
            priority
          />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile: overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-md transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ── */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[270px] bg-gradient-to-b from-background via-background to-primary/[0.03] border-r border-border/40 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Botón cerrar */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Cerrar menú"
        >
          <X className="h-4 w-4" />
        </button>

        <SidebarContent
          onNavigate={() => setOpen(false)}
        />
      </aside>
    </>
  );
}
