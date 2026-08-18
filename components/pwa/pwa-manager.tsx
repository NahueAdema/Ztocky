"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Bell, Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

const isLoggedIn = () =>
  typeof document !== "undefined" && document.cookie.includes("ztocky_session");

const isNotifPromptDismissed = () => {
  try {
    return (
      typeof window !== "undefined" && sessionStorage.getItem("ztocky_notif_prompted") === "1"
    );
  } catch {
    return true;
  }
};

export function PwaManager() {
  const pathname = usePathname();
  const isIOS = useClientBool(isIOSValue);
  const isStandalone = useClientBool(isStandaloneValue);
  const isLogged = useClientBool(isLoggedIn);
  const isPromptDismissed = useClientBool(isNotifPromptDismissed);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }

    try {
      if (sessionStorage.getItem("ztocky_install_dismissed") === "1") {
        setInstallDismissed(true);
      }
    } catch {
      // ignore
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function subscribeToPush() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && Notification.permission === "granted") {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      if (subscription && isLoggedIn()) {
        await fetch("/api/dashboard/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      }
    } catch {
      // Push no disponible en este contexto (ej: sin HTTPS)
    }
  }

  useEffect(() => {
    if (
      "PushManager" in window &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      void subscribeToPush();
    }
  }, []);

  async function handleEnableNotifications() {
    try {
      sessionStorage.setItem("ztocky_notif_prompted", "1");
    } catch {
      // ignore
    }

    if (!("Notification" in window) || !isLoggedIn()) return;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeToPush();
    }
  }

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  const pushSupported =
    typeof window !== "undefined" && "PushManager" in window && "Notification" in window;
  const pushGranted =
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";

  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/admin");

  const showNotifPrompt =
    pushSupported && !pushGranted && isLogged && !isPromptDismissed && !isStandalone && isDashboard;

  const showInstallBanner =
    !isStandalone && !showNotifPrompt && !installDismissed && (installPrompt !== null || isIOS);

  function dismissInstallBanner() {
    setInstallDismissed(true);
    try {
      sessionStorage.setItem("ztocky_install_dismissed", "1");
    } catch {
      // ignore
    }
  }

  return (
    <>
      {showNotifPrompt && (
        <div className="fixed bottom-4 left-4 z-50 flex max-w-xs items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-light text-warning">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Alertas de stock</p>
            <p className="text-xs text-muted-foreground">
              Activá las notificaciones para no perderte un agotamiento crítico.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleEnableNotifications}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white"
            >
              Activar
            </button>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem("ztocky_notif_prompted", "1");
                } catch {
                  // ignore
                }
                setInstallPrompt(null);
              }}
              className="rounded-md px-1 text-xs text-muted-foreground"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}

      {showInstallBanner && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-xs items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instalá Ztocky</p>
            <p className="text-xs text-muted-foreground">
              {isIOS
                ? "Desde Safari: Compartir → Agregar a pantalla de inicio."
                : "Acceso rápido como una app de tu teléfono."}
            </p>
          </div>
          {!isIOS && installPrompt && (
            <button
              onClick={handleInstall}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white"
            >
              Instalar
            </button>
          )}
          <button
            onClick={dismissInstallBanner}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
