import { ArrowUpRight, Boxes, ClipboardList, Siren, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPotentialSavings,
  getProductsForDashboard,
  getPurchaseOrdersForDashboard,
  getReorderRisksForDashboard,
} from "@/lib/data/inventory";
import { getCurrentUser } from "@/lib/auth";
import { moneyFormatter } from "@/lib/mock-data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const workspaceId = user?.workspaceId ?? null;
  const [products, purchaseOrders, reorderRisks, potentialSavings] = await Promise.all([
    getProductsForDashboard(workspaceId),
    getPurchaseOrdersForDashboard(workspaceId),
    getReorderRisksForDashboard(workspaceId),
    getPotentialSavings(workspaceId),
  ]);
  const stagnantSince = new Date("2026-04-20");
  const stagnantProducts = products.filter(
    (product) => product.lastSale !== "-" && new Date(product.lastSale) < stagnantSince,
  );
  const criticalProducts = reorderRisks.filter((item) => item.urgency === "Critica");
  const criticalCount = criticalProducts.length;
  const pendingOrders = purchaseOrders.filter((order) => !["Recibida", "RECEIVED"].includes(order.status)).length;

  const kpis = [
    {
      title: "Riesgo critico",
      value: String(criticalCount),
      subtitle: "productos requieren compra hoy",
      icon: Siren,
      iconColor: "text-danger",
      iconBg: "from-red-500 to-rose-600",
      iconBgLight: "bg-danger-light",
      accent: "border-danger/20",
    },
    {
      title: "Ordenes pendientes",
      value: String(pendingOrders),
      subtitle: "borradores o enviadas",
      icon: ClipboardList,
      iconColor: "text-warning",
      iconBg: "from-amber-500 to-orange-600",
      iconBgLight: "bg-warning-light",
      accent: "border-warning/20",
    },
    {
      title: "Stock estancado",
      value: String(stagnantProducts.length),
      subtitle: "sin ventas recientes",
      icon: Boxes,
      iconColor: "text-muted-foreground",
      iconBg: "from-slate-500 to-gray-600",
      iconBgLight: "bg-muted",
      accent: "border-border",
    },
    {
      title: "Ahorro potencial",
      value: moneyFormatter.format(potentialSavings),
      subtitle: "seleccion de proveedor",
      icon: TrendingUp,
      iconColor: "text-success",
      iconBg: "from-emerald-500 to-green-600",
      iconBgLight: "bg-success-light",
      accent: "border-success/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <Badge className="w-fit" tone="success">Motor de reabastecimiento activo</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de control</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Vista central para priorizar agotamientos, ordenes de compra y productos que necesitan decision.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className={`card-hover border ${kpi.accent} overflow-hidden`}>
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.title}</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight">{kpi.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{kpi.subtitle}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.iconBg} shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className={`h-1 ${kpi.iconBg.replace("from-", "bg-gradient-to-r from-").replace("to-", "to-")}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-4 w-4 text-danger" />
                  Proximos agotamientos
                </CardTitle>
                <CardDescription>Productos en riesgo de quedarse sin stock segun el ritmo de ventas actual.</CardDescription>
              </div>
              {reorderRisks.length > 0 && (
                <Badge tone="danger">{reorderRisks.length} en riesgo</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reorderRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light">
                  <TrendingUp className="h-7 w-7 text-success" />
                </div>
                <p className="text-sm font-semibold">Todo en orden</p>
                <p className="text-xs text-muted-foreground mt-1">No hay productos en riesgo de agotamiento.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Producto</th>
                      <th className="text-left">Stock</th>
                      <th className="text-left">Burn rate</th>
                      <th className="text-left">Dias</th>
                      <th className="text-left">Proveedor</th>
                      <th className="text-left">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderRisks.map((item) => (
                      <tr key={item.sku}>
                        <td>
                          <p className="font-semibold">{item.product}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        </td>
                        <td>
                          <span className={`inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-bold ${
                            item.stock <= 10 ? "bg-danger-light text-danger" : "bg-muted text-foreground"
                          }`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="text-sm">{item.burnRate}/dia</td>
                        <td>
                          <Badge tone={item.daysRemaining <= 7 ? "danger" : item.daysRemaining <= 14 ? "warning" : "muted"}>
                            {item.daysRemaining}d
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground">{item.supplier}</td>
                        <td>
                          <Badge tone={item.urgency === "Critica" ? "danger" : "warning"}>
                            {item.urgency === "Critica" && <span className="mr-1">🔴</span>}
                            Comprar {item.suggestedQty}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              Acciones recomendadas
            </CardTitle>
            <CardDescription>Tareas prioritarias segun el estado actual del inventario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              ...(criticalCount > 0
                ? [{
                    text: `Comprar urgente: ${criticalProducts.map((p) => p.product).slice(0, 2).join(", ")}${criticalProducts.length > 2 ? ` y ${criticalProducts.length - 2} mas` : ""}`,
                    done: false,
                  }]
                : [{ text: "Sin riesgo critico de desabastecimiento", done: true }]
              ),
              ...(stagnantProducts.length > 0
                ? [{ text: `Revisar ${stagnantProducts.length} producto${stagnantProducts.length !== 1 ? "s" : ""} sin ventas recientes`, done: false }]
                : [{ text: "Todo el stock tiene rotacion activa", done: true }]
              ),
              ...(pendingOrders > 0
                ? [{ text: `Dar seguimiento a ${pendingOrders} orden${pendingOrders !== 1 ? "es" : ""} de compa pendiente${pendingOrders !== 1 ? "s" : ""}`, done: false }]
                : [{ text: "Ordenes de compa al dia", done: true }]
              ),
              { text: "Revisar catalogo de proveedores para optimizar costos", done: false },
              { text: "Exportar inventario como respaldo", done: false },
            ].map((item, i) => (
              <div
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                  item.done ? "border-success/20 bg-success-light/30" : "border-border"
                }`}
                key={i}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  item.done ? "bg-success text-white" : "bg-primary-light"
                }`}>
                  {item.done ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  )}
                </div>
                <p className={`text-sm ${item.done ? "text-success line-through" : ""}`}>{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
