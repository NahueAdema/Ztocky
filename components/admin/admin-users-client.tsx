"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Shield, User as UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import type { AdminUser } from "@/lib/data/admin";

type Action =
  | { type: "status"; userId: string; label: string; newStatus: string }
  | { type: "role"; userId: string; label: string; newRole: string }
  | null;

export function AdminUsersClient({
  users,
  total,
  page,
  totalPages,
}: {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<Action>(null);
  const [loading, setLoading] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  async function executeAction() {
    if (!pendingAction) return;
    setLoading(true);

    try {
      const { type, userId } = pendingAction;
      const endpoint = type === "status"
        ? `/api/admin/users/${userId}/status`
        : `/api/admin/users/${userId}/role`;

      const body = type === "status"
        ? { status: pendingAction.newStatus }
        : { role: pendingAction.newRole };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Error al ejecutar acción", "error");
      } else {
        toast(type === "status" ? "Estado actualizado" : "Rol actualizado", "success");
        router.refresh();
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de cuentas para soporte. {total} usuario{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}.
          </p>
        </div>

        {/* Search + Filters */}
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
              placeholder="Buscar por nombre o email..."
              className="h-10 w-full rounded-xl border border-border/60 bg-card/50 px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
            />
          </form>
          <div className="flex gap-2">
            <select
              value={searchParams.get("role") || ""}
              onChange={(e) => updateParam("role", e.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-card/50 px-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              <option value="">Todos los roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="USER">Usuario</option>
            </select>
            <select
              value={searchParams.get("status") || ""}
              onChange={(e) => updateParam("status", e.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-card/50 px-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="SUSPENDED">Suspendido</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <UserIcon className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">No se encontraron usuarios</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchParams.get("q") || searchParams.get("role") || searchParams.get("status")
                    ? "Probá cambiando los filtros de búsqueda"
                    : "Aún no hay usuarios registrados"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 font-medium">Usuario</th>
                      <th className="py-3 px-4 font-medium">Rol</th>
                      <th className="py-3 px-4 font-medium">Estado</th>
                      <th className="py-3 px-4 font-medium">Workspaces</th>
                      <th className="py-3 px-4 font-medium">Último ingreso</th>
                      <th className="py-3 px-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/admin/users/${user.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                            {user.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge tone={user.role === "SUPER_ADMIN" ? "success" : "muted"}>
                            {user.role === "SUPER_ADMIN" ? (
                              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>
                            ) : (
                              "Usuario"
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
                            {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-muted-foreground">
                            {user.memberships.map((m) => m.workspace.name).join(", ") || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {user.lastLoginAt?.toISOString().slice(0, 10) ?? "Nunca"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              className="h-8 px-2.5 text-xs"
                              onClick={() =>
                                setPendingAction({
                                  type: "status",
                                  userId: user.id,
                                  label: user.status === "ACTIVE"
                                    ? `¿Suspender a ${user.name}?`
                                    : `¿Reactivar a ${user.name}?`,
                                  newStatus: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                                })
                              }
                            >
                              {user.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 px-2.5 text-xs"
                              onClick={() =>
                                setPendingAction({
                                  type: "role",
                                  userId: user.id,
                                  label: user.role === "SUPER_ADMIN"
                                    ? `¿Quitar admin a ${user.name}?`
                                    : `¿Hacer admin a ${user.name}?`,
                                  newRole: user.role === "SUPER_ADMIN" ? "USER" : "SUPER_ADMIN",
                                })
                              }
                            >
                              {user.role === "SUPER_ADMIN" ? "Quitar admin" : "Hacer admin"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
        open={pendingAction !== null}
        title={pendingAction?.label || ""}
        description={
          pendingAction?.type === "status"
            ? "Esta acción afecta el acceso del usuario al sistema."
            : "Esta acción cambia los permisos de administración del usuario."
        }
        confirmLabel={loading ? "Procesando..." : "Confirmar"}
        variant={pendingAction?.type === "status" ? "danger" : "warning"}
        onConfirm={executeAction}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
