import { ArrowUpRight, ArrowDownRight, Boxes, ClipboardList, Siren, TrendingUp, ShoppingCart, Clock, Package, Zap, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPotentialSavings,
  getProductsForDashboard,
  getPurchaseOrdersForDashboard,
  getReorderRisksForDashboard,
  getTodayStats,
  getTopProducts,
  getWeeklySales,
} from "@/lib/data/inventory";
import { getCurrentUser } from "@/lib/auth";
import { moneyFormatter } from "@/lib/mock-data";

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const workspaceId = user?.workspaceId ?? null;

  const [products, purchaseOrders, reorderRisks, potentialSavings, todayStats, topProducts, weeklySales] = await Promise.all([
    getProductsForDashboard(workspaceId),
    getPurchaseOrdersForDashboard(workspaceId),
    getReorderRisksForDashboard(workspaceId),
    getPotentialSavings(workspaceId),
    getTodayStats(workspaceId),
    getTopProducts(workspaceId),
    getWeeklySales(workspaceId),
  ]);

  const stagnantSince = new Date("2026-04-20");
  const stagnantProducts = products.filter(
    (product) => product.lastSale !== "-" && new Date(product.lastSale) < stagnantSince,
  );
  const criticalProducts = reorderRisks.filter((item) => item.urgency === "Critica");
  const criticalCount = criticalProducts.length;
  const pendingOrders = purchaseOrders.filter((order) => !["Recibida", "RECEIVED"].includes(order.status)).length;

  const maxDailyRevenue = Math.max(...weeklySales.map((d) => d.revenue), 1);

  const kpis = [
    {
      title: "Riesgo critico",
      value: String(criticalCount),
      subtitle: criticalCount > 0 ? `${criticalCount} producto${criticalCount > 1 ? "s" : ""} necesita compra urgente` : "Todo abastecido",
      icon: Siren,
      trend: 0,
      iconBg: "from-red-500 to-rose-600",
      accent: "border-danger/20",
      urgent: criticalCount > 0,
    },
    {
      title: "Ordenes pendientes",
      value: String(pendingOrders),
      subtitle: pendingOrders > 0 ? `${pendingOrders} orden${pendingOrders > 1 ? "es" : ""} sin recibir` : "Todo al dia",
      icon: ClipboardList,
      trend: 0,
      iconBg: "from-amber-500 to-orange-600",
      accent: "border-warning/20",
      urgent: false,
    },
    {
      title: "Ventas semana",
      value: todayStats.transactions > 0 ? String(todayStats.units) : "0",
      subtitle: todayStats.transactions > 0 ? `${todayStats.transactions} transacciones` : "Sin ventas recientes",
      icon: ShoppingCart,
      trend: todayStats.unitsChange,
      iconBg: "from-blue-500 to-indigo-600",
      accent: "border-primary/20",
      urgent: false,
    },
    {
      title: "Ingresos semana",
      value: todayStats.revenue > 0 ? moneyFormatter.format(todayStats.revenue) : "$0",
      subtitle: todayStats.revenue > 0 ? "vs semana anterior" : "Esperando ventas",
      icon: TrendingUp,
      trend: todayStats.revenueChange,
      iconBg: "from-emerald-500 to-green-600",
      accent: "border-success/20",
      urgent: false,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <Badge className="w-fit" tone="success">Motor activo</Badge>
        </div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Panel de control</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Resumen de tu negocio en tiempo real. {user?.workspaceName && <span className="font-medium text-foreground">{user.workspaceName}</span>}
        </p>
      </div>

      {/* KPIs */}
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
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                        {kpi.trend !== 0 && <TrendBadge value={kpi.trend} />}
                      </div>
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

      {/* Gráfico de ventas + Top productos */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        {/* Gráfico semanal */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ventas de la semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklySales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <TrendingUp className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin datos de ventas</p>
                <p className="text-xs text-muted-foreground mt-1">Registra ventas para ver el grafico.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-2 h-32">
                  {weeklySales.map((day, i) => {
                    const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
                    const d = new Date(day.date);
                    const dayName = dayNames[d.getDay()];
                    const isToday = i === weeklySales.length - 1;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center justify-end h-24">
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${isToday ? "bg-primary" : "bg-primary/40"}`}
                            style={{
                              height: day.revenue > 0 ? `${Math.max((day.revenue / maxDailyRevenue) * 100, 8)}%` : "4px",
                            }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                          {dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                  <span>Total: <strong className="text-foreground">{moneyFormatter.format(weeklySales.reduce((s, d) => s + d.revenue, 0))}</strong></span>
                  <span>Promedio/dia: <strong className="text-foreground">{moneyFormatter.format(weeklySales.reduce((s, d) => s + d.revenue, 0) / 7)}</strong></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top productos */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Top productos (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin datos de ventas</p>
                <p className="text-xs text-muted-foreground mt-1">Los productos mas vendidos apareceran aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.sku} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <span className="text-xs font-semibold text-foreground shrink-0">{product.sold30d} uds</span>
                      </div>
                      <MiniBar value={product.sold30d} max={topProducts[0]?.sold30d ?? 1} />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {moneyFormatter.format(product.revenue30d)} · Stock: {product.stock}
                        {product.daysRemaining < 7 && (
                          <span className="text-danger ml-1">· Agota en {product.daysRemaining}d</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {topProducts.length > 5 && (
                  <a href="/dashboard/products" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1">
                    Ver todos los productos <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agotamientos + Últimas ventas */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        {/* Agotamientos */}
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-4 w-4 text-danger" />
                  Proximos agotamientos
                </CardTitle>
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
              <div className="space-y-2">
                {reorderRisks.slice(0, 5).map((item) => (
                  <div key={item.sku} className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        item.urgency === "Critica" ? "bg-danger-light" : "bg-warning-light"
                      }`}>
                        <Zap className={`h-5 w-5 ${item.urgency === "Critica" ? "text-danger" : "text-warning"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{item.product}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: <strong className={item.stock <= 10 ? "text-danger" : "text-foreground"}>{item.stock}</strong> · {item.burnRate}/dia · {item.supplier}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={item.daysRemaining <= 7 ? "danger" : "warning"}>
                        {item.daysRemaining}d
                      </Badge>
                      <a
                        href={`/dashboard/purchase-orders`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary/90"
                      >
                        Comprar
                      </a>
                    </div>
                  </div>
                ))}
                {reorderRisks.length > 5 && (
                  <a href="/dashboard/purchase-orders" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1">
                    Ver todas las alertas <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas ventas */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Ultimas ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayStats.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin ventas recientes</p>
                <p className="text-xs text-muted-foreground mt-1">Las ventas registradas apareceran aqui.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayStats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-muted/30">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-light">
                        <ShoppingCart className="h-5 w-5 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{sale.productName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{sale.productSku} · x{sale.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{moneyFormatter.format(sale.totalAmount)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(sale.time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <a href="/dashboard/sales" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1">
                  Ver todas las ventas <ChevronRight className="h-3 w-3" />
                  </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Acciones rapidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a href="/dashboard/products" className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary-light/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-center">Ver productos</span>
            </a>
            <a href="/dashboard/suppliers" className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary-light/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-center">Proveedores</span>
            </a>
            <a href="/dashboard/scan" className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary-light/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-center">Escanear</span>
            </a>
            <a href="/dashboard/simulator" className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary-light/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-center">Simulador</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
