"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, ITEMS_PER_PAGE } from "@/components/ui/pagination";
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
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
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
type ProductOption = { id: string; name: string; sku: string; sellingPrice: number };
type SaleForm = { productId: string; quantity: string; saleDate: string; unitPrice: string };
type ImportStatus = "idle" | "importing" | "done" | "error";

const emptyForm: SaleForm = {
  productId: "",
  quantity: "1",
  saleDate: new Date().toISOString().slice(0, 10),
  unitPrice: "0",
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const BATCH_SIZE = 50;

async function importBatch(url: string, batch: Record<string, string>[], type: string): Promise<{ created: number; errors: string[] }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, records: batch }),
  });
  const data = await res.json();
  return { created: data.created ?? 0, errors: data.errors ?? [] };
}

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
  const [importResult, setImportResult] = useState<{ created: number; total: number; errors?: string[] } | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [undoTarget, setUndoTarget] = useState<Sale | null>(null);
  const [undoing, setUndoing] = useState(false);

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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditingSale(null); setForm(emptyForm); setError(null); setShowModal(true); };
  const openEdit = (s: Sale) => {
    setEditingSale(s);
    setForm({ productId: s.productId, quantity: String(s.quantity), saleDate: s.saleDate, unitPrice: String(s.unitPrice) });
    setError(null); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.productId) { setError("Seleccionar un producto"); return; }
    setSaving(true); setError(null);
    try {
      const url = editingSale ? `/api/dashboard/sales/${editingSale.id}` : "/api/dashboard/sales";
      const res = await fetch(url, {
        method: editingSale ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      if (!editingSale && data.newStock !== undefined) {
        const product = products.find((p) => p.id === form.productId);
        setSuccessMsg(`Venta registrada. Stock de ${product?.name ?? "producto"}: ${data.newStock} unidades`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
      setShowModal(false); fetchData();
    } catch { setError("Error de conexion"); } finally { setSaving(false); }
  };

  const handleUndo = async () => {
    if (!undoTarget) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/dashboard/sales/${undoTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Venta revertida. Stock restaurado: ${data.restoredStock} unidades.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        setUndoTarget(null); fetchData();
      }
    } catch {} finally { setUndoing(false); }
  };

  const handleExport = () => {
    const headers = ["Producto", "SKU", "Cantidad", "Fecha", "Precio Unitario", "Total"];
    const rows = sales.map((s) => [s.productName, s.productSku, s.quantity, s.saleDate, s.unitPrice, s.totalAmount]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImportResult(null);
    const lines = importText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setImportResult({ created: 0, total: 0, errors: ["Formato invalido."] }); return; }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const records = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const record: Record<string, string> = {};
      header.forEach((h, i) => { record[h] = values[i] ?? ""; });
      return record;
    });

    setImportStatus("importing");
    setImportProgress(0);
    let totalCreated = 0;
    let allErrors: string[] = [];

    const batches: Record<string, string>[][] = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      batches.push(records.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      try {
        const result = await importBatch("/api/dashboard/import", batches[i], "sales");
        totalCreated += result.created;
        allErrors = allErrors.concat(result.errors);
      } catch {
        allErrors.push(`Error en lote ${i + 1}`);
      }
      setImportProgress(Math.round(((i + 1) / batches.length) * 100));
    }

    setImportStatus("done");
    setImportResult({ created: totalCreated, total: records.length, errors: allErrors.length > 0 ? allErrors : undefined });
    if (totalCreated > 0) fetchData();
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
  const filtered = sales.filter(
    (s) => s.productName.toLowerCase().includes(search.toLowerCase()) || s.productSku.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedSales = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registro historico para calcular velocidad de venta y proyecciones.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}><Download className="h-4 w-4" /> Exportar</Button>
          <Button variant="secondary" onClick={() => { setImportText(""); setImportResult(null); setImportStatus("idle"); setShowImportModal(true); }}>
            <FileUp className="h-4 w-4" /> Importar
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nueva venta</Button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-success/20 bg-success-light/50 p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success text-white"><ShoppingCart className="h-4 w-4" /></div>
          <p className="text-sm font-medium text-success">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total ventas", value: money.format(totalRevenue), icon: DollarSign, color: "from-primary to-primary-dark" },
          { label: "Unidades vendidas", value: totalUnits, icon: Package, color: "from-sky-500 to-blue-600" },
          { label: "Transacciones", value: sales.length, icon: Hash, color: "from-indigo-500 to-violet-600" },
        ].map((stat) => (
          <Card key={stat.label} className={`card-hover ${stat.label === "Transacciones" ? "col-span-2 sm:col-span-1" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white`}><stat.icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{stat.label}</p>
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
            <Input placeholder="Buscar por producto o SKU..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando ventas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><ShoppingCart className="h-8 w-8 text-primary" /></div>
              <p className="text-sm font-semibold text-foreground">{search ? "Sin resultados." : "No hay ventas registradas"}</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">{search ? "Intenta con otros terminos de busqueda." : "Registra una nueva venta o importa desde un archivo CSV."}</p>
            </div>
          ) : (
            <>
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
                    {paginatedSales.map((sale) => (
                      <tr key={sale.id}>
                        <td><p className="font-semibold">{sale.productName}</p><p className="text-xs text-muted-foreground font-mono">{sale.productSku}</p></td>
                        <td><span className="inline-flex h-7 items-center justify-center rounded-md bg-accent-soft px-2.5 text-xs font-bold text-accent-foreground">{sale.quantity} uds</span></td>
                        <td className="text-sm text-muted-foreground">{sale.saleDate}</td>
                        <td className="text-sm">{money.format(sale.unitPrice)}</td>
                        <td className="text-sm font-bold">{money.format(sale.totalAmount)}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(sale)} title="Editar venta" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setUndoTarget(sale)} title="Revertir venta" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning"><RotateCcw className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:hidden">
                {paginatedSales.map((sale) => (
                  <div key={sale.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-sm">{sale.productName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{sale.productSku} · {sale.saleDate}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openEdit(sale)} title="Editar venta" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setUndoTarget(sale)} title="Revertir venta" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning"><RotateCcw className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/60 p-2"><p className="text-[10px] text-muted-foreground mb-0.5">Cantidad</p><p className="text-xs font-bold">{sale.quantity} uds</p></div>
                      <div className="rounded-lg bg-muted/60 p-2"><p className="text-[10px] text-muted-foreground mb-0.5">Precio unit.</p><p className="text-xs font-semibold">{money.format(sale.unitPrice)}</p></div>
                      <div className="rounded-lg bg-muted/60 p-2"><p className="text-[10px] text-muted-foreground mb-0.5">Total</p><p className="text-xs font-bold">{money.format(sale.totalAmount)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {filtered.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Undo modal */}
      {undoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-light mb-4">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <h2 className="text-lg font-bold text-center">Revertir venta</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Se va a eliminar esta venta y <strong>restaurar el stock</strong> del producto.
            </p>
            <div className="mt-4 rounded-xl bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Producto</span><span className="font-medium">{undoTarget.productName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cantidad</span><span className="font-medium">{undoTarget.quantity} uds</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{money.format(undoTarget.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="font-medium">{undoTarget.saleDate}</span></div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setUndoTarget(null)}>Cancelar</Button>
              <Button className="flex-1 bg-warning hover:bg-warning/90 text-white" onClick={handleUndo} disabled={undoing}>
                {undoing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {undoing ? "Revertiendo..." : "Revertir venta"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal venta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingSale ? "Editar venta" : "Nueva venta"}</h2>
            {error && <div className="mb-4 rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Producto *</label>
                <select className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={form.productId} onChange={(e) => {
                    const product = products.find((p) => p.id === e.target.value);
                    setForm({ ...form, productId: e.target.value, unitPrice: product ? String(product.sellingPrice) : form.unitPrice });
                  }}>
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Cantidad</label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Fecha</label><Input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium">Precio unitario</label><Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></div>
              {form.quantity && form.unitPrice && (
                <div className="rounded-lg bg-primary-light p-3">
                  <p className="text-xs text-muted-foreground">Total de la venta</p>
                  <p className="text-lg font-bold text-primary">{money.format(Number(form.quantity) * Number(form.unitPrice))}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.productId}>{saving ? "Guardando..." : editingSale ? "Guardar cambios" : "Registrar venta"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-2">Importar ventas desde CSV</h2>
            <p className="text-sm text-muted-foreground mb-4">Columnas: sku, quantity, saleDate, unitPrice</p>
            <textarea className="w-full h-36 rounded-xl border border-border bg-card p-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={`sku,quantity,saleDate,unitPrice\nCAF-001,5,2026-05-19,11800`} />

            {importStatus === "importing" && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importando en lotes de {BATCH_SIZE} registros...
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${importProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-right">{importProgress}%</p>
              </div>
            )}

            {importResult && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  {importResult.created === importResult.total ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <p>Importadas: <span className="font-bold">{importResult.created}</span> / {importResult.total}</p>
                </div>
                {importResult.errors?.map((e, i) => <p key={i} className="text-danger text-xs ml-6">{e}</p>)}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cerrar</Button>
              <Button onClick={handleImport} disabled={!importText.trim() || importStatus === "importing"}>
                {importStatus === "importing" ? "Importando..." : "Importar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
