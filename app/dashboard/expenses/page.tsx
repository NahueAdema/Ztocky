"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";
import { Pencil, Plus, ReceiptText, Trash2, TrendingDown, TrendingUp, Wallet, BarChart3, Lock, History } from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  recurring: boolean;
  paymentMethod: string;
  taxRate: number;
  notes: string | null;
};

type CloseRecord = {
  id: string;
  month: string;
  revenue: number;
  manualExpenses: number;
  purchases: number;
  netProfit: number;
  closedAt: string;
};

type Report = {
  month: string;
  previousMonth: string;
  current: {
    revenue: number;
    purchasesTotal: number;
    manualTotal: number;
    expensesTotal: number;
    netProfit: number;
    byCategory: Record<string, number>;
  };
  previous: {
    revenue: number;
    purchasesTotal: number;
    manualTotal: number;
    expensesTotal: number;
    netProfit: number;
  };
  variance: {
    revenue: number | null;
    expenses: number | null;
    profit: number | null;
  };
  tax: { deductible: number };
  closed: boolean;
  close: { revenue: number; netProfit: number } | null;
};

type TrendPoint = {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
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

const CATEGORY_TONES: Record<string, "muted" | "warning" | "success" | "danger" | "default"> = {
  RENT: "default", PAYROLL: "default", SERVICES: "warning",
  SUPPLIES: "default", MARKETING: "default", TRANSPORT: "default",
  TAXES: "danger", OTHER: "muted",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function amountBase(total: number, rate: number) {
  if (rate <= 0) return total;
  return total / (1 + rate / 100);
}

function amountTax(total: number, rate: number) {
  if (rate <= 0) return 0;
  return total - amountBase(total, rate);
}

function formatRate(rate: number) {
  return `${rate % 1 === 0 ? rate : rate.toFixed(1)}%`;
}

export default function ExpensesPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closes, setCloses] = useState<CloseRecord[]>([]);
  const [showCloses, setShowCloses] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    category: "OTHER",
    description: "",
    date: "",
    recurring: false,
    paymentMethod: "CASH",
    taxRate: 0,
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, repRes, closeRes, trendRes] = await Promise.all([
        fetch(`/api/dashboard/expenses?month=${month}`),
        fetch(`/api/dashboard/expenses/report?month=${month}`),
        fetch(`/api/dashboard/expenses/close`),
        fetch(`/api/dashboard/expenses/trend`),
      ]);
      if (expRes.ok) setExpenses((await expRes.json()).expenses ?? []);
      if (repRes.ok) setReport(await repRes.json());
      if (closeRes.ok) {
        const c = await closeRes.json();
        setCloses(c.closes ?? []);
      }
      if (trendRes.ok) {
        const t = await trendRes.json();
        setTrend(t.trend ?? []);
      }
    } catch {
      toast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }, [month, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openNew = () => {
    if (isClosed) return;
    setEditing(null);
    setForm({
      amount: "",
      category: "OTHER",
      description: "",
      date: `${month}-01`,
      recurring: false,
      paymentMethod: "CASH",
      taxRate: 0,
      notes: "",
    });
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    if (isClosed) return;
    setEditing(e);
    setForm({
      amount: String(e.amount),
      category: e.category,
      description: e.description,
      date: e.date.slice(0, 10),
      recurring: e.recurring,
      paymentMethod: e.paymentMethod,
      taxRate: e.taxRate,
      notes: e.notes ?? "",
    });
    setShowModal(true);
  };

  const submit = async () => {
    if (isClosed) {
      toast("Este mes está cerrado y no puede modificarse", "error");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Ingresá un monto válido", "error");
      return;
    }
    setSaving(true);
    const payload = { ...form, amount };
    try {
      const res = await fetch(
        editing ? `/api/dashboard/expenses/${editing.id}` : "/api/dashboard/expenses",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        toast(editing ? "Gasto actualizado" : "Gasto registrado", "success");
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "Error al guardar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: Expense) => {
    if (!confirm(`¿Eliminar el gasto "${e.description || "sin descripción"}"?`)) return;
    try {
      const res = await fetch(`/api/dashboard/expenses/${e.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Gasto eliminado", "success");
        fetchData();
      } else {
        toast("Error al eliminar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    }
  };

  const current = report?.current;
  const variance = report?.variance;
  const isClosed = report?.closed ?? false;

  const closeCurrentMonth = async () => {
    if (!confirm(`¿Cerrar el mes ${month}? Esto congela el resultado del mes y bloquea su edición.`)) return;
    setClosing(true);
    try {
      const res = await fetch("/api/dashboard/expenses/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (res.ok) {
        toast(`Mes ${month} cerrado`, "success");
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "Error al cerrar el mes", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">Control de egresos del negocio: gastos manuales, compras y comparación mensual.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          {isClosed ? (
            <Badge tone="warning" className="h-8 px-3">
              <Lock className="h-3.5 w-3.5 mr-1.5" /> Mes cerrado
            </Badge>
          ) : (
            <Button variant="secondary" onClick={closeCurrentMonth} disabled={closing}>
              <Lock className="h-4 w-4" />
              {closing ? "Cerrando..." : "Cerrar mes"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setShowCloses((s) => !s)}>
            <History className="h-4 w-4" />
            {showCloses ? "Ocultar cierres" : "Cierres"}
          </Button>
          <Button onClick={openNew} disabled={isClosed} title={isClosed ? "Este mes está cerrado" : ""}>
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Button>
        </div>
      </div>

      {showCloses && (
        <Card className="card-hover border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" />
              Cierres mensuales
            </CardTitle>
            <CardDescription>Resultados archivados de meses cerrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {closes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Todavía no hay meses cerrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Mes</th>
                      <th className="py-2 pr-4">Ingresos</th>
                      <th className="py-2 pr-4">Gastos manuales</th>
                      <th className="py-2 pr-4">Compras</th>
                      <th className="py-2 pr-4">Ganancia neta</th>
                      <th className="py-2 pr-4">Cerrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closes.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{c.month}</td>
                        <td className="py-2.5 pr-4">{moneyFormatter.format(c.revenue)}</td>
                        <td className="py-2.5 pr-4">{moneyFormatter.format(c.manualExpenses)}</td>
                        <td className="py-2.5 pr-4">{moneyFormatter.format(c.purchases)}</td>
                        <td className={`py-2.5 pr-4 font-medium ${c.netProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {moneyFormatter.format(c.netProfit)}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(c.closedAt).toLocaleDateString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Métricas del mes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          tone="success"
          label={`Ingresos (ventas) - ${month}`}
          value={current?.revenue ?? 0}
          variance={variance?.revenue}
        />
        <MetricCard
          icon={Wallet}
          tone="default"
          label="Gastos manuales"
          value={current?.manualTotal ?? 0}
        />
        <MetricCard
          icon={TrendingDown}
          tone="warning"
          label="Compras a proveedores"
          value={current?.purchasesTotal ?? 0}
        />
        <MetricCard
          icon={BarChart3}
          tone={current?.netProfit !== undefined && current.netProfit < 0 ? "danger" : "success"}
          label="Ganancia neta"
          value={current?.netProfit ?? 0}
          variance={variance?.profit}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Lista de gastos manuales ── */}
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ReceiptText className="h-4 w-4 text-primary" />
              </div>
              Gastos del mes
            </CardTitle>
            <CardDescription>
              Total gastos manuales: {moneyFormatter.format(current?.manualTotal ?? 0)}
              {isClosed && <span className="text-warning"> · Mes cerrado, solo lectura</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
            ) : expenses.length === 0 ? (
              <>
                <EmptyState
                  icon={ReceiptText}
                  title="Sin gastos este mes"
                  description="Registrá tus gastos para llevar el control mensual."
                />
                <div className="mt-2 flex justify-center">
                  <Button onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Registrar gasto
                  </Button>
                </div>
              </>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Descripción</th>
                      <th className="py-2 pr-4">Categoría</th>
                      <th className="py-2 pr-4">Monto</th>
                      <th className="py-2 pr-4">IVA</th>
                      <th className="py-2 pr-4">Pago</th>
                      <th className="py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                          {new Date(e.date).toLocaleDateString("es-AR")}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="font-medium">{e.description || "—"}</div>
                          {e.recurring && <Badge tone="warning">Recurrente</Badge>}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge tone={CATEGORY_TONES[e.category] ?? "default"}>
                            {CATEGORY_LABELS[e.category] ?? e.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 font-medium">
                          {moneyFormatter.format(e.amount)}
                          {e.taxRate > 0 && (
                            <div className="text-[11px] font-normal text-muted-foreground">
                              {moneyFormatter.format(amountBase(e.amount, e.taxRate))} + {moneyFormatter.format(amountTax(e.amount, e.taxRate))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {e.taxRate > 0 ? (
                            <Badge tone="default">{formatRate(e.taxRate)}</Badge>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod}</td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <Button variant="ghost" className="h-8" onClick={() => openEdit(e)} disabled={isClosed} title={isClosed ? "Mes cerrado" : ""}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" className="h-8" onClick={() => remove(e)} disabled={isClosed} title={isClosed ? "Mes cerrado" : ""}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Por categoría ── */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              Por categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!current || Object.keys(current.byCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin gastos manuales este mes.</p>
            ) : (
              CATEGORIES.map((cat) => {
                const value = current.byCategory[cat];
                if (!value) return null;
                const total = current.manualTotal || 1;
                const pct = (value / total) * 100;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{CATEGORY_LABELS[cat]}</span>
                      <span className="font-medium">{moneyFormatter.format(value)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            {current && (
              <div className="pt-2 border-t border-border space-y-1.5">
                {report?.tax?.deductible > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">IVA deducible del mes</span>
                    <span className="font-medium">{moneyFormatter.format(report.tax.deductible)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total egresos (manuales + compras)</span>
                  <span className="font-semibold">{moneyFormatter.format(current.expensesTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tendencia 6 meses (A4) ── */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Tendencia de 6 meses
          </CardTitle>
          <CardDescription>Ingresos por ventas vs. egresos por mes.</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin datos para mostrar.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2 h-40">
                {trend.map((point, i) => {
                  const max = Math.max(...trend.map((t) => Math.max(t.revenue, t.expenses)), 1);
                  const isLast = i === trend.length - 1;
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

      {/* ── Modal crear/editar ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Editar gasto" : "Nuevo gasto"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Monto * <span className="text-muted-foreground font-normal">(total, IVA incluido)</span></label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">IVA</label>
                <select
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                >
                  <option value={0}>Sin IVA (0%)</option>
                  <option value={10.5}>10.5%</option>
                  <option value={21}>21%</option>
                  <option value={27}>27%</option>
                </select>
                {form.taxRate > 0 && Number(form.amount) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Desglose: {moneyFormatter.format(amountBase(Number(form.amount), form.taxRate))} (base) +{" "}
                    {moneyFormatter.format(amountTax(Number(form.amount), form.taxRate))} (IVA)
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Descripción *</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Alquiler local, sueldos, luz..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Método de pago</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.recurring}
                      onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Gasto mensual recurrente
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Detalle opcional"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  variance,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
  variance?: number | null;
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
        <p className={`mt-2 text-2xl font-bold ${toneColor}`}>{moneyFormatter.format(value)}</p>
        {variance != null && (
          <p className={`mt-1 text-xs ${variance >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {variance >= 0 ? "▲" : "▼"} {variance.toFixed(1)}% vs. mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
