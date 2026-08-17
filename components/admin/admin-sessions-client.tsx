"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import type { AdminSession } from "@/lib/data/admin";

export function AdminSessionsClient({
  sessions,
  total,
  page,
  totalPages,
}: {
  sessions: AdminSession[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const now = new Date();
  const [revokeTarget, setRevokeTarget] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/admin/sessions?${params.toString()}`);
    },
    [router, searchParams],
  );

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`/admin/sessions?${params.toString()}`);
    },
    [router, searchParams],
  );

  async function handleRevoke() {
    if (!revokeTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions/${revokeTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error al revocar sesión", "error");
      } else {
        toast("Sesión revocada. El usuario será deslogueado.", "success");
        router.refresh();
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setLoading(false);
      setRevokeTarget(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Sesiones</h1>
          <p className="text-sm text-muted-foreground">
            Vista para soporte ante reportes de accesos o sesiones vencidas. {total} sesión{total !== 1 ? "es" : ""}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateParam("q", String(fd.get("q") || ""));
            }}
            className="flex-1"
          >
            <input
              name="q"
              defaultValue={searchParams.get("q") || ""}
              placeholder="Buscar por email de usuario..."
              className="h-10 w-full max-w-md rounded-xl border border-border/60 bg-card/50 px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
            />
          </form>
          <select
            value={searchParams.get("status") || ""}
            onChange={(e) => updateParam("status", e.target.value)}
            className="h-10 rounded-xl border border-border/60 bg-card/50 px-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          >
            <option value="">Todas</option>
            <option value="active">Activas</option>
            <option value="expired">Vencidas</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <KeyRound className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">No se encontraron sesiones</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchParams.get("q") || searchParams.get("status")
                    ? "Probá cambiando los filtros"
                    : "No hay sesiones registradas"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 font-medium">Usuario</th>
                      <th className="py-3 px-4 font-medium">Estado</th>
                      <th className="py-3 px-4 font-medium">Creada</th>
                      <th className="py-3 px-4 font-medium">Expira</th>
                      <th className="py-3 px-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((session) => {
                      const isActive = session.expiresAt > now;
                      return (
                        <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground">{session.user.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge tone={isActive ? "success" : "muted"}>
                              {isActive ? "Activa" : "Vencida"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {session.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {session.expiresAt.toISOString().slice(0, 16).replace("T", " ")}
                          </td>
                          <td className="py-3 px-4">
                            {isActive && (
                              <Button
                                variant="ghost"
                                className="h-8 px-2.5 text-xs text-danger hover:text-danger"
                                onClick={() => setRevokeTarget(session)}
                              >
                                Revocar
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revocar sesión"
        description={`El usuario ${revokeTarget?.user.email} será deslogueado inmediatamente de todos sus dispositivos.`}
        confirmLabel={loading ? "Revocando..." : "Revocar sesión"}
        variant="danger"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
}
