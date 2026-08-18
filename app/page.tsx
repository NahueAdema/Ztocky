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
  Store,
  TrendingDown,
  ShoppingCart,
  Wallet,
  Camera,
  CreditCard,
  Receipt,
  type LucideIcon,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { AppInstallSection } from "@/components/landing/app-install-section";
import { LandingHeader } from "@/components/landing/landing-header";

interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: Store,
    title: "Recibí alertas antes de quedarte sin stock",
    text: "Conocé qué productos necesitan reposición antes de que afecten tus ventas.",
    accent: "bg-success-light text-success",
  },
  {
    icon: TrendingDown,
    title: "Compará tus proveedores",
    text: "Visualizá precios, tiempos de entrega y desempeño para elegir con más información.",
    accent: "bg-sky-light text-sky",
  },
  {
    icon: ShoppingCart,
    title: "Generá órdenes de compra fácilmente",
    text: "Creá, revisá y enviá órdenes de compra desde un único lugar.",
    accent: "bg-indigo-light text-indigo",
  },
  {
    icon: BarChart3,
    title: "Consultá sobre tu negocio",
    text: "Hacé preguntas como: ¿Qué debería comprar esta semana? ¿Qué productos necesitan reposición? Recibí respuestas basadas en la información de tu negocio.",
    accent: "bg-warning-light text-warning",
  },
];

const BENEFITS = [
  "Alertas cuando un producto necesita reposición.",
  "Recomendaciones basadas en el historial de tu negocio.",
  "Identificación de productos con baja rotación.",
  "Importación sencilla de listas de precios mediante archivos CSV.",
];

function FeatureCard({ icon: Icon, title, text, accent }: Feature) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      <span className="absolute inset-x-6 bottom-0 h-[2px] scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
    </article>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/80 bg-card-white/70 shadow-2xl shadow-primary/10 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 border-b border-border/40 bg-card-white/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#fe5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">Ztocky — Panel de compras</span>
      </div>
      <div className="p-4">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { label: "Stock crítico", value: "12" },
            { label: "Entrega estimada", value: "3 días" },
            { label: "Compra sugerida", value: "180 u" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted p-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">{label}</p>
              <p className="mt-1 text-xl font-bold text-card-foreground">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-card-foreground">Café Brasil 1 kg</p>
              <p className="text-xs text-muted-foreground">SKU #CB1000 · Proveedor: Norte Distribuciones</p>
            </div>
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary">
              Comprar hoy
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-primary-light">
            <div className="h-full rounded-full bg-primary" style={{ width: "28%" }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>28 unidades</span>
            <span>Mínimo recomendado: 40</span>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-soft-teal/50 px-3.5 py-3">
          <BrainCircuit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[11px] leading-5 text-muted-foreground">
            <strong className="font-semibold">Recomendación:</strong> Según el historial de ventas de tu negocio, recomendamos comprar aproximadamente 200 unidades para cubrir la demanda estimada de los próximos 18 días.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  const mainHref = user
    ? user.globalRole === "SUPER_ADMIN" ? "/admin" : "/dashboard"
    : "/login";

  const mainLabel = user
    ? user.globalRole === "SUPER_ADMIN" ? "Admin" : "Dashboard"
    : "Ingresar";

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section id="inicio" className="relative overflow-hidden bg-soft-teal text-muted-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_60%,rgba(3,135,134,0.18),transparent)] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "linear-gradient(rgba(75,75,76,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(75,75,76,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px" }}
        />

        <LandingHeader user={user} />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-16 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:py-32">
          <div className="flex flex-col items-start">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Diseñado para ayudarte a gestionar mejor tu negocio.
            </span>

            <h1 className="text-4xl font-extrabold uppercase leading-[1.08] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
              Administrar tu negocio
              <br />
              <span className="text-primary">no debería ser complicado.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground/80 sm:text-lg">
              Centralizá tu stock, tus compras y tus proveedores en un solo lugar para tomar decisiones con más tranquilidad. Ztocky organiza la información de tu negocio para que puedas dedicar menos tiempo a administrar y más tiempo a hacerlo crecer.
            </p>

            <p className="mt-4 text-sm font-semibold text-primary/80">
              Con Ztocky, el stock se administra solo.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={mainHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-colors duration-150 hover:bg-primary-dark hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {user ? "Ir al dashboard" : "Comenzar gratis"}<ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {!user && (
                <Link href="/login?mode=register" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card-white/50 px-7 text-sm font-bold text-foreground backdrop-blur-sm transition-colors duration-150 hover:bg-card-white/80">
                  Crear cuenta
                </Link>
              )}
            </div>

            <a href="#funcionalidades" aria-label="Ver funcionalidades" className="mt-12 hidden animate-bounce text-primary/50 transition hover:text-primary lg:block">
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>

          <div className="hidden lg:flex lg:justify-end">
            <div className="w-full max-w-md"><DashboardPreview /></div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Cómo puede ayudarte Ztocky</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            Todo lo que necesitás para gestionar mejor tu negocio.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Reunimos la información de tus compras, ventas y proveedores para ayudarte a tomar decisiones con mayor tranquilidad y mantener todo organizado desde un único lugar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (<FeatureCard key={f.title} {...f} />))}
        </div>
      </section>

      {/* ── PUNTO DE VENTA ─────────────────────────────────────────────────── */}
      <section id="punto-de-venta" className="border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Punto de venta</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
                Vendé rápido, cobrá fácil, controlá todo.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Una caja moderna pensada para comercios. Escaneá productos con la cámara o un lector USB, elegí el método de pago y generá el ticket al instante. Sin complicaciones.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Camera, text: "Escaneo con cámara o lector de código de barras" },
                  { icon: CreditCard, text: "4 métodos de pago: efectivo, tarjeta, transferencia y cuenta corriente" },
                  { icon: Receipt, text: "Tickets en PDF listos para imprimir o descargar" },
                  { icon: Wallet, text: "Control de caja con apertura, cierre y diferencia de efectivo" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 active:scale-[0.97]"
                >
                  Probá la caja gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-border bg-card-white p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Caja principal</p>
                    <p className="text-xs text-muted-foreground">Ticket #0042 · 24/07/2026 14:32</p>
                  </div>
                  <span className="ml-auto rounded-full bg-success-light px-2.5 py-0.5 text-[10px] font-bold text-success">COBRADO</span>
                </div>
                <div className="space-y-2 mb-4">
                  {[
                    { name: "Coca-Cola 500ml", qty: 2, price: 1500 },
                    { name: "Papel higiénico x4", qty: 1, price: 2800 },
                    { name: "Galletitas Chocolate", qty: 3, price: 900 },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">{item.qty}x</span>
                        <span className="text-sm text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">${(item.price * item.qty).toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">$10.100</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Descuento</span><span className="font-medium text-success">-$500</span></div>
                  <div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span className="text-primary">$9.600</span></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="flex-1 rounded-lg bg-success-light py-2 text-center text-xs font-bold text-success">Efectivo</span>
                  <span className="flex-1 rounded-lg bg-muted py-2 text-center text-xs font-medium text-muted-foreground">Tarjeta</span>
                  <span className="flex-1 rounded-lg bg-muted py-2 text-center text-xs font-medium text-muted-foreground">Transfer.</span>
                  <span className="flex-1 rounded-lg bg-muted py-2 text-center text-xs font-medium text-muted-foreground">Cta Cte</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── APP ───────────────────────────────────────────────────────────── */}
      <AppInstallSection />

      {/* ── ABOUT ─────────────────────────────────────────────────────────── */}
      <section id="nosotros" className="border-y border-border bg-card-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Nuestra misión</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              Queremos que administrar tu negocio sea más simple.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Sabemos que gestionar un negocio implica tomar decisiones todos los días. Nuestro objetivo es ayudarte a hacerlo con más tranquilidad, reuniendo la información importante en un solo lugar y transformándola en recomendaciones claras para que puedas dedicar más tiempo a hacer crecer tu negocio.
            </p>
            <Link href="/nosotros" className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-card-white px-5 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/5 hover:border-primary active:scale-[0.97]">
              Conocé nuestra historia <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <p className="text-sm font-medium leading-6 text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section id="contacto" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-soft-teal p-8 sm:p-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_90%_50%,rgba(3,135,134,0.20),transparent)]" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Empezá cuando quieras</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                Empezá a gestionar tu negocio con más tranquilidad.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground/80">
                Creá tu cuenta y comenzá a organizar tus compras, proveedores y stock desde un único lugar. Sin procesos complicados, con una experiencia pensada para acompañarte desde el primer día.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href={mainHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-colors hover:bg-primary-dark hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <MailCheck className="h-4 w-4" aria-hidden />
                {user ? "Abrir dashboard" : "Ingresar a Ztocky"}
              </Link>
              {!user && (
                <Link href="/login?mode=register" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary/25 bg-card-white/60 px-7 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:bg-card-white/90">
                  Crear cuenta gratis
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            <span>Ztocky — ayudándote a tomar mejores decisiones para tu negocio.</span>
          </div>
          <nav aria-label="Pie de página" className="flex items-center gap-6 text-xs">
            <a href="#inicio" className="transition-colors hover:text-primary">Inicio</a>
            <a href="#funcionalidades" className="transition-colors hover:text-primary">Funcionalidades</a>
            <a href="#punto-de-venta" className="transition-colors hover:text-primary">Punto de Venta</a>
            <a href="#aplicacion" className="transition-colors hover:text-primary">App</a>
            <Link href="/nosotros" className="transition-colors hover:text-primary">Nosotros</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
