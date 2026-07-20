"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, ITEMS_PER_PAGE } from "@/components/ui/pagination";
import {
  Download,
  FileUp,
  Plus,
  Search,
  Factory,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Clock,
  Truck,
  Star,
  Package,
  X,
} from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  leadTime: number;
  shippingCost: number;
  reliability: number;
  notes: string | null;
  products: {
    productId: string;
    productName: string;
    unitPrice: number;
    minOrderQty: number;
  }[];
};
type SupplierForm = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  leadTime: string;
  shippingCost: string;
  reliability: string;
  notes: string;
};

const emptyForm: SupplierForm = {
  name: "",
  contactEmail: "",
  contactPhone: "",
  leadTime: "7",
  shippingCost: "0",
  reliability: "4.5",
  notes: "",
};
const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [catalogItems, setCatalogItems] = useState<{ id: string; productId: string; productName: string; productSku: string; unitPrice: number; minOrderQty: number }[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [newCatalogProduct, setNewCatalogProduct] = useState("");
  const [newCatalogPrice, setNewCatalogPrice] = useState("");
  const [newCatalogMinQty, setNewCatalogMinQty] = useState("1");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showImportPrices, setShowImportPrices] = useState(false);
  const [importPricesText, setImportPricesText] = useState("");
  const [importPricesPreview, setImportPricesPreview] = useState<{
    summary: { total: number; matchedNew: number; matchedUpdate: number; unmatched: number };
    matchedNew: { sku: string; productName: string; unitPrice: number; minOrderQty: number }[];
    matchedUpdate: { sku: string; productName: string; unitPrice: number; minOrderQty: number; previousUnitPrice: number }[];
    unmatched: { sku: string; unitPrice: number }[];
  } | null>(null);
  const [importingPrices, setImportingPrices] = useState(false);
  const [importPricesError, setImportPricesError] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{
    created: number;
    total: number;
    errors?: string[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/suppliers");
      if (res.ok) setSuppliers((await res.json()).suppliers);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openCreate = () => {
    setEditingSupplier(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };
  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({
      name: s.name,
      contactEmail: s.contactEmail ?? "",
      contactPhone: s.contactPhone ?? "",
      leadTime: String(s.leadTime),
      shippingCost: String(s.shippingCost),
      reliability: String(s.reliability),
      notes: s.notes ?? "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = editingSupplier
        ? `/api/dashboard/suppliers/${editingSupplier.id}`
        : "/api/dashboard/suppliers";
      const res = await fetch(url, {
        method: editingSupplier ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          leadTime: Number(form.leadTime),
          shippingCost: Number(form.shippingCost),
          reliability: Number(form.reliability),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setShowModal(false);
      fetchSuppliers();
    } catch {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este proveedor?")) return;
    try {
      const res = await fetch(`/api/dashboard/suppliers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchSuppliers();
    } catch {}
  };

  const handleExport = () => {
    const headers = [
      "Nombre",
      "Email",
      "Telefono",
      "LeadTime",
      "ShippingCost",
      "Reliability",
      "Notes",
    ];
    const rows = suppliers.map((s) => [
      s.name,
      s.contactEmail ?? "",
      s.contactPhone ?? "",
      s.leadTime,
      s.shippingCost,
      s.reliability,
      s.notes ?? "",
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
    a.download = `proveedores_${new Date().toISOString().slice(0, 10)}.csv`;
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
        body: JSON.stringify({ type: "suppliers", records }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.created > 0) fetchSuppliers();
    } catch {
      setImportResult({
        created: 0,
        total: records.length,
        errors: ["Error de conexion"],
      });
    }
  };

  const openCatalog = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setNewCatalogProduct("");
    setNewCatalogPrice("");
    setNewCatalogMinQty("1");
    try {
      const [catalogRes, productsRes] = await Promise.all([
        fetch(`/api/dashboard/catalog?supplierId=${supplier.id}`),
        fetch("/api/dashboard/products"),
      ]);
      if (catalogRes.ok) {
        const data = await catalogRes.json();
        setCatalogItems(data.items);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setAllProducts(data.products);
      }
    } catch {
      // silently fail
    }
    setShowCatalogModal(true);
  };

  const addCatalogItem = async () => {
    if (!selectedSupplier || !newCatalogProduct || !newCatalogPrice) return;
    try {
      const res = await fetch("/api/dashboard/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier.id,
          productId: newCatalogProduct,
          unitPrice: Number(newCatalogPrice),
          minOrderQty: Number(newCatalogMinQty) || 1,
        }),
      });
      if (res.ok) {
        setNewCatalogProduct("");
        setNewCatalogPrice("");
        setNewCatalogMinQty("1");
        openCatalog(selectedSupplier);
      }
    } catch {
      // silently fail
    }
  };

  const removeCatalogItem = async (catalogId: string) => {
    try {
      const res = await fetch(`/api/dashboard/catalog/${catalogId}`, { method: "DELETE" });
      if (res.ok && selectedSupplier) openCatalog(selectedSupplier);
    } catch {
      // silently fail
    }
  };

  const handlePreviewPrices = async () => {
    if (!selectedSupplier) return;
    setImportPricesError(null);
    setImportPricesPreview(null);
    const lines = importPricesText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setImportPricesError("Pegar al menos 2 lineas (encabezado + datos)"); return; }
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const hasSku = header.includes("sku");
    const hasPrecio = header.includes("precio") || header.includes("unitprice") || header.includes("unit_price");
    if (!hasSku || !hasPrecio) { setImportPricesError("Columnas requeridas: sku, precio. Opcional: minimo"); return; }
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const record: Record<string, string> = {};
      header.forEach((h, i) => { record[h] = values[i] ?? ""; });
      return record;
    }).filter((r) => r.sku);
    setImportingPrices(true);
    try {
      const res = await fetch("/api/dashboard/catalog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: selectedSupplier.id, rows, apply: false }),
      });
      const data = await res.json();
      if (!res.ok) { setImportPricesError(data.error ?? "Error"); return; }
      setImportPricesPreview(data);
    } catch { setImportPricesError("Error de conexion"); }
    finally { setImportingPrices(false); }
  };

  const handleApplyPrices = async () => {
    if (!selectedSupplier || !importPricesPreview) return;
    setImportingPrices(true);
    setImportPricesError(null);
    const lines = importPricesText.trim().split("\n").filter(Boolean);
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const record: Record<string, string> = {};
      header.forEach((h, i) => { record[h] = values[i] ?? ""; });
      return record;
    }).filter((r) => r.sku);
    try {
      const res = await fetch("/api/dashboard/catalog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: selectedSupplier.id, rows, apply: true }),
      });
      const data = await res.json();
      if (!res.ok) { setImportPricesError(data.error ?? "Error"); return; }
      setShowImportPrices(false);
      setImportPricesText("");
      setImportPricesPreview(null);
      if (selectedSupplier) openCatalog(selectedSupplier);
    } catch { setImportPricesError("Error de conexion"); }
    finally { setImportingPrices(false); }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactEmail ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">
            Proveedores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compará precios, tiempos de entrega y confiabilidad.
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
            Nuevo
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle>Directorio de proveedores</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">
                Cargando proveedores...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Factory className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {search ? "Sin resultados." : "No hay proveedores"}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                {search
                  ? "Intenta con otros terminos de busqueda."
                  : "Crea uno nuevo o importa desde un archivo CSV."}
              </p>
            </div>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-border">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Nombre</th>
                      <th className="text-left">Contacto</th>
                      <th className="text-left">Tiempo de entrega</th>
                      <th className="text-left">Envio</th>
                      <th className="text-left">Confiabilidad</th>
                      <th className="text-left">Productos</th>
                      <th className="text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td>
                          <p className="font-semibold">{supplier.name}</p>
                          {supplier.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {supplier.notes}
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="space-y-1">
                            {supplier.contactEmail && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{supplier.contactEmail}</span>
                              </div>
                            )}
                            {supplier.contactPhone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{supplier.contactPhone}</span>
                              </div>
                            )}
                            {!supplier.contactEmail &&
                              !supplier.contactPhone && (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {supplier.leadTime} dias
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {moneyFormatter.format(supplier.shippingCost)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Star className={`h-3.5 w-3.5 ${supplier.reliability >= 4.5 ? "text-warning" : "text-muted-foreground"}`} />
                            <span className={`text-sm font-bold ${supplier.reliability >= 4.5 ? "text-warning" : ""}`}>
                              {supplier.reliability}
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge tone="default">
                            {supplier.products.length}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openCatalog(supplier)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent-light hover:text-accent-foreground" title="Ver catalogo"><Package className="h-4 w-4" /></button>
                            <button onClick={() => openEdit(supplier)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(supplier.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="flex flex-col gap-3 sm:hidden">
                {paginatedSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-sm">{supplier.name}</p>
                        {supplier.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {supplier.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openCatalog(supplier)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent-light hover:text-accent-foreground" title="Ver catalogo"><Package className="h-4 w-4" /></button>
                        <button onClick={() => openEdit(supplier)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(supplier.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    {/* Info chips */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Tiempo de entrega
                        </p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold">
                            {supplier.leadTime} dias
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Envio
                        </p>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold">
                            {moneyFormatter.format(supplier.shippingCost)}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Productos</p>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold">{supplier.products.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {supplier.contactEmail && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{supplier.contactEmail}</span>
                          </div>
                        )}
                        {supplier.contactPhone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.contactPhone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star
                          className={`h-3.5 w-3.5 ${supplier.reliability >= 4.5 ? "text-warning" : "text-muted-foreground"}`}
                        />
                        <span
                          className={`text-sm font-bold ${supplier.reliability >= 4.5 ? "text-warning" : ""}`}
                        >
                          {supplier.reliability}
                        </span>
                      </div>
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

      {/* Modal proveedor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
            </h2>
            {error && (
              <div className="mb-4 rounded-lg bg-danger-light p-3 text-sm text-danger">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Norte Distribuciones"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  placeholder="compras@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefono</label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tiempo de entrega (dias)</label>
                <Input
                  type="number"
                  value={form.leadTime}
                  onChange={(e) =>
                    setForm({ ...form, leadTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Costo de envio</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.shippingCost}
                  onChange={(e) =>
                    setForm({ ...form, shippingCost: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Confiabilidad (1-5)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.reliability}
                  onChange={(e) =>
                    setForm({ ...form, reliability: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving
                  ? "Guardando..."
                  : editingSupplier
                    ? "Guardar cambios"
                    : "Crear proveedor"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal catalogo */}
      {showCatalogModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Catalogo de {selectedSupplier.name}</h2>
                <p className="text-sm text-muted-foreground">Productos que provee este supplier</p>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_6rem_5rem_auto] gap-2 mb-4">
              <select
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={newCatalogProduct}
                onChange={(e) => setNewCatalogProduct(e.target.value)}
              >
                <option value="">Seleccionar producto...</option>
                {allProducts
                  .filter((p) => !catalogItems.some((c) => c.productId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
              </select>
              <Input
                type="number"
                placeholder="Precio"
                value={newCatalogPrice}
                onChange={(e) => setNewCatalogPrice(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Min"
                value={newCatalogMinQty}
                onChange={(e) => setNewCatalogMinQty(e.target.value)}
              />
              <Button onClick={addCatalogItem} disabled={!newCatalogProduct || !newCatalogPrice}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <button onClick={() => { setShowImportPrices(!showImportPrices); setImportPricesPreview(null); setImportPricesText(""); setImportPricesError(null); }}
                className="text-sm text-primary hover:underline flex items-center gap-1">
                <FileUp className="h-3.5 w-3.5" /> {showImportPrices ? "Cerrar importacion" : "Importar precios desde CSV"}
              </button>

              {showImportPrices && (
                <div className="mt-3 space-y-3 rounded-lg border border-border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">Columnas: <strong>sku, precio</strong>. Opcional: <strong>minimo</strong></p>
                  <textarea className="w-full h-24 rounded-lg border border-border bg-card p-2 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={importPricesText} onChange={(e) => setImportPricesText(e.target.value)}
                    placeholder={`sku,precio,minimo\nCAF-001,8500,5\nCAF-002,9200,3`} />
                  {importPricesError && <p className="text-xs text-danger">{importPricesError}</p>}

                  {!importPricesPreview ? (
                    <Button onClick={handlePreviewPrices} disabled={!importPricesText.trim() || importingPrices}>
                      {importingPrices ? "Procesando..." : "Previsualizar"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2 text-xs">
                        <span className="rounded bg-success-light text-success px-2 py-0.5 font-medium font-mono">{importPricesPreview.summary.matchedNew} nuevas</span>
                        <span className="rounded bg-primary-light text-primary px-2 py-0.5 font-medium font-mono">{importPricesPreview.summary.matchedUpdate} actualizadas</span>
                        <span className="rounded bg-danger-light text-danger px-2 py-0.5 font-medium font-mono">{importPricesPreview.summary.unmatched} sin match</span>
                      </div>
                      {importPricesPreview.matchedNew.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-success mb-1">Nuevos en catalogo:</p>
                          {importPricesPreview.matchedNew.map((item) => (
                            <div key={item.sku} className="flex justify-between text-xs py-0.5">
                              <span>{item.productName} ({item.sku})</span>
                              <span className="font-mono">{moneyFormatter.format(item.unitPrice)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {importPricesPreview.matchedUpdate.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-primary mb-1">Precios actualizados:</p>
                          {importPricesPreview.matchedUpdate.map((item) => (
                            <div key={item.sku} className="flex justify-between text-xs py-0.5">
                              <span>{item.productName} ({item.sku})</span>
                              <span className="font-mono">{moneyFormatter.format(item.previousUnitPrice)} → {moneyFormatter.format(item.unitPrice)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {importPricesPreview.unmatched.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-danger mb-1">Sin match (SKU no encontrado):</p>
                          {importPricesPreview.unmatched.map((item) => (
                            <div key={item.sku} className="text-xs text-muted-foreground py-0.5">{item.sku}</div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button variant="secondary" onClick={() => { setImportPricesPreview(null); setImportPricesText(""); }}>Cancelar</Button>
                        <Button onClick={handleApplyPrices} disabled={importingPrices}>
                          {importingPrices ? "Aplicando..." : "Aplicar cambios"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {catalogItems.length === 0 && !showImportPrices ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Sin productos asignados</p>
                <p className="text-xs text-muted-foreground mt-1">Agrega productos al catalogo o importa precios desde CSV.</p>
              </div>
            ) : catalogItems.length > 0 ? (
              <div className="space-y-2">
                {catalogItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.productSku} · Min: {item.minOrderQty} uds</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{moneyFormatter.format(item.unitPrice)}</span>
                      <button onClick={() => removeCatalogItem(item.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal importar */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-2">
              Importar proveedores desde CSV
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Columnas: nombre, contactEmail, contactPhone, leadTime,
              shippingCost, reliability, notes
            </p>
            <textarea
              className="w-full h-36 rounded-xl border border-border bg-card p-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`nombre,contactEmail,contactPhone,leadTime,shippingCost,reliability,notes\nNorte Distribuciones,compras@norte.com,011-1234,3,18000,4.8,Entrega rapida`}
            />
            {importResult && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                <p>
                  Importados:{" "}
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
