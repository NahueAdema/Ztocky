import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Lightbulb,
  Target,
  Heart,
  Globe,
  Code2,
  Coffee,
  Building2,
  ChevronRight,
} from "lucide-react";

function ValueCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#d9e9ec] text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-[#2e2e2f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

export default function NosotrosPage() {
  return (
    <main className="min-h-screen bg-background antialiased">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#d9e9ec]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_60%,rgba(3,135,134,0.15),transparent)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Volver al inicio
          </Link>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold uppercase leading-[1.08] tracking-tight text-[#2e2e2f] sm:text-5xl">
              Hecho por alguien que
              <br />
              <span className="text-primary">entiende el problema</span>
            </h1>
            <p className="mt-6 text-base leading-7 text-[#5f6062] sm:text-lg">
              Ztocky nace de una necesidad real: ayudar a los comercios de Latinoamérica a dejar de perseguir el stock y tomar el control de sus compras.
            </p>
          </div>
        </div>
      </section>

      {/* ── CREATOR ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex justify-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-[#d9e9ec] bg-white shadow-xl sm:h-56 sm:w-56">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-6xl font-bold text-primary/30">
                NA
              </div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Code2 className="h-3.5 w-3.5" /> Creador
            </div>
            <h2 className="mt-4 text-3xl font-bold text-[#2e2e2f] sm:text-4xl">Nahuel Adema</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Buenos Aires, Argentina
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Desarrollador y emprendedor. Ztocky nació porque vi cómo los comercios pierden plata y tiempo gestionando stock con planillas, llamadas y calculadora. El objetivo es simple: que cualquiera pueda tomar decisiones de compra inteligentes sin ser experto en logística.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="https://github.com/NahueAdema" target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-medium text-[#4B4B4C] transition-all duration-200 hover:bg-muted hover:border-[#4B4B4C]/40">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> @NahueAdema
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Lo que nos mueve</p>
            <h2 className="mt-3 text-3xl font-bold text-[#2e2e2f] sm:text-4xl">Por qué hacemos esto</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              icon={Target}
              title="Simpleza ante todo"
              text="El software tiene que adaptarse al negocio, no al revés. Si hay que aprender algo raro, fallamos."
            />
            <ValueCard
              icon={Building2}
              title="Hecho para LATAM"
              text="Los comercios de acá tienen realidades distintas. Proveedores locales, formas de pago, lógica de reposición. No copiamos soluciones de afuera."
            />
            <ValueCard
              icon={Lightbulb}
              title="Decisiones, no datos"
              text="No mostramos números por mostrar. Cada alerta, cada sugerencia, está pensada para que el dueño decida rápido y bien."
            />
            <ValueCard
              icon={Heart}
              title="El proveedor importa"
              text="No solo la tienda. Queremos que los proveedores también puedan cargar sus precios fácil y que la relación gane en transparencia."
            />
            <ValueCard
              icon={Globe}
              title="Sin ataduras técnicas"
              text="PostgreSQL estándar, sesiones propias, sin vendor lock-in. Si mañana querés cambiar de infraestructura, podés."
            />
            <ValueCard
              icon={Coffee}
              title="Hecho con constancia"
              text="Esto no es un MVP de un fin de semana. Es un producto pensado para crecer, mantener y mejorar todos los días."
            />
          </div>
        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Hoja de ruta</p>
          <h2 className="mt-3 text-3xl font-bold text-[#2e2e2f] sm:text-4xl">Hacia dónde vamos</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/5" />
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Hoy</span>
            <h3 className="mt-4 text-base font-semibold text-[#2e2e2f]">Compras inteligentes</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Alertas de stock, órdenes automáticas, carga de precios de proveedores por CSV y comparación de precios.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/5" />
            <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Próximo</span>
            <h3 className="mt-4 text-base font-semibold text-[#2e2e2f]">Portal del proveedor</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Los proveedores cargan sus propios precios sin registro. Precios que se actualizan solos. Links compartibles.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/5" />
            <span className="inline-flex items-center justify-center rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">Futuro</span>
            <h3 className="mt-4 text-base font-semibold text-[#2e2e2f]">Red de proveedores</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Marketplace inverso: los proveedores publican sus catálogos, las tiendas se suscriben y los precios se sincronizan en tiempo real.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#d9e9ec]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-[#2e2e2f] sm:text-3xl">Formá parte de esto</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#5f6062]">
              Si tenés un comercio o trabajás con proveedores, Ztocky está pensado para vos. Probarlo no cuesta nada.
            </p>
            <Link href="/login?mode=register" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-[#027978]">
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span>Ztocky — {new Date().getFullYear()}</span>
          <nav aria-label="Pie de página" className="flex items-center gap-6 text-xs">
            <Link href="/" className="transition-colors hover:text-primary">Inicio</Link>
            <Link href="/nosotros" className="transition-colors hover:text-primary">Nosotros</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
