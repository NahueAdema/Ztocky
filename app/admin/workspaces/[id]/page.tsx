import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Building2,
  ClipboardList,
  Factory,
  Siren,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspaceDetail } from "@/lib/data/admin";

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getWorkspaceDetail(id);
  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/workspaces" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a workspaces
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
          <p className="text-sm text-muted-foreground">{workspace.slug}</p>
        </div>
        <Badge tone="default">{workspace._count.members} miembros</Badge>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Productos" value={workspace._count.products} icon={Boxes} />
        <Metric label="Proveedores" value={workspace._count.suppliers} icon={Factory} />
        <Metric label="Órdenes de compra" value={workspace._count.orders} icon={ClipboardList} />
        <Metric label="Ventas" value={workspace._count.sales} icon={ShoppingCart} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({workspace.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {workspace.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay miembros.</p>
            ) : (
              <div className="space-y-2">
                {workspace.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                    <Badge tone={member.role === "OWNER" ? "success" : member.role === "ADMIN" ? "accent" : "muted"}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Clientes</span>
              <span className="font-medium">{workspace._count.customers}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Alertas activas</span>
              <span className="font-medium">{workspace._count.alerts}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Creado</span>
              <span className="font-medium">{workspace.createdAt.toISOString().slice(0, 10)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Última actualización</span>
              <span className="font-medium">{workspace.updatedAt.toISOString().slice(0, 10)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos recientes ({workspace.products.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workspace.products.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No hay productos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-medium">Nombre</th>
                    <th className="py-3 px-4 font-medium">SKU</th>
                    <th className="py-3 px-4 font-medium">Stock</th>
                    <th className="py-3 px-4 font-medium">Categoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workspace.products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{product.sku}</td>
                      <td className="py-3 px-4">
                        <Badge tone={product.currentStock <= 0 ? "danger" : product.currentStock <= 5 ? "warning" : "success"}>
                          {product.currentStock}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{product.category || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas activas ({workspace.alerts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workspace.alerts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No hay alertas activas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-medium">Tipo</th>
                    <th className="py-3 px-4 font-medium">Mensaje</th>
                    <th className="py-3 px-4 font-medium">Creada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workspace.alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <Badge tone={alert.type === "CRITICAL_STOCK" ? "danger" : alert.type === "LOW_STOCK" ? "warning" : "muted"}>
                          {alert.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{alert.message}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {alert.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
