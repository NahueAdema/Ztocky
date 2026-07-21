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
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

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
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceHistoryItems, setPriceHistoryItems] = useState<{
    id: string;
    supplierName: string;
    productName: string;
    productSku: string;
    previousPrice: number | null;
    newPrice: number;
    previousMinQty: number | null;
    newMinQty: number | null;
    changeType: string;
    notes: string | null;
    createdAt: string;
  }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<string | null>(null);
  const [editCatalogPrice, setEditCatalogPrice] = useState("");
  const [editCatalogMinQty, setEditCatalogMinQty] = useState("");
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{
    created: number;
    total: number;
    errors?: string[];
  } | null>(null);
  const [importType, setImportType] = useState<"csv" | "excel">("csv");
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

  const fetchPriceHistory = useCallback(async (supplierId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/dashboard/catalog/history?supplierId=${supplierId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistoryItems(data.items);
      }
    } catch {
    } finally {
      setLoadingHistory(false);
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

  const handleExport = async (format: "csv" | "excel") => {
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

    if (format === "excel") {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
      XLSX.writeFile(wb, `proveedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
      return;
    }

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
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

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      if (rows.length === 0) {
        setImportResult({ created: 0, total: 0, errors: ["El archivo esta vacio."] });
        return;
      }
      const records = rows.map((row) => {
        const record: Record<string, string> = {};
        Object.keys(row).forEach((key) => {
          record[key.toLowerCase().trim()] = String(row[key] ?? "").trim();
        });
        return record;
      });
      const res = await fetch("/api/dashboard/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "suppliers", records }),
      });
      const result = await res.json();
      setImportResult(result);
      if (result.created > 0) fetchSuppliers();
    } catch {
      setImportResult({ created: 0, total: 0, errors: ["Error al leer el archivo Excel."] });
    }
    e.target.value = "";
  };

  const openCatalog = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setNewCatalogProduct("");
    setNewCatalogPrice("");
    setNewCatalogMinQty("1");
    setShowPriceHistory(false);
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
      fetchPriceHistory(supplier.id);
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

  const startEditCatalogItem = (item: { id: string; unitPrice: number; minOrderQty: number }) => {
    setEditingCatalogItem(item.id);
    setEditCatalogPrice(String(item.unitPrice));
    setEditCatalogMinQty(String(item.minOrderQty));
  };

  const saveCatalogItem = async (catalogId: string) => {
    if (!selectedSupplier) return;
    try {
      const res = await fetch(`/api/dashboard/catalog/${catalogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitPrice: Number(editCatalogPrice),
          minOrderQty: Number(editCatalogMinQty),
        }),
      });
      if (res.ok) {
        setEditingCatalogItem(null);
        openCatalog(selectedSupplier);
      }
    } catch {}
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
              onClick={() => {
                setImportType("csv");
                setImportText("");
                setImportResult(null);
                setShowImportModal(true);
              }}
            >
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => {
                setImportType("excel");
                document.getElementById("import-excel-input")?.click();
              }}
            >
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenu>
          <input
            id="import-excel-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPriceHistory(!showPriceHistory)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    showPriceHistory
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Historial
                </button>
                <button onClick={() => setShowCatalogModal(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
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
                    <div className="space-y-3">
                      <div className="flex gap-2 text-xs">
                        <span className="rounded bg-success-light text-success px-2.5 py-1 font-medium font-mono flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success"></span>
                          {importPricesPreview.summary.matchedNew} nuevas
                        </span>
                        <span className="rounded bg-primary-light text-primary px-2.5 py-1 font-medium font-mono flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
                          {importPricesPreview.summary.matchedUpdate} actualizadas
                        </span>
                        <span className="rounded bg-danger-light text-danger px-2.5 py-1 font-medium font-mono flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger"></span>
                          {importPricesPreview.summary.unmatched} sin match
                        </span>
                      </div>

                      {importPricesPreview.matchedUpdate.length > 0 && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                            <Pencil className="h-3 w-3" /> Precios actualizados
                          </p>
                          <div className="space-y-2">
                            {importPricesPreview.matchedUpdate.map((item) => {
                              const diff = item.unitPrice - item.previousUnitPrice;
                              const pct = item.previousUnitPrice > 0 ? ((diff / item.previousUnitPrice) * 100) : 0;
                              const isUp = diff > 0;
                              const isDown = diff < 0;
                              return (
                                <div key={item.sku} className="flex items-center justify-between text-xs bg-card rounded-lg p-2 border border-border/50">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.productName}</p>
                                    <p className="text-muted-foreground font-mono text-[10px]">{item.sku}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-muted-foreground line-through font-mono">{moneyFormatter.format(item.previousUnitPrice)}</span>
                                    <span className={`flex items-center gap-0.5 font-bold font-mono ${isUp ? "text-danger" : isDown ? "text-success" : "text-muted-foreground"}`}>
                                      {isUp ? "↑" : isDown ? "↓" : "→"}
                                      {moneyFormatter.format(item.unitPrice)}
                                    </span>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isUp ? "bg-danger/10 text-danger" : isDown ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                      {isUp ? "+" : ""}{pct.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {importPricesPreview.matchedNew.length > 0 && (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                          <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1.5">
                            <Plus className="h-3 w-3" /> Nuevos en catálogo
                          </p>
                          <div className="space-y-1">
                            {importPricesPreview.matchedNew.map((item) => (
                              <div key={item.sku} className="flex items-center justify-between text-xs bg-card rounded-lg p-2 border border-border/50">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.productName}</p>
                                  <p className="text-muted-foreground font-mono text-[10px]">{item.sku}</p>
                                </div>
                                <span className="font-bold font-mono text-success shrink-0">{moneyFormatter.format(item.unitPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {importPricesPreview.unmatched.length > 0 && (
                        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                          <p className="text-xs font-semibold text-danger mb-2 flex items-center gap-1.5">
                            <X className="h-3 w-3" /> Sin match (SKU no encontrado)
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {importPricesPreview.unmatched.map((item) => (
                              <span key={item.sku} className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground">
                                {item.sku}
                                <span className="text-danger font-medium">{moneyFormatter.format(item.unitPrice)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button variant="secondary" onClick={() => { setImportPricesPreview(null); setImportPricesText(""); }}>Cancelar</Button>
                        <Button onClick={handleApplyPrices} disabled={importingPrices}>
                          {importingPrices ? "Aplicando..." : `Aplicar ${importPricesPreview.summary.matchedNew + importPricesPreview.summary.matchedUpdate} cambios`}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {catalogItems.length === 0 && !showImportPrices && !showPriceHistory ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Sin productos asignados</p>
                <p className="text-xs text-muted-foreground mt-1">Agrega productos al catalogo o importa precios desde CSV.</p>
              </div>
            ) : showPriceHistory ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historial de cambios de precios
                </h3>
                {loadingHistory ? (
                  <div className="flex justify-center py-6">
                    <p className="text-sm text-muted-foreground">Cargando historial...</p>
                  </div>
                ) : priceHistoryItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Clock className="h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Sin cambios registrados</p>
                    <p className="text-xs text-muted-foreground mt-1">Los cambios de precios aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {priceHistoryItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.productSku}</p>
                          </div>
                          <Badge tone={
                            item.changeType === "CREATED" ? "success" :
                            item.changeType === "UPDATED" ? "default" :
                            item.changeType === "DELETED" ? "danger" :
                            "default"
                          }>
                            {item.changeType === "CREATED" ? "Nuevo" :
                             item.changeType === "UPDATED" ? "Actualizado" :
                             item.changeType === "DELETED" ? "Eliminado" :
                             item.changeType === "IMPORTED" ? "Importado" :
                             item.changeType}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {item.previousPrice !== null && item.changeType !== "CREATED" && (
                            <>
                              <span className="text-muted-foreground line-through">{moneyFormatter.format(item.previousPrice)}</span>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <span className="font-semibold">{moneyFormatter.format(item.newPrice)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(item.createdAt).toLocaleString("es-AR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : catalogItems.length > 0 ? (
              <div className="space-y-2">
                {catalogItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.productSku}</p>
                    </div>
                    {editingCatalogItem === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Precio"
                          value={editCatalogPrice}
                          onChange={(e) => setEditCatalogPrice(e.target.value)}
                          className="h-8 w-24 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Min"
                          value={editCatalogMinQty}
                          onChange={(e) => setEditCatalogMinQty(e.target.value)}
                          className="h-8 w-16 text-xs"
                        />
                        <button onClick={() => saveCatalogItem(item.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-success transition hover:bg-success-light"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingCatalogItem(null)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-sm font-bold block">{moneyFormatter.format(item.unitPrice)}</span>
                          <span className="text-[10px] text-muted-foreground">Min: {item.minOrderQty} uds</span>
                        </div>
                        <button onClick={() => startEditCatalogItem(item)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent-light hover:text-accent-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeCatalogItem(item.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
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
