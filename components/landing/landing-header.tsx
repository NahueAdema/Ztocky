"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";

type User = {
  globalRole: string;
};

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#punto-de-venta", label: "Punto de Venta" },
  { href: "#aplicacion", label: "App" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-primary"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function LandingHeader({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);

  const mainHref = user
    ? user.globalRole === "SUPER_ADMIN"
      ? "/admin"
      : "/dashboard"
    : "/login";

  const mainLabel = user
    ? user.globalRole === "SUPER_ADMIN"
      ? "Admin"
      : "Dashboard"
    : "Ingresar";

  return (
    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="Ztocky"
          width={260}
          height={95}
          priority
          className="h-[95px] w-auto rounded object-contain"
        />
      </Link>

      {/* Desktop nav */}
      <nav
        aria-label="Navegación principal"
        className="hidden items-center gap-8 md:flex"
      >
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} href={link.href}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop CTA */}
      <div className="hidden items-center gap-3 md:flex">
        {user ? (
          <Link
            href={mainHref}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:bg-primary-dark hover:shadow-xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {mainLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-bold text-foreground transition-all duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Ingresar
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:bg-primary-dark hover:shadow-xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Crear cuenta
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </div>

      {/* Mobile: CTA + hamburger */}
      <div className="flex items-center gap-2 md:hidden">
        {!user && (
          <Link
            href="/login?mode=register"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold !text-white shadow-md shadow-primary/30 transition-all duration-200 hover:bg-primary-dark active:scale-[0.97]"
          >
            Crear cuenta
          </Link>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile: drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-[280px] border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-bold text-foreground">Menú</p>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-border p-4 space-y-2">
          {user ? (
            <Link
              href={mainHref}
              onClick={() => setOpen(false)}
              className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:bg-primary-dark active:scale-[0.97]"
            >
              {mainLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-bold text-foreground transition-all duration-200 hover:bg-muted"
              >
                Ingresar
              </Link>
              <Link
                href="/login?mode=register"
                onClick={() => setOpen(false)}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:bg-primary-dark active:scale-[0.97]"
              >
                Crear cuenta
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
