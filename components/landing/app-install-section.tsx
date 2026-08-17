"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Check,
  Copy,
  Download,
  QrCode,
  Share,
  Smartphone,
  Store,
  Zap,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const emptySubscribe = () => () => {};

function useClientBool(getValue: () => boolean): boolean {
  return useSyncExternalStore(emptySubscribe, getValue, () => false);
}

const isIOSValue = () =>
  typeof window !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as unknown as { MSStream?: unknown }).MSStream;

const isStandaloneValue = () =>
  typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;

function QrModal({ onClose }: { onClose: () => void }) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    import("qrcode")
      .then((mod) => mod.default.toDataURL(url, { width: 280, margin: 1 }))
      .then((data) => {
        if (active) setDataUrl(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Código QR de la aplicación"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">Escaneá el código QR</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Abrí la cámara de tu celular y apuntá al código para abrir la app en tu dispositivo.
        </p>

        <div className="mx-auto mt-5 flex h-64 w-64 items-center justify-center rounded-2xl border border-border bg-background p-3">
          {dataUrl ? (
            <img src={dataUrl} alt="Código QR para abrir Ztocky en tu celular" className="h-full w-full" />
          ) : (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        <p className="mt-3 break-all text-xs text-muted-foreground">{url}</p>

        <button
          onClick={onClose}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:bg-primary-dark"
        >
          Listo <Check className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function AppInstallSection() {
  const isIOS = useClientBool(isIOSValue);
  const isStandalone = useClientBool(isStandaloneValue);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstallEvent(null);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard no disponible
    }
  };

  return (
    <section id="aplicacion" className="border-y border-border bg-soft-teal/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Aplicación móvil
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            Instalá Ztocky en tu celular.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Se abre como una app nativa desde la pantalla de inicio, sin pasar por la tienda.
            Escaneá productos, cargá ventas y recibí alertas de stock aunque tengas la app cerrada.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              { icon: Store, text: "Acceso instantáneo con un ícono en el inicio del celular" },
              { icon: BellRing, text: "Alertas push cuando un producto está por agotarse" },
              { icon: Zap, text: "Carga más rápida y experiencia de app, no de página web" },
              { icon: Smartphone, text: "Funciona en Android e iOS, sin descargar nada de una tienda" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {!isStandalone && installEvent && (
              <button
                onClick={handleInstall}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold !text-white shadow-lg shadow-primary/40 transition-all duration-200 hover:bg-primary-dark hover:shadow-xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
              >
                <Download className="h-4 w-4" aria-hidden />
                Instalar en mi dispositivo
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={handleCopyLink}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-card-white/60 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors duration-150 hover:bg-card-white/90 sm:w-auto"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Link copiado" : "Copiar link de la app"}
              </button>
            )}

            {!isStandalone && (
              <button
                onClick={() => setShowQr(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-card-white/60 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors duration-150 hover:bg-card-white/90 sm:w-auto"
              >
                <QrCode className="h-4 w-4 text-primary" aria-hidden />
                Ver código QR
              </button>
            )}

            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card-white/60 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors duration-150 hover:bg-card-white/90 sm:w-auto"
            >
              Abrir Ztocky <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {showQr && <QrModal onClose={() => setShowQr(false)} />}

          {isIOS && !isStandalone && (
            <div className="mt-6 max-w-md rounded-xl border border-border bg-card-white/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Share className="h-4 w-4 text-primary" aria-hidden />
                Cómo instalarla en iPhone/iPad
              </p>
              <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
                <li>Abrí la app en Safari.</li>
                <li>Tocá el botón Compartir (cuadrado con flecha hacia arriba).</li>
                <li>Elegí <strong className="font-semibold text-foreground">Agregar a pantalla de inicio</strong>.</li>
                <li>Confirmá y listo: Ztocky queda en tu inicio con su propio ícono.</li>
              </ol>
            </div>
          )}
        </div>

        <div className="relative hidden lg:flex lg:justify-center">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(3,135,134,0.15),transparent)]" />
          {/* Phone mockup */}
          <div className="relative w-[300px] rounded-[2.5rem] border-[10px] border-foreground/90 bg-background shadow-2xl">
            <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
            <div className="flex h-[600px] flex-col overflow-hidden rounded-[1.9rem] bg-card-white">
              <div className="flex items-center justify-between px-5 pt-10">
                <div>
                  <p className="text-[11px] text-muted-foreground">Buenos días</p>
                  <p className="text-base font-bold text-foreground">Mi negocio</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-xs font-bold text-white">
                  MN
                </div>
              </div>
              <div className="mt-5 px-5">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Stock crítico", value: "12" },
                    { label: "Órdenes", value: "4" },
                    { label: "Ventas hoy", value: "23" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-muted p-2.5 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</p>
                      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Próximos agotamientos
                </p>
                <div className="mt-2 space-y-2">
                  {[
                    { name: "Café Brasil 1 kg", days: 3, urgent: true },
                    { name: "Yerba 500g", days: 6, urgent: false },
                    { name: "Azúcar 1 kg", days: 8, urgent: false },
                  ].map((item) => (
                    <div key={item.name} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground">{item.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            item.urgent ? "bg-danger-light text-danger" : "bg-warning-light text-warning"
                          }`}
                        >
                          {item.days} días
                        </span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${item.urgent ? "bg-danger" : "bg-warning"}`}
                          style={{ width: item.urgent ? "20%" : "45%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating install bar */}
              <div className="mt-auto flex items-center gap-3 border-t border-border bg-background px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">Instalá la app</p>
                  <p className="text-[10px] text-muted-foreground">Alertas y acceso rápido</p>
                </div>
                <span className="flex h-8 items-center rounded-full bg-primary px-3 text-[11px] font-bold !text-white">
                  Instalar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
