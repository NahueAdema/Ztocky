"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Error en el dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">
          No se pudieron cargar los datos. Intentá de nuevo.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted rounded-lg p-2">
            {error.digest}
          </p>
        )}
        <Button onClick={reset} variant="primary">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
