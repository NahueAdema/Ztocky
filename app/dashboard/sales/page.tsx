"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileUp,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Pencil,
  DollarSign,
  Package,
  Hash,
} from "lucide-react";

type Sale = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  saleDate: string;
  unitPrice: number;
  totalAmount: number;
};
type ProductOption = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
};
type SaleForm = {
  productId: string;
  quantity: string;
  saleDate: string;
  unitPrice: string;
};

const emptyForm: SaleForm = {
  productId: "",
  quantity: "1",
  saleDate: new Date().toISOString().slice(0, 10),
  unitPrice: "0",
};

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form, setForm] = useState<SaleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{
    created: number;
    total: number;
    errors?: string[];
  } | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes] = await Promise.all([
        fetch("/api/dashboard/sales"),
        fetch("/api/dashboard/products"),
      ]);
      if (salesRes.ok) setSales((await salesRes.json()).sales);
      if (productsRes.ok) setProducts((await productsRes.json()).products);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingSale(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };
  const openEdit = (s: Sale) => {
    setEditingSale(s);
    setForm({
      productId: s.productId,
      quantity: String(s.quantity),
      saleDate: s.saleDate,
      unitPrice: String(s.unitPrice),
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.productId) {
      setError("Seleccionar un producto");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editingSale
        ? `/api/dashboard/sales/${editingSale.id}`
        : "/api/dashboard/sales";
      const res = await fetch(url, {
        method: editingSale ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      if (!editingSale && data.newStock !== undefined) {
        const product = products.find((p) => p.id === form.productId);
        setSuccessMsg(
          `Venta registrada. Stock de ${product?.name ?? "producto"}: ${data.newStock} unidades`,
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
      setShowModal(false);
      fetchData();
    } catch {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta venta?")) return;
    try {
      const res = await fetch(`/api/dashboard/sales/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const handleExport = () => {
    const headers = [
      "Producto",
      "SKU",
      "Cantidad",
      "Fecha",
      "Precio Unitario",
      "Total",
    ];
    const rows = sales.map((s) => [
      s.productName,
      s.productSku,
      s.quantity,
      s.saleDate,
      s.unitPrice,
      s.totalAmount,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImportResult(null);
    const lines = importText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) {
      setImportResult({ created: 0, total: 0, errors: ["Formato invalido."] });
      return;
    }
    const header = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const records = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const record: Record<string, string> = {};
      header.forEach((h, i) => {
        record[h] = values[i] ?? "";
      });
      return record;
    });
    try {
      const res = await fetch("/api/dashboard/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sales", records }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.created > 0) fetchData();
    } catch {
      setImportResult({
        created: 0,
        total: records.length,
        errors: ["Error de conexion"],
      });
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
  const filtered = sales.filter(
    (s) =>
      s.productName.toLowerCase().includes(search.toLowerCase()) ||
      s.productSku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ventas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro historico para burn rate y proyecciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setImportText("");
              setImportResult(null);
              setShowImportModal(true);
            }}
          >
            <FileUp className="h-4 w-4" />
            Importar
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-success/20 bg-success-light/50 p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success text-white">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-success">{successMsg}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Total ventas",
            value: moneyFormatter.format(totalRevenue),
            icon: DollarSign,
            color: "from-primary to-primary-dark",
          },
          {
            label: "Unidades vendidas",
            value: totalUnits,
            icon: Package,
            color: "from-sky-500 to-blue-600",
          },
          {
            label: "Transacciones",
            value: sales.length,
            icon: Hash,
            color: "from-indigo-500 to-violet-600",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`card-hover ${stat.label === "Transacciones" ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white`}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle>Historial de ventas</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">
                Cargando ventas...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <ShoppingCart className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">
                {search ? "Sin resultados." : "No hay ventas registradas"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? "Intenta con otros terminos."
                  : "Crear una nueva o importar desde CSV."}
              </p>
            </div>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-border">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Producto</th>
                      <th className="text-left">Cantidad</th>
                      <th className="text-left">Fecha</th>
                      <th className="text-left">Precio unit.</th>
                      <th className="text-left">Total</th>
                      <th className="text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <p className="font-semibold">{sale.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {sale.productSku}
                          </p>
                        </td>
                        <td>
                          <span className="inline-flex h-7 items-center justify-center rounded-md bg-accent-soft px-2.5 text-xs font-bold text-accent-foreground">
                            {sale.quantity} uds
                          </span>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {sale.saleDate}
                        </td>
                        <td className="text-sm">
                          {moneyFormatter.format(sale.unitPrice)}
                        </td>
                        <td className="text-sm font-bold">
                          {moneyFormatter.format(sale.totalAmount)}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(sale)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(sale.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filtered.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {sale.productName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {sale.productSku} · {sale.saleDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(sale)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(sale.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Cantidad
                        </p>
                        <p className="text-xs font-bold">{sale.quantity} uds</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Precio unit.
                        </p>
                        <p className="text-xs font-semibold">
                          {moneyFormatter.format(sale.unitPrice)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Total
                        </p>
                        <p className="text-xs font-bold">
                          {moneyFormatter.format(sale.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal venta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingSale ? "Editar venta" : "Nueva venta"}
            </h2>
            {error && (
              <div className="mb-4 rounded-lg bg-danger-light p-3 text-sm text-danger">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Producto *</label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={form.productId}
                  onChange={(e) => {
                    const product = products.find(
                      (p) => p.id === e.target.value,
                    );
                    setForm({
                      ...form,
                      productId: e.target.value,
                      unitPrice: product
                        ? String(product.sellingPrice)
                        : form.unitPrice,
                    });
                  }}
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={form.saleDate}
                    onChange={(e) =>
                      setForm({ ...form, saleDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Precio unitario</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                />
              </div>
              {form.quantity && form.unitPrice && (
                <div className="rounded-lg bg-primary-light p-3">
                  <p className="text-xs text-muted-foreground">
                    Total de la venta
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {moneyFormatter.format(
                      Number(form.quantity) * Number(form.unitPrice),
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.productId}>
                {saving
                  ? "Guardando..."
                  : editingSale
                    ? "Guardar cambios"
                    : "Registrar venta"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-2">
              Importar ventas desde CSV
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Columnas: sku, quantity, saleDate, unitPrice
            </p>
            <textarea
              className="w-full h-36 rounded-xl border border-border bg-card p-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`sku,quantity,saleDate,unitPrice\nCAF-001,5,2026-05-19,11800`}
            />
            {importResult && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                <p>
                  Importadas:{" "}
                  <span className="font-bold">{importResult.created}</span> /{" "}
                  {importResult.total}
                </p>
                {importResult.errors?.map((e, i) => (
                  <p key={i} className="text-danger mt-1">
                    {e}
                  </p>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>
                Cerrar
              </Button>
              <Button onClick={handleImport} disabled={!importText.trim()}>
                Importar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
