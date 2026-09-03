"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { moneyFormatter } from "@/lib/format";
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, ReceiptText, ShoppingCart,
  Percent, ArrowUpRight, ArrowDownRight, Landmark, CreditCard, MoveRight, Lock,
} from "lucide-react";

type FinanceOverview = {
  revenue: number;
  transactionCount: number;
  averageTicket: number;
  purchasesTotal: number;
  manualTotal: number;
  expensesTotal: number;
  netProfit: number;
  margin: number;
  revenueByMethod: Record<string, number>;
  expensesByCategory: Record<string, number>;
  expensesByPayment: Record<string, number>;
};

type TrendPoint = {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
};

type FinanzasRes = {
  month: string;
  previousMonth: string;
  current: FinanceOverview;
  previous: FinanceOverview;
  closed: boolean;
  trend: TrendPoint[];
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  ACCOUNT: "Cuenta corriente",
};

const CATEGORY_LABELS: Record<string, string> = {
  RENT: "Alquiler",
  PAYROLL: "Sueldos",
  SERVICES: "Servicios",
  SUPPLIES: "Insumos",
  MARKETING: "Marketing",
  TRANSPORT: "Transporte",
  TAXES: "Impuestos",
  OTHER: "Otros",
};

const EXPENSE_PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export default function FinanzasPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<FinanzasRes | null>(null);
  const [_loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/finanzas?month=${month}`);
      if (res.ok) setData(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const current = data?.current;
  const previous = data?.previous;

  const pct = (cur: number, prev: number) => {
    if (!prev) return null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  };

  const revenueVar = pct(current?.revenue ?? 0, previous?.revenue ?? 0);
  const expenseVar = pct(current?.expensesTotal ?? 0, previous?.expensesTotal ?? 0);
  const profitVar = pct(current?.netProfit ?? 0, previous?.netProfit ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title text-3xl font-bold tracking-tight">Panel financiero</h1>
          <p className="text-sm text-muted-foreground">
            Visión unificada de ingresos, egresos y ganancia del negocio por mes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <Link
            href="/dashboard/expenses"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted/60"
          >
            <ReceiptText className="h-4 w-4" />
            Ver gastos
          </Link>
        </div>
      </div>

      {data?.closed && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning-light/40 p-3 text-sm">
          <Lock className="h-4 w-4 text-warning" />
          <span>
            {monthLabel(month)} está <strong>cerrado</strong> (inmutable).
          </span>
        </div>
      )}

      {/* ── Métricas clave ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          tone="success"
          label={`Ingresos - ${monthLabel(month)}`}
          value={current?.revenue ?? 0}
          variance={revenueVar}
        />
        <MetricCard
          icon={TrendingDown}
          tone="warning"
          label="Egresos totales"
          value={current?.expensesTotal ?? 0}
          variance={expenseVar}
        />
        <MetricCard
          icon={BarChart3}
          tone={current && current.netProfit < 0 ? "danger" : "success"}
          label="Ganancia neta"
          value={current?.netProfit ?? 0}
          variance={profitVar}
        />
        <MetricCard
          icon={Percent}
          tone="default"
          label="Margen sobre venta"
          value={current?.margin ?? 0}
          isPercent
        />
      </div>

      {/* ── Desglose: métodos de pago + ticket promedio ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Cobros por método
            </CardTitle>
            <CardDescription>
              {current?.transactionCount ?? 0} ventas · Ticket promedio {current ? moneyFormatter.format(current.averageTicket) : "$0"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {current && current.revenue > 0 ? (
              Object.entries(current.revenueByMethod)
                .sort((a, b) => b[1] - a[1])
                .map(([method, amount]) => {
                  const total = current.revenue || 1;
                  const p = (amount / total) * 100;
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <MethodIcon method={method} />
                          {PAYMENT_LABELS[method] ?? method}
                        </span>
                        <span className="font-medium">{moneyFormatter.format(amount)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, p)}%` }} />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin ventas este mes.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Egresos por categoría ── */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Egresos por categoría
            </CardTitle>
            <CardDescription>Gastos manuales + compras: {current ? moneyFormatter.format(current.expensesTotal) : "$0"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {current &&
            (Object.keys(current.expensesByCategory).length > 0 || current.purchasesTotal > 0) ? (
              <>
                {Object.entries(current.expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const total = current.expensesTotal || 1;
                    const p = (amount / total) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm">
                          <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                          <span className="font-medium">{moneyFormatter.format(amount)}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, p)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                {current.purchasesTotal > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Compras a proveedores</span>
                      <span className="font-medium">{moneyFormatter.format(current.purchasesTotal)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${Math.min(100, (current.purchasesTotal / (current.expensesTotal || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin egresos este mes.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Egresos por método de pago ── */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Gastos por método
            </CardTitle>
            <CardDescription>
              Manuales: {current ? moneyFormatter.format(current.manualTotal) : "$0"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {current && Object.keys(current.expensesByPayment).length > 0 ? (
              Object.entries(current.expensesByPayment)
                .sort((a, b) => b[1] - a[1])
                .map(([method, amount]) => {
                  const total = current.manualTotal || 1;
                  const p = (amount / total) * 100;
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{EXPENSE_PAYMENT_LABELS[method] ?? method}</span>
                        <span className="font-medium">{moneyFormatter.format(amount)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, p)}%` }} />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin gastos manuales este mes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tendencia 6 meses ── */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Tendencia de 6 meses
          </CardTitle>
          <CardDescription>Ingresos vs. egresos por mes.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin datos para mostrar.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2 h-40">
                {data.trend.map((point, i) => {
                  const max = Math.max(...data.trend.map((t) => Math.max(t.revenue, t.expenses)), 1);
                  const isLast = i === data.trend.length - 1;
                  const d = new Date(point.month + "-01");
                  const label = d.toLocaleDateString("es-AR", { month: "short" });
                  return (
                    <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end gap-0.5 h-32">
                        <div
                          className={`w-3/5 rounded-t-md ${isLast ? "bg-primary" : "bg-primary/40"}`}
                          style={{ height: point.revenue > 0 ? `${Math.max((point.revenue / max) * 50, 3)}%` : "3px" }}
                          title={`Ingresos: ${moneyFormatter.format(point.revenue)}`}
                        />
                        <div
                          className={`w-3/5 rounded-b-md ${isLast ? "bg-destructive/70" : "bg-destructive/40"}`}
                          style={{ height: point.expenses > 0 ? `${Math.max((point.expenses / max) * 50, 3)}%` : "3px" }}
                          title={`Egresos: ${moneyFormatter.format(point.expenses)}`}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${isLast ? "text-primary" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-destructive/70" /> Egresos
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MethodIcon({ method }: { method: string }) {
  const cls = "h-4 w-4";
  if (method === "CASH") return <Wallet className={`${cls} text-emerald-600`} />;
  if (method === "CARD") return <CreditCard className={`${cls} text-sky-600`} />;
  if (method === "TRANSFER") return <Landmark className={`${cls} text-indigo-600`} />;
  return <MoveRight className={`${cls} text-muted-foreground`} />;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  variance,
  isPercent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
  variance?: number | null;
  isPercent?: boolean;
}) {
  const toneColor = {
    default: "text-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-destructive",
  }[tone];

  return (
    <Card className="card-hover">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ${toneColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={`mt-2 text-2xl font-bold ${toneColor}`}>
          {isPercent ? `${value.toFixed(1)}%` : moneyFormatter.format(value)}
        </p>
        {variance != null && (
          <p className={`mt-1 text-xs ${variance >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {variance >= 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
            {" "}{variance.toFixed(1)}% vs. mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
