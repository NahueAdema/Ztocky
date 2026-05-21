"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Boxes, Download, FileUp, Plus, Search, Trash2, Pencil } from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  currentStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  category: string | null;
  isActive: boolean;
};

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  currentStock: string;
  minStock: string;
  costPrice: string;
  sellingPrice: string;
  category: string;
  isActive: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  description: "",
  currentStock: "0",
  minStock: "10",
  costPrice: "0",
  sellingPrice: "0",
  category: "",
  isActive: true,
};

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; total: number; errors?: string[] } | null>(null);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/products");
      if (res.ok) setProducts((await res.json()).products);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => { setEditingProduct(null); setForm(emptyForm); setError(null); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description ?? "",
      currentStock: String(p.currentStock), minStock: String(p.minStock),
      costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice),
      category: p.category ?? "", isActive: p.isActive,
    });
    setError(null); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const url = editingProduct ? `/api/dashboard/products/${editingProduct.id}` : "/api/dashboard/products";
      const res = await fetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, currentStock: Number(form.currentStock), minStock: Number(form.minStock), costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      setShowModal(false); fetchProducts();
    } catch { setError("Error de conexion"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este producto?")) return;
    try { const res = await fetch(`/api/dashboard/products/${id}`, { method: "DELETE" }); if (res.ok) fetchProducts(); } catch {}
  };

  const handleExport = () => {
    const headers = ["Nombre", "SKU", "Categoria", "Stock", "Stock Minimo", "Costo", "Venta", "Activo"];
    const rows = products.map((p) => [p.name, p.sku, p.category ?? "", p.currentStock, p.minStock, p.costPrice, p.sellingPrice, p.isActive ? "Si" : "No"]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
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
    try {
      const res = await fetch("/api/dashboard/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "products", records }) });
      const data = await res.json();
      setImportResult(data);
      if (data.created > 0) fetchProducts();
    } catch { setImportResult({ created: 0, total: records.length, errors: ["Error de conexion"] }); }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inventario base para stock, margen y rotacion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}><Download className="h-4 w-4" />Exportar</Button>
          <Button variant="secondary" onClick={() => { setImportText(""); setImportResult(null); setShowImportModal(true); }}><FileUp className="h-4 w-4" />Importar</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Nuevo</Button>
        </div>
      </div>

      {/* Alerta stock bajo */}
      {lowStockCount > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger-light/50 p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-danger">{lowStockCount} producto{lowStockCount > 1 ? "s" : ""} con stock bajo</p>
            <p className="text-xs text-danger/80">Revisar y reabastecer antes de que se agoten.</p>
          </div>
        </div>
      )}

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle>Catalogo operativo</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, SKU o categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando productos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Boxes className="h-7 w-7 text-muted-foreground" /></div>
              <p className="text-sm font-semibold">{search ? "Sin resultados." : "No hay productos"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Intenta con otros terminos." : "Crear uno nuevo o importar desde CSV."}</p>
            </div>
          ) : (
            <>
              {/* Tabla — solo desktop */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-border">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Producto</th>
                      <th className="text-left">Categoria</th>
                      <th className="text-left">Stock</th>
                      <th className="text-left">Costo</th>
                      <th className="text-left">Venta</th>
                      <th className="text-left">Margen</th>
                      <th className="text-left">Estado</th>
                      <th className="text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => {
                      const margin = product.sellingPrice > 0 ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) : 0;
                      const isLow = product.currentStock <= product.minStock;
                      return (
                        <tr key={product.id}>
                          <td><p className="font-semibold">{product.name}</p><p className="text-xs text-muted-foreground font-mono">{product.sku}</p></td>
                          <td><span className="inline-flex h-6 items-center justify-center rounded-md bg-accent-soft px-2 text-xs font-medium text-accent-foreground">{product.category ?? "-"}</span></td>
                          <td><span className={`inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-bold ${isLow ? "bg-danger-light text-danger" : "bg-success-light text-success"}`}>{product.currentStock}</span></td>
                          <td className="text-sm text-muted-foreground">{moneyFormatter.format(product.costPrice)}</td>
                          <td className="text-sm font-medium">{moneyFormatter.format(product.sellingPrice)}</td>
                          <td><span className={`inline-flex h-6 items-center justify-center rounded-md px-2 text-xs font-bold ${margin >= 40 ? "bg-success-light text-success" : margin >= 25 ? "bg-warning-light text-warning" : "bg-danger-light text-danger"}`}>{margin}%</span></td>
                          <td><Badge tone={isLow ? "danger" : "success"}>{isLow ? "Bajo" : "OK"}</Badge></td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(product)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => handleDelete(product.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards — solo mobile */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filtered.map((product) => {
                  const margin = product.sellingPrice > 0 ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) : 0;
                  const isLow = product.currentStock <= product.minStock;
                  return (
                    <div key={product.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEdit(product)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(product.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/60 p-2">
                          <p className="text-[10px] text-muted-foreground mb-1">Stock</p>
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${isLow ? "bg-danger-light text-danger" : "bg-success-light text-success"}`}>{product.currentStock}</span>
                        </div>
                        <div className="rounded-lg bg-muted/60 p-2">
                          <p className="text-[10px] text-muted-foreground mb-1">Venta</p>
                          <p className="text-xs font-semibold">{moneyFormatter.format(product.sellingPrice)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/60 p-2">
                          <p className="text-[10px] text-muted-foreground mb-1">Margen</p>
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${margin >= 40 ? "bg-success-light text-success" : margin >= 25 ? "bg-warning-light text-warning" : "bg-danger-light text-danger"}`}>{margin}%</span>
                        </div>
                      </div>
                      {product.category && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex h-6 items-center justify-center rounded-md bg-accent-soft px-2 text-xs font-medium text-accent-foreground">{product.category}</span>
                          <Badge tone={isLow ? "danger" : "success"}>{isLow ? "Stock bajo" : "OK"}</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingProduct ? "Editar producto" : "Nuevo producto"}</h2>
            {error && <div className="mb-4 rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Nombre *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cafe Brasil 1kg" /></div>
              <div><label className="text-sm font-medium">SKU *</label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="CAF-001" /></div>
              <div><label className="text-sm font-medium">Categoria</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Almacen" /></div>
              <div><label className="text-sm font-medium">Stock actual</label><Input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Stock minimo</label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Precio costo</label><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Precio venta</label><Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Descripcion</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <label htmlFor="isActive" className="text-sm">Producto activo</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.sku}>{saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal importar */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-2">Importar productos desde CSV</h2>
            <p className="text-sm text-muted-foreground mb-4">Columnas: nombre, sku, categoria, currentStock, minStock, costPrice, sellingPrice, isActive</p>
            <textarea className="w-full h-36 rounded-xl border border-border bg-card p-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={`nombre,sku,categoria,currentStock,minStock,costPrice,sellingPrice,isActive\nCafe Brasil 1kg,CAF-001,Almacen,100,20,7400,11800,true`} />
            {importResult && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                <p>Importados: <span className="font-bold">{importResult.created}</span> / {importResult.total}</p>
                {importResult.errors?.map((e, i) => <p key={i} className="text-danger mt-1">{e}</p>)}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cerrar</Button>
              <Button onClick={handleImport} disabled={!importText.trim()}>Importar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}