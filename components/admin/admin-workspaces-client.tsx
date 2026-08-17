"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import type { AdminWorkspace } from "@/lib/data/admin";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export function AdminWorkspacesClient({
  workspaces,
  total,
  page,
  totalPages,
}: {
  workspaces: AdminWorkspace[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`/admin/workspaces?${params.toString()}`);
    },
    [router, searchParams],
  );

  const updateSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("page");
      router.push(`/admin/workspaces?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Cada comercio debe tener su propio espacio de trabajo. {total} workspace{total !== 1 ? "s" : ""}.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateSearch(String(fd.get("q") || ""));
        }}
      >
        <input
          name="q"
          defaultValue={searchParams.get("q") || ""}
          placeholder="Buscar por nombre o slug..."
          className="h-10 w-full max-w-md rounded-xl border border-border/60 bg-card/50 px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
        />
      </form>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No se encontraron workspaces</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchParams.get("q") ? "Probá cambiando la búsqueda" : "Aún no hay workspaces creados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    <Link href={`/admin/workspaces/${workspace.id}`} className="hover:text-primary transition-colors">
                      {workspace.name}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{workspace.slug}</p>
                </div>
                <Badge tone="default">{workspace._count.members} miembros</Badge>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Metric label="Productos" value={workspace._count.products} />
                  <Metric label="Proveedores" value={workspace._count.suppliers} />
                  <Metric label="Órdenes" value={workspace._count.orders} />
                  <Metric label="Alertas" value={workspace._count.alerts} />
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Miembros principales</p>
                  {workspace.members.map((member) => (
                    <div className="flex justify-between rounded-md bg-muted p-2" key={member.id}>
                      <span>{member.user.email}</span>
                      <span className="font-semibold">{member.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </div>
      )}
    </div>
  );
}
