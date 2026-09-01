"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination, ITEMS_PER_PAGE } from "@/components/ui/pagination";
import { Boxes, Download, FileUp, Plus, Search, Trash2, Pencil, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton } from "@/components/ui/skeleton";
import { moneyFormatter } from "@/lib/format";

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
  suppliers: ProductSupplier[];
};

type SupplierOption = { id: string; name: string };
type ProductSupplier = { supplierId: string; supplierName: string; unitPrice: number; minOrderQty: number };

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
  supplierId: string;
  catalogUnitPrice: string;
  catalogMinQty: string;
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
  supplierId: "",
  catalogUnitPrice: "",
  catalogMinQty: "1",
};

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [productSuppliers, setProductSuppliers] = useState<Map<string, ProductSupplier[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [linkToSupplier, setLinkToSupplier] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; total: number; errors?: string[] } | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "done">("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterMargin, setFilterMargin] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, supRes] = await Promise.all([
        fetch("/api/dashboard/products"),
        fetch("/api/dashboard/suppliers"),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products);
        const map = new Map<string, ProductSupplier[]>();
        for (const p of data.products) {
          if (p.suppliers && p.suppliers.length > 0) {
            map.set(p.id, p.suppliers);
          }
        }
        setProductSuppliers(map);
      }
      if (supRes.ok) setSuppliers((await supRes.json()).suppliers);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditingProduct(null); setForm(emptyForm); setLinkToSupplier(false); setError(null); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description ?? "",
      currentStock: String(p.currentStock), minStock: String(p.minStock),
      costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice),
      category: p.category ?? "", isActive: p.isActive,
      supplierId: "", catalogUnitPrice: "", catalogMinQty: "1",
    });
    setLinkToSupplier(false); setError(null); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, sku: form.sku, description: form.description,
        currentStock: Number(form.currentStock), minStock: Number(form.minStock),
        costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice),
        category: form.category, isActive: form.isActive,
      };
      if (!editingProduct && linkToSupplier && form.supplierId && form.catalogUnitPrice) {
        payload.supplierId = form.supplierId;
        payload.catalogUnitPrice = Number(form.catalogUnitPrice);
        payload.catalogMinQty = Number(form.catalogMinQty) || 1;
      }
      const url = editingProduct ? `/api/dashboard/products/${editingProduct.id}` : "/api/dashboard/products";
      const res = await fetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); toast(data.error ?? "Error al guardar", "error"); return; }
      setShowModal(false); fetchData();
      toast(editingProduct ? "Producto actualizado" : "Producto creado", "success");
    } catch { setError("Error de conexión"); toast("Error de conexión", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este producto?")) return;
    const product = products.find((p) => p.id === id);
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        toast("Producto eliminado", "success", product
          ? { label: "Deshacer", onClick: () => restoreProduct(product) }
          : undefined);
      } else {
        toast("No se pudo eliminar el producto", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    }
  };

  const restoreProduct = async (product: Product) => {
    try {
      const res = await fetch("/api/dashboard/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          sku: product.sku,
          description: product.description ?? "",
          currentStock: product.currentStock,
          minStock: product.minStock,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          category: product.category ?? "",
          isActive: product.isActive,
        }),
      });
      if (res.ok) {
        toast("Producto restaurado", "success");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "No se pudo restaurar el producto", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    const headers = ["Nombre", "SKU", "Categoria", "Stock", "Stock Minimo", "Costo", "Venta", "Activo"];
    const rows = products.map((p) => [p.name, p.sku, p.category ?? "", p.currentStock, p.minStock, p.costPrice, p.sellingPrice, p.isActive ? "Si" : "No"]);

    if (format === "excel") {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Productos");
      XLSX.writeFile(wb, `productos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      return;
    }

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

    setImportStatus("importing");
    setImportProgress(0);
    let totalCreated = 0;
    let allErrors: string[] = [];
    const batchSize = 50;

    const batches: Record<string, string>[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      try {
        const res = await fetch("/api/dashboard/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "products", records: batches[i] }),
        });
        const data = await res.json();
        totalCreated += data.created ?? 0;
        if (data.errors) allErrors = allErrors.concat(data.errors);
      } catch {
        allErrors.push(`Error en lote ${i + 1}`);
      }
      setImportProgress(Math.round(((i + 1) / batches.length) * 100));
    }

    setImportStatus("done");
    setImportResult({ created: totalCreated, total: records.length, errors: allErrors.length > 0 ? allErrors : undefined });
    if (totalCreated > 0) fetchData();
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setImportStatus("importing");
    setImportProgress(0);
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      if (rows.length === 0) {
        setImportResult({ created: 0, total: 0, errors: ["El archivo esta vacio."] });
        setImportStatus("done");
        return;
      }
      const records = rows.map((row) => {
        const record: Record<string, string> = {};
        Object.keys(row).forEach((key) => {
          record[key.toLowerCase().trim()] = String(row[key] ?? "").trim();
        });
        return record;
      });

      let totalCreated = 0;
      let allErrors: string[] = [];
      const batchSize = 50;
      const batches: Record<string, string>[][] = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }
      for (let i = 0; i < batches.length; i++) {
        try {
          const res = await fetch("/api/dashboard/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "products", records: batches[i] }),
          });
          const result = await res.json();
          totalCreated += result.created ?? 0;
          if (result.errors) allErrors = allErrors.concat(result.errors);
        } catch {
          allErrors.push(`Error en lote ${i + 1}`);
        }
        setImportProgress(Math.round(((i + 1) / batches.length) * 100));
      }
      setImportStatus("done");
      setImportResult({ created: totalCreated, total: records.length, errors: allErrors.length > 0 ? allErrors : undefined });
      if (totalCreated > 0) fetchData();
    } catch {
      setImportResult({ created: 0, total: 0, errors: ["Error al leer el archivo Excel."] });
      setImportStatus("done");
    }
    e.target.value = "";
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || (p.category ?? "Sin categoría") === filterCategory;
    const matchesStock = filterStock === "all" ||
      (filterStock === "low" && p.currentStock <= p.minStock) ||
      (filterStock === "ok" && p.currentStock > p.minStock);
    const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
    const matchesMargin = filterMargin === "all" ||
      (filterMargin === "low" && margin < 25) ||
      (filterMargin === "medium" && margin >= 25 && margin < 40) ||
      (filterMargin === "high" && margin >= 40);
    return matchesSearch && matchesCategory && matchesStock && matchesMargin;
  });
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;
  const categories = [...new Set(products.map((p) => p.category ?? "Sin categoría"))].sort();

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
            <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inventario base para stock, margen y rotacion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu
            trigger={
              <Button variant="secondary">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            }
          >
            <DropdownMenuItem
              icon={<FileText className="h-4 w-4" />}
              onClick={() => handleExport("csv")}
            >
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => handleExport("excel")}
            >
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenu>
          <DropdownMenu
            trigger={
              <Button variant="secondary">
                <FileUp className="h-4 w-4" />
                Importar
              </Button>
            }
          >
            <DropdownMenuItem
              icon={<FileText className="h-4 w-4" />}
              onClick={() => { setImportText(""); setImportResult(null); setShowImportModal(true); }}
            >
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => document.getElementById("import-products-excel")?.click()}
            >
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenu>
          <input
            id="import-products-excel"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
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
          <CardTitle>Catálogo operativo</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, SKU o categoría..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium text-foreground outline-none transition hover:border-primary/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: "all", label: "Stock" },
                { value: "low", label: "Bajo" },
                { value: "ok", label: "OK" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterStock(opt.value); setPage(1); }}
                  className={`px-3 py-1 text-xs font-medium transition ${
                    filterStock === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: "all", label: "Margen" },
                { value: "low", label: "<25%" },
                { value: "medium", label: "25-40%" },
                { value: "high", label: ">40%" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterMargin(opt.value); setPage(1); }}
                  className={`px-3 py-1 text-xs font-medium transition ${
                    filterMargin === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(filterCategory !== "all" || filterStock !== "all" || filterMargin !== "all") && (
              <button
                onClick={() => { setFilterCategory("all"); setFilterStock("all"); setFilterMargin("all"); setPage(1); }}
                className="px-3 py-1 text-xs font-medium text-danger hover:bg-danger/10 rounded-lg transition"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title={search ? "Sin resultados." : "No hay productos"}
              description={search ? "Intentá con otros términos de búsqueda." : "Cargá tu primer producto o importá desde un archivo CSV para empezar a gestionar tu stock."}
              action={!search ? { label: "Crear producto", href: "#" } : undefined}
            />
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
                      <th className="text-left">Proveedores</th>
                      <th className="text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => {
                      const margin = product.sellingPrice > 0 ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) : 0;
                      const isLow = product.currentStock <= product.minStock;
                      const pSuppliers = productSuppliers.get(product.id) ?? [];
                      return (
                        <tr key={product.id}>
                          <td><p className="font-semibold">{product.name}</p><p className="text-xs text-muted-foreground font-mono">{product.sku}</p></td>
                           <td><span className="inline-flex h-6 items-center justify-center rounded-md bg-accent-light px-2 text-xs font-medium text-accent">{product.category ?? "-"}</span></td>
                          <td><span className={`inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-bold ${isLow ? "bg-danger-light text-danger" : "bg-success-light text-success"}`}>{product.currentStock}</span></td>
                          <td className="text-sm text-muted-foreground">{moneyFormatter.format(product.costPrice)}</td>
                          <td className="text-sm font-medium">{moneyFormatter.format(product.sellingPrice)}</td>
                          <td><span className={`inline-flex h-6 items-center justify-center rounded-md px-2 text-xs font-bold ${margin >= 40 ? "bg-success-light text-success" : margin >= 25 ? "bg-warning-light text-warning" : "bg-danger-light text-danger"}`}>{margin}%</span></td>
                          <td><Badge tone={isLow ? "danger" : "success"}>{isLow ? "Bajo" : "OK"}</Badge></td>
                          <td>
                            {pSuppliers.length > 0 ? (
                              <span className="text-xs text-muted-foreground" title={pSuppliers.map(s => s.supplierName).join(", ")}>
                                {pSuppliers.length} proveedor{pSuppliers.length > 1 ? "es" : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                           <td>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEdit(product)} title="Editar producto" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => handleDelete(product.id)} title="Eliminar producto" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
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
                {paginatedProducts.map((product) => {
                  const margin = product.sellingPrice > 0 ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) : 0;
                  const isLow = product.currentStock <= product.minStock;
                  return (
                    <div key={product.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => openEdit(product)} title="Editar producto" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(product.id)} title="Eliminar producto" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
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
                          <span className="inline-flex h-6 items-center justify-center rounded-md bg-accent-light px-2 text-xs font-medium text-accent">{product.category}</span>
                          <Badge tone={isLow ? "danger" : "success"}>{isLow ? "Stock bajo" : "OK"}</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md animate-overlay">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-modal">
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

            {!editingProduct && (
              <>
                <hr className="my-4 border-border" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="linkToSupplier" checked={linkToSupplier} onChange={(e) => setLinkToSupplier(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    <label htmlFor="linkToSupplier" className="text-sm font-medium">Vincular a un proveedor</label>
                  </div>
                  {linkToSupplier && (
                    <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-primary/20">
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Proveedor</label>
                        <select className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                          <option value="">Seleccionar proveedor...</option>
                          {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                      </div>
                      <div><label className="text-sm font-medium">Precio de compra</label><Input type="number" step="0.01" value={form.catalogUnitPrice} onChange={(e) => setForm({ ...form, catalogUnitPrice: e.target.value })} placeholder="$0" /></div>
                      <div><label className="text-sm font-medium">Cant. minima</label><Input type="number" value={form.catalogMinQty} onChange={(e) => setForm({ ...form, catalogMinQty: e.target.value })} placeholder="1" /></div>
                    </div>
                  )}
                </div>
              </>
            )}

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

            {importStatus === "importing" && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importando en lotes...
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
                  <p>Importados: <span className="font-bold">{importResult.created}</span> / {importResult.total}</p>
                </div>
                {importResult.errors?.map((e, i) => <p key={i} className="text-danger text-xs ml-6">{e}</p>)}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => { setShowImportModal(false); setImportStatus("idle"); }}>Cerrar</Button>
              <Button onClick={handleImport} disabled={!importText.trim() || importStatus === "importing"}>{importStatus === "importing" ? "Importando..." : "Importar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}