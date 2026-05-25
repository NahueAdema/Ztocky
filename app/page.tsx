import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  MailCheck,
  PackageCheck,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ElementType;
  title: string;
  text: string;
  accent: string;
}

interface Stat {
  value: string;
  label: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    icon: BrainCircuit,
    title: "Burn rate inteligente",
    text: "Calcula la velocidad real de venta por SKU y proyecta agotamientos con días exactos de anticipación.",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: Truck,
    title: "Proveedor ideal",
    text: "Compara precio, lead time, costo de envío y confiabilidad histórica para elegir la mejor fuente.",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    icon: PackageCheck,
    title: "Órdenes automáticas",
    text: "Genera borradores de compra listos para revisar o enviar directamente al proveedor.",
    accent: "bg-violet-50 text-violet-700",
  },
  {
    icon: BarChart3,
    title: "Reportes con IA",
    text: "Consultá el estado de tu inventario en lenguaje natural, sin aprender ninguna herramienta.",
    accent: "bg-amber-50 text-amber-700",
  },
];

const STATS: Stat[] = [
  { value: "–30%", label: "Quiebres de stock" },
  { value: "3x", label: "Agilidad de compra" },
  { value: "100%", label: "Decisiones basadas en datos" },
];

const CHECKLIST = [
  "Predicción de agotamientos por producto.",
  "Alertas críticas según lead time real.",
  "Stock estancado para liberar capital.",
  "Integración con Groq, Neon y correo.",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-[#4B4B4C] transition-colors duration-150 hover:text-primary"
    >
      {children}
    </a>
  );
}

function StatCard({ value, label }: Stat) {
  return (
    <div className="flex flex-col items-center gap-1 px-8 py-5 text-center">
      <span className="text-3xl font-bold tabular-nums text-primary sm:text-4xl">
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-[#4B4B4C]/60">
        {label}
      </span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text, accent }: Feature) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <h3 className="text-base font-semibold text-[#2e2e2f]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      {/* Subtle bottom accent line on hover */}
      <span className="absolute inset-x-6 bottom-0 h-[2px] scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
    </article>
  );
}

// ─── Mock dashboard widget ─────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-2xl shadow-[#038786]/10 backdrop-blur-sm">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border/40 bg-white/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#fe5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">
          Ztocky — Panel de compras
        </span>
      </div>

      <div className="p-4">
        {/* Metric row */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { label: "Stock crítico", value: "12" },
            { label: "Lead time prom.", value: "3 d" },
            { label: "Orden sugerida", value: "180 u" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-[#f4f8f8] p-3 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#4B4B4C]/50">
                {label}
              </p>
              <p className="mt-1 text-xl font-bold text-[#2e2e2f]">{value}</p>
            </div>
          ))}
        </div>

        {/* Product row */}
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2e2e2f]">
                Café Brasil 1 kg
              </p>
              <p className="text-xs text-muted-foreground">
                SKU #CB1000 · Proveedor A
              </p>
            </div>
            <span className="rounded-full bg-[#e2f4f4] px-2.5 py-1 text-[11px] font-semibold text-[#038786]">
              Comprar hoy
            </span>
          </div>
          {/* Stock bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e2f4f4]">
            <div
              className="h-full rounded-full bg-[#038786]"
              style={{ width: "28%" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>28 u restantes</span>
            <span>Stock mín. 40 u</span>
          </div>
        </div>

        {/* AI suggestion pill */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#d9e9ec]/50 px-3.5 py-3">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[11px] leading-5 text-[#4B4B4C]">
            <strong className="font-semibold">Sugerencia IA:</strong> Pedí 200 u
            hoy para cubrir 18 días de demanda proyectada y evitar quiebre el
            jue. 29.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const user = await getCurrentUser();

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
    <main className="min-h-screen bg-background text-foreground antialiased">
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-[#d9e9ec] text-[#4B4B4C]"
      >
        {/* Background gradients */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_60%,rgba(3,135,134,0.18),transparent)] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
        />
        {/* Subtle grid lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(75,75,76,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(75,75,76,0.12) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* ── Header ── */}
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Ztocky"
              width={160}
              height={60}
              priority
              className="h-15 w-auto rounded object-contain"
            />
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-8 md:flex"
          >
            <NavLink href="#inicio">Inicio</NavLink>
            <NavLink href="#funcionalidades">Funcionalidades</NavLink>
            <NavLink href="#nosotros">Nosotros</NavLink>
            <NavLink href="#contacto">Contacto</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={mainHref}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#027978] px-5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {mainLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex h-10 items-center rounded-full border border-[#4B4B4C]/20 px-5 text-sm font-medium text-[#4B4B4C] transition-all duration-200 hover:bg-white/80 hover:border-[#4B4B4C]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Ingresar
                </Link>
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#027978] px-5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Crear cuenta
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </header>

        {/* ── Hero body ── */}
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-16 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:py-32">
          {/* Left column */}
          <div className="flex flex-col items-start">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Smart Procurement · Autonomous Inventory
            </span>

            <h1 className="text-4xl font-extrabold uppercase leading-[1.08] tracking-tight text-[#2e2e2f] sm:text-5xl xl:text-6xl">
              La solución integral
              <br />
              <span className="text-primary">para tu comercio</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#5f6062] sm:text-lg">
              Optimizá compras, anticipá quiebres de stock y dejá que Ztocky
              decida cuándo, cuánto y a quién comprarle — todo en automático.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={mainHref}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-colors duration-150 hover:bg-[#027978] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {user ? "Ir al dashboard" : "Comenzar gratis"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>

              <Link
                href="/login?mode=register"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#4B4B4C]/20 bg-white/50 px-7 text-sm font-semibold text-[#4B4B4C] backdrop-blur-sm transition-colors duration-150 hover:bg-white/80"
              >
                Crear cuenta
              </Link>
            </div>

            {/* Scroll cue */}
            <a
              href="#funcionalidades"
              aria-label="Ver funcionalidades"
              className="mt-12 hidden animate-bounce text-primary/50 transition hover:text-primary lg:block"
            >
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>

          {/* Right column — dashboard mockup */}
          <div className="hidden lg:flex lg:justify-end">
            <div className="w-full max-w-md">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div className="border-y border-border bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-stretch divide-x divide-border">
          {STATS.map((s) => (
            <div key={s.label} className="flex-1">
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section
        id="funcionalidades"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Funcionalidades
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#2e2e2f] sm:text-4xl">
            Un sistema que no espera
            <br />a que falte stock.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Ztocky procesa datos de ventas, proveedores y lead times para actuar
            antes de que el problema ocurra.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────────────────── */}
      <section id="nosotros" className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          {/* Left */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Nosotros
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#2e2e2f] sm:text-4xl">
              Convierte datos operativos en decisiones de compra.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Ztocky unifica tu historial de ventas, tus proveedores y tus
              parámetros de operación para generar recomendaciones precisas y
              oportunas, sin necesidad de planillas.
            </p>
          </div>

          {/* Right — checklist */}
          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  aria-hidden
                />
                <p className="text-sm font-medium leading-6 text-[#2e2e2f]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section
        id="contacto"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#d9e9ec] p-8 sm:p-12">
          {/* BG decoration */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_90%_50%,rgba(3,135,134,0.20),transparent)]"
          />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Contacto
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#2e2e2f] sm:text-3xl">
                Preparado para automatizar tus compras.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5f6062]">
                Empezá hoy sin configuraciones complejas. Ztocky se adapta al
                ritmo de tu operación.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href={mainHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#027978] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MailCheck className="h-4 w-4" aria-hidden />
                {user ? "Abrir dashboard" : "Ingresar a Ztocky"}
              </Link>

              {!user && (
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary/25 bg-white/60 px-7 text-sm font-semibold text-[#4B4B4C] backdrop-blur-sm transition-colors hover:bg-white/90"
                >
                  Crear cuenta gratis
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            <span>Ztocky — decisiones automáticas basadas en datos reales</span>
          </div>

          <nav
            aria-label="Pie de página"
            className="flex items-center gap-6 text-xs"
          >
            <a href="#inicio" className="transition-colors hover:text-primary">
              Inicio
            </a>
            <a
              href="#funcionalidades"
              className="transition-colors hover:text-primary"
            >
              Funcionalidades
            </a>
            <a
              href="#nosotros"
              className="transition-colors hover:text-primary"
            >
              Nosotros
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
