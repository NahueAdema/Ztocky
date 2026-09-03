"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton } from "@/components/ui/skeleton";
import { moneyFormatter } from "@/lib/format";
import {
  Undo2,
  Plus,
  Search,
  Loader2,
  Package,
} from "lucide-react";

type ReturnItem = {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type ReturnRecord = {
  id: string;
  saleId: string;
  receiptNumber: number;
  reason: string | null;
  totalRefund: number;
  status: string;
  createdAt: string;
  items: ReturnItem[];
};

type SaleForReturn = {
  id: string;
  receiptNumber: number;
  items: {
    saleItemId: string;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  saleDate: string;
};

type ReturnItemForm = {
  saleItemId: string;
  productName: string;
  maxQuantity: number;
  unitPrice: number;
  quantity: string;
};

export default function ReturnsPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sales, setSales] = useState<SaleForReturn[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [returnItems, setReturnItems] = useState<ReturnItemForm[]>([]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/returns");
      if (res.ok) {
        setReturns((await res.json()).returns);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const openCreate = async () => {
    setSelectedSaleId("");
    setReturnItems([]);
    setReason("");
    setShowModal(true);
    try {
      const res = await fetch("/api/dashboard/sales");
      if (res.ok) {
        setSales((await res.json()).sales);
      }
    } catch {
    }
  };

  const handleSaleSelect = (saleId: string) => {
    setSelectedSaleId(saleId);
    const sale = sales.find((s) => s.id === saleId);
    if (sale) {
      setReturnItems(
        sale.items.map((item) => ({
          saleItemId: item.saleItemId,
          productName: item.productName,
          maxQuantity: item.quantity,
          unitPrice: item.unitPrice,
          quantity: "1",
        }))
      );
    }
  };

  const updateItemQuantity = (index: number, qty: string) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    );
  };

  const totalRefund = returnItems.reduce(
    (sum, item) => sum + Number(item.quantity) * item.unitPrice,
    0
  );

  const handleSave = async () => {
    const validItems = returnItems.filter(
      (item) => Number(item.quantity) > 0 && Number(item.quantity) <= item.maxQuantity
    );
    if (validItems.length === 0) {
      toast("Seleccioná al menos un item para devolver", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: selectedSaleId,
          items: validItems.map((item) => ({
            saleItemId: item.saleItemId,
            quantity: Number(item.quantity),
          })),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error al crear devolución", "error");
        return;
      }
      setShowModal(false);
      fetchReturns();
      toast("Devolución registrada correctamente", "success");
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = returns.filter(
    (r) =>
      String(r.receiptNumber).includes(search) ||
      r.items.some(
        (item) =>
          item.productName.toLowerCase().includes(search.toLowerCase()) ||
          item.productSku.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">
            Devoluciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de devoluciones y reembolsos de ventas.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nueva devolución
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-danger to-red-700 text-white">
                <Undo2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  Total devoluciones
                </p>
                <p className="text-lg font-bold">
                  {moneyFormatter.format(
                    returns.reduce((sum, r) => sum + r.totalRefund, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  Total devueltos
                </p>
                <p className="text-lg font-bold">
                  {returns.reduce(
                    (sum, r) =>
                      sum + r.items.reduce((s, i) => s + i.quantity, 0),
                    0
                  )}{" "}
                  uds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle>Historial de devoluciones</CardTitle>
          <div className="relative max-w-sm mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ticket, producto o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Undo2}
              title={search ? "Sin resultados." : "No hay devoluciones"}
              description={search ? "Intentá con otros términos de búsqueda." : "Las devoluciones aparecerán acá cuando registres una desde el historial de ventas."}
            />
          ) : (
            <>
              <div className="hidden sm:block overflow-hidden rounded-xl border border-border">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="text-left">Fecha</th>
                      <th className="text-left">Ticket</th>
                      <th className="text-left">Items</th>
                      <th className="text-left">Reembolso</th>
                      <th className="text-left">Motivo</th>
                      <th className="text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ret) => (
                      <tr key={ret.id}>
                        <td className="text-sm text-muted-foreground">
                          {ret.createdAt.slice(0, 10)}
                        </td>
                        <td className="text-sm font-mono text-muted-foreground">
                          #{ret.receiptNumber}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {ret.items.map((item) => (
                              <Badge key={item.id} tone="muted">
                                {item.productName} x{item.quantity}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="text-sm font-bold">
                          {moneyFormatter.format(ret.totalRefund)}
                        </td>
                        <td className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {ret.reason || "—"}
                        </td>
                        <td>
                          <Badge
                            tone={
                              ret.status === "COMPLETED" ? "success" : "warning"
                            }
                          >
                            {ret.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:hidden">
                {filtered.map((ret) => (
                  <div
                    key={ret.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">
                            Ticket #{ret.receiptNumber}
                          </p>
                          <Badge
                            tone={
                              ret.status === "COMPLETED"
                                ? "success"
                                : "warning"
                            }
                          >
                            {ret.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ret.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <p className="text-sm font-bold shrink-0">
                        {moneyFormatter.format(ret.totalRefund)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ret.items.map((item) => (
                        <Badge key={item.id} tone="muted">
                          {item.productName} x{item.quantity}
                        </Badge>
                      ))}
                    </div>
                    {ret.reason && (
                      <p className="text-xs text-muted-foreground">
                        Motivo: {ret.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Nueva devolución</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Venta *</label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedSaleId}
                  onChange={(e) => handleSaleSelect(e.target.value)}
                >
                  <option value="">Seleccionar venta...</option>
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.receiptNumber} - {s.saleDate} -{" "}
                      {moneyFormatter.format(s.totalAmount)}
                    </option>
                  ))}
                </select>
              </div>

              {returnItems.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Items a devolver
                  </label>
                  <div className="space-y-2">
                    {returnItems.map((item, index) => (
                      <div
                        key={item.saleItemId}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Máx: {item.maxQuantity} uds -{" "}
                            {moneyFormatter.format(item.unitPrice)} c/u
                          </p>
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min="0"
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(index, e.target.value)
                            }
                          />
                        </div>
                        <p className="text-sm font-bold w-24 text-right">
                          {moneyFormatter.format(
                            Number(item.quantity) * item.unitPrice
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Motivo</label>
                <Input
                  placeholder="Motivo de la devolución (opcional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {totalRefund > 0 && (
                <div className="rounded-lg bg-primary-light p-3">
                  <p className="text-xs text-muted-foreground">
                    Total a reembolsar
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {moneyFormatter.format(totalRefund)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !selectedSaleId || returnItems.length === 0}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="h-4 w-4" />
                )}
                {saving ? "Procesando..." : "Registrar devolución"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
