"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ocurrió un error inesperado. Si persiste, contactá al soporte.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted rounded-lg p-2">
            Error: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            Intentar de nuevo
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} variant="secondary">
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
