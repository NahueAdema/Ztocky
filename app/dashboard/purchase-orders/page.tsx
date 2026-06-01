"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Plus, Search, ClipboardList, Trash2, FileText, Package, Calendar, Send, Truck, CheckCircle, XCircle, ArrowRight, Pencil } from "lucide-react";

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

type ProductOption = { id: string; name: string; sku: string; sellingPrice: number };
type SupplierOption = { id: string; name: string };
type OrderItemForm = { productId: string; quantity: string; unitPrice: string };

// ─── Status helpers ──────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  DRAFT: "Borrador", SENT: "Enviada", CONFIRMED: "Confirmada",
  SHIPPED: "En camino", RECEIVED: "Recibida", CANCELLED: "Cancelada",
};

const TONES: Record<string, "muted" | "warning" | "success" | "danger" | "default"> = {
  DRAFT: "muted", SENT: "warning", CONFIRMED: "default",
  SHIPPED: "default", RECEIVED: "success", CANCELLED: "danger",
};

const NEXT_TRANSITIONS: Record<string, { status: string; label: string; icon: React.ElementType }[]> = {
  DRAFT: [
    { status: "SENT", label: "Enviar al proveedor", icon: Send },
    { status: "CANCELLED", label: "Cancelar orden", icon: XCircle },
  ],
  SENT: [
    { status: "CONFIRMED", label: "Confirmar recepción", icon: CheckCircle },
    { status: "CANCELLED", label: "Cancelar orden", icon: XCircle },
  ],
  CONFIRMED: [
    { status: "SHIPPED", label: "Marcar como enviado", icon: Truck },
    { status: "CANCELLED", label: "Cancelar orden", icon: XCircle },
  ],
  SHIPPED: [
    { status: "RECEIVED", label: "Recibir mercadería", icon: Package },
    { status: "CANCELLED", label: "Cancelar orden", icon: XCircle },
  ],
  RECEIVED: [],
  CANCELLED: [
    { status: "DRAFT", label: "Reabrir orden", icon: FileText },
  ],
};

const STEPS = ["DRAFT", "SENT", "CONFIRMED", "SHIPPED", "RECEIVED"];

function StatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 text-xs text-danger mb-3">
        <XCircle className="h-3.5 w-3.5" />
        Orden cancelada
      </div>
    );
  }
  const currentIdx = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mb-3">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        return (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center justify-center rounded-full text-[10px] font-bold h-5 w-5 shrink-0 transition-colors ${
              done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 transition-colors ${i < currentIdx ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Formatters ──────────────────────────────────────────────────────────────

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([{ productId: "", quantity: "1", unitPrice: "0" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingOrder(null);
    setSelectedSupplier(""); setOrderNotes("");
    setOrderItems([{ productId: "", quantity: "1", unitPrice: "0" }]);
    setError(null); setShowModal(true);
  };

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setSelectedSupplier(order.supplierId);
    setOrderNotes(order.notes ?? "");
    setOrderItems(order.items.map((i) => ({ productId: i.productId, quantity: String(i.quantity), unitPrice: String(i.unitPrice) })));
    setError(null); setShowModal(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedSupplier) { setError("Seleccionar un proveedor"); return; }
    const validItems = orderItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) { setError("Agregar al menos un item"); return; }
    setSaving(true); setError(null);
    const isEdit = !!editingOrder;
    try {
      const res = await fetch(isEdit ? `/api/dashboard/purchase-orders/${editingOrder!.id}` : "/api/dashboard/purchase-orders", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? {} : { supplierId: selectedSupplier }),
          notes: orderNotes,
          items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setShowModal(false); fetchData();
    } catch { setError("Error de conexion"); } finally { setSaving(false); }
  };

  const changeStatus = async (orderId: string, newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/purchase-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch { /* fail silently */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta orden? Esta accion no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/dashboard/purchase-orders/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch { /* fail silently */ }
  };

  const addItem = () => setOrderItems([...orderItems, { productId: "", quantity: "1", unitPrice: "0" }]);
  const removeItem = (index: number) => { if (orderItems.length > 1) setOrderItems(orderItems.filter((_, i) => i !== index)); };
  const updateItem = (index: number, field: keyof OrderItemForm, value: string) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleExport = () => {
    const headers = ["ID", "Proveedor", "Estado", "Total", "Notas", "Fecha", "Items"];
    const rows = orders.map((o) => [
      o.id.slice(0, 8).toUpperCase(), o.supplierName,
      LABELS[o.status] ?? o.status, o.totalAmount,
      o.notes ?? "", o.createdAt.slice(0, 10),
      o.items.map((i) => `${i.productName} x${i.quantity}`).join(" | "),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `ordenes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = orders.filter(
    (o) => o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
          o.status.toLowerCase().includes(search.toLowerCase()) ||
          o.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordenes de compra</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ciclo completo: seguimiento desde el borrador hasta la recepción.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva orden
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle>Ordenes</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por proveedor, estado o ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <p className="text-sm font-semibold">{search ? "Sin resultados." : "No hay ordenes"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Intenta con otros terminos." : "Crear una nueva orden."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => {
                const transitions = NEXT_TRANSITIONS[order.status] ?? [];
                return (
                  <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                            <FileText className="h-5 w-5 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
                              <span className="text-muted-foreground font-normal mx-1.5">·</span>
                              {order.supplierName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge tone={TONES[order.status] ?? "muted"}>{LABELS[order.status] ?? order.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 inline mr-0.5" />
                                {order.createdAt.slice(0, 10)}
                              </span>
                              <span className="text-xs font-bold">{money.format(order.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {order.status === "DRAFT" && (
                            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => openEdit(order)}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                          )}
                          {transitions.map((t) => (
                            <Button
                              key={t.status}
                              variant={t.status === "CANCELLED" ? "ghost" : "primary"}
                              className="h-8 px-3 text-xs"
                              onClick={() => changeStatus(order.id, t.status)}
                              disabled={saving}
                            >
                              <t.icon className="h-3.5 w-3.5" />
                              {t.label}
                            </Button>
                          ))}
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                          >
                            <ArrowRight className={`h-4 w-4 transition-transform ${expandedId === order.id ? "rotate-90" : ""}`} />
                          </button>
                          {order.status !== "RECEIVED" && (
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedId === order.id && (
                      <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/30">
                        <StatusTimeline status={order.status} />
                        {order.notes && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Notas:</span> {order.notes}
                          </p>
                        )}
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="text-left pb-2 font-medium">Producto</th>
                              <th className="text-right pb-2 font-medium">Cant.</th>
                              <th className="text-right pb-2 font-medium">Precio</th>
                              <th className="text-right pb-2 font-medium">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id} className="border-b border-border/50">
                                <td className="py-1.5">
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-muted-foreground">{item.productSku}</p>
                                </td>
                                <td className="text-right py-1.5">{item.quantity}</td>
                                <td className="text-right py-1.5">{money.format(item.unitPrice)}</td>
                                <td className="text-right py-1.5 font-medium">{money.format(item.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold text-sm">
                              <td colSpan={3} className="text-right pt-2">Total</td>
                              <td className="text-right pt-2 text-primary">{money.format(order.totalAmount)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingOrder ? "Editar orden" : "Nueva orden de compra"}</h2>
            {error && <div className="mb-4 rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Proveedor *</label>
                <select className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Input value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Notas opcionales..." />
              </div>
              <div>
                <label className="text-sm font-medium">Productos</label>
                <div className="mt-2 grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Producto</span>
                  <span className="text-center">Cantidad</span>
                  <span className="text-center">Precio unit.</span>
                  <span />
                </div>
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 mt-1.5 items-center">
                    <select className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}
                    </select>
                    <Input type="number" className="h-10 text-center" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} placeholder="0" min="1" />
                    <Input type="number" className="h-10 text-center" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} placeholder="$0" min="0" />
                    <button onClick={() => removeItem(index)} className="inline-flex h-10 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button variant="ghost" className="mt-2 text-sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar item
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveOrder} disabled={saving}>{saving ? "Creando..." : "Crear orden"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
