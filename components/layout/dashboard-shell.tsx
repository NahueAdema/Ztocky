"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Store } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

type DashboardUser = {
  name: string;
  email: string;
  workspaceName?: string;
  globalRole?: string;
};

function getModifierKey() {
  if (typeof navigator === "undefined") return "Cmd";
  return navigator.userAgent.includes("Mac") ? "Cmd" : "Ctrl";
}

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: DashboardUser;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [modifierKey, setModifierKey] = useState("Cmd");

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

            <NotificationBell />

            <Link
              href="/dashboard/my-business"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                pathname === "/dashboard/my-business"
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20",
              )}
              aria-label="Ir a Mi negocio"
            >
              <Store className="h-4 w-4" />
            </Link>

            <UserMenu user={user} />
          </div>
        </header>

        <div className="lg:hidden fixed top-14 left-0 right-0 z-30 flex h-11 items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur-xl px-3">
          <Link
            href="/dashboard/search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Link>

          <NotificationBell />

          <Link
            href="/dashboard/my-business"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
              pathname === "/dashboard/my-business"
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20",
            )}
            aria-label="Ir a Mi negocio"
          >
            <Store className="h-4 w-4" />
          </Link>

          <div className="ml-auto">
            <UserMenu user={user} isMobile />
          </div>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8 pt-[100px] lg:pt-6">{children}</main>
      </div>
    </div>
  );
}