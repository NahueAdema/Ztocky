"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

type Step = {
  selector: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    selector: '[data-tour="kpis"]',
    title: "Tus números de un vistazo",
    body: "Estos son los indicadores clave de tu negocio: riesgo de stock, órdenes pendientes, ventas e ingresos de la semana. Se actualizan solos, en tiempo real.",
  },
  {
    selector: '[data-tour="agotamientos"]',
    title: "Próximos agotamientos",
    body: "Ztocky detecta qué productos se están por agotar según tu ritmo de ventas (burn rate). Así sabés qué reponer antes de quedarte sin stock.",
  },
  {
    selector: '[data-tour="acciones"]',
    title: "Acciones rápidas",
    body: "Atajos para ir directo a las tareas más comunes: ver productos, proveedores, escanear códigos o simular escenarios de demanda.",
  },
];

export function OnboardingTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];
  const lastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    const target = document.querySelector(step.selector);
    if (target) {
      const r = target.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, [step.selector, windowWidth]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (closing) {
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [closing]);

  async function complete() {
    setSaving(true);
    try {
      await fetch("/api/dashboard/onboarding", { method: "POST" });
    } catch {
      // no blockamos el cierre si falla el guardado
    } finally {
      setClosing(true);
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay + spotlight */}
      <div className={`fixed inset-0 z-[90] transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}>
        <div
          className="absolute inset-0"
          onClick={complete}
        />
        {rect && (
          <div
            className="absolute rounded-2xl"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              border: "2px solid var(--primary)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            }}
          />
        )}
      </div>

      {/* Tooltip / popover */}
      <div
        ref={tooltipRef}
        className={`fixed z-[95] w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
        style={{
          top: rect ? Math.min(rect.top + rect.height + 16, window.innerHeight - 240) : "50%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div className="flex items-start justify-between p-4 pb-2">
          <div>
            <p className="text-sm font-semibold text-primary">
              {stepIndex + 1}/{STEPS.length}
            </p>
            <h3 className="text-base font-bold leading-snug">{step.title}</h3>
          </div>
          <button
            onClick={complete}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <button
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Atrás
          </button>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                aria-label={`Paso ${i + 1}`}
              />
            ))}
          </div>
          {lastStep ? (
            <button
              onClick={complete}
              disabled={saving}
              className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Guardando..." : "Empezar"}
            </button>
          ) : (
            <button
              onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary/90"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
