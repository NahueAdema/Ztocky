"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Plus, Search, ClipboardList, Trash2, FileText, Package, Calendar } from "lucide-react";

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
};

type SupplierOption = {
  id: string;
  name: string;
};

type OrderItemForm = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  CONFIRMED: "Confirmada",
  SHIPPED: "En camino",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

const statusTone: Record<string, "muted" | "warning" | "success" | "danger" | "default"> = {
  DRAFT: "muted",
  SENT: "warning",
  CONFIRMED: "default",
  SHIPPED: "default",
  RECEIVED: "success",
  CANCELLED: "danger",
};

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([{ productId: "", quantity: "1", unitPrice: "0" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, suppliersRes] = await Promise.all([
        fetch("/api/dashboard/purchase-orders"),
        fetch("/api/dashboard/products"),
        fetch("/api/dashboard/suppliers"),
      ]);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders);
      if (productsRes.ok) setProducts((await productsRes.json()).products);
      if (suppliersRes.ok) setSuppliers((await suppliersRes.json()).suppliers);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setSelectedSupplier("");
    setOrderNotes("");
    setOrderItems([{ productId: "", quantity: "1", unitPrice: "0" }]);
    setError(null);
    setShowModal(true);
  };

  const openStatusChange = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedSupplier) {
      setError("Seleccionar un proveedor");
      return;
    }
    const validItems = orderItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setError("Agregar al menos un item");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          notes: orderNotes,
          items: validItems.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear la orden");
        return;
      }

      setShowModal(false);
      fetchData();
    } catch {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/purchase-orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        fetchData();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta orden? Esta accion no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/dashboard/purchase-orders/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch {
      // silently fail
    }
  };

  const addItem = () => setOrderItems([...orderItems, { productId: "", quantity: "1", unitPrice: "0" }]);

  const removeItem = (index: number) => {
    if (orderItems.length > 1) setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: string) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleExport = () => {
    const headers = ["ID", "Proveedor", "Estado", "Total", "Notas", "Fecha", "Items"];
    const rows = orders.map((o) => [
      o.id.slice(0, 8).toUpperCase(),
      o.supplierName,
      statusLabels[o.status] ?? o.status,
      o.totalAmount,
      o.notes ?? "",
      o.createdAt.slice(0, 10),
      o.items.map((i) => `${i.productName} x${i.quantity}`).join(" | "),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordenes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = orders.filter(
    (o) =>
      o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      o.status.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordenes de compra</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Borradores generados por el motor y seguimiento de envio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva orden
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle>Ultimas ordenes</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor, estado o ID..."
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
              <p className="mt-3 text-sm text-muted-foreground">Cargando ordenes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <ClipboardList className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">
                {search ? "Sin resultados." : "No hay ordenes"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Intenta con otros terminos." : "Crear una nueva orden."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="text-left">Orden</th>
                    <th className="text-left">Proveedor</th>
                    <th className="text-left">Items</th>
                    <th className="text-left">Fecha</th>
                    <th className="text-left">Total</th>
                    <th className="text-left">Estado</th>
                    <th className="text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
                            <FileText className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</p>
                            {order.notes && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{order.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm font-medium">{order.supplierName}</td>
                      <td>
                        <span className="inline-flex h-6 items-center justify-center rounded-md bg-muted px-2 text-xs font-medium">
                          {order.items.length} items
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {order.createdAt.slice(0, 10)}
                        </div>
                      </td>
                      <td className="text-sm font-bold">{moneyFormatter.format(order.totalAmount)}</td>
                      <td>
                        <Badge tone={statusTone[order.status] ?? "muted"}>
                          {statusLabels[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => openStatusChange(order)}>Estado</Button>
                          <button onClick={() => handleDelete(order.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Nueva orden de compra</h2>
            {error && (
              <div className="mb-4 rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Proveedor *</label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Input value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Notas opcionales..." />
              </div>
              <div>
                <label className="text-sm font-medium">Items</label>
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mt-2 items-center">
                    <select
                      className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                    >
                      <option value="">Producto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      className="w-20"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      placeholder="Cant"
                    />
                    <Input
                      type="number"
                      className="w-28"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      placeholder="Precio"
                    />
                    <button onClick={() => removeItem(index)} className="inline-flex h-10 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button variant="ghost" className="mt-2 text-sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar item
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveOrder} disabled={saving}>
                {saving ? "Creando..." : "Crear orden"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Cambiar estado</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Orden <span className="font-mono font-bold">{selectedOrder.id.slice(0, 8).toUpperCase()}</span> - {selectedOrder.supplierName}
            </p>
            <select
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowStatusModal(false)}>Cancelar</Button>
              <Button onClick={handleStatusChange} disabled={saving}>
                {saving ? "Guardando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
