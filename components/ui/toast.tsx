"use client";

import { useState, useCallback, createContext, useContext, useEffect } from "react";
import { CheckCircle2, AlertTriangle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "border-success/30 bg-success-light text-success",
  error: "border-danger/30 bg-danger-light text-danger",
  info: "border-primary/30 bg-primary/10 text-primary",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = iconMap[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 shadow-lg animate-slide-down",
        colorMap[toast.type],
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
