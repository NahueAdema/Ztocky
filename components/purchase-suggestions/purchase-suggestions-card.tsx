"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, RefreshCw, CheckCircle2, ChevronDown, ChevronRight, Truck, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";

type SuggestionItem = {
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  burnRate: number;
  daysRemaining: number;
  suggestedQty: number;
  unitPrice: number;
  priceEstimate: number;
  minOrderQty: number;
  daysOfCoverage: number;
};

type SuggestionGroup = {
  supplierId: string;
  supplierName: string;
  leadTime: number;
  items: SuggestionItem[];
  totalEstimate: number;
};

type Suggestions = {
  groups: SuggestionGroup[];
  summary: { totalProducts: number; totalOrders: number; totalEstimate: number };
};

export function PurchaseSuggestionsCard({ onOrdersCreated }: { onOrdersCreated?: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/purchase-suggestions");
      if (res.ok) setData(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const toggleGroup = (supplierId: string) => {
    setExpanded((prev) => ({ ...prev, [supplierId]: !prev[supplierId] }));
  };

  const handleCreate = async () => {
    if (!data || data.groups.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/purchase-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groups: data.groups.map((g) => ({
            supplierId: g.supplierId,
            items: g.items.map((i) => ({
              productId: i.productId,
              quantity: i.suggestedQty,
              unitPrice: i.unitPrice,
            })),
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult(body.message ?? "Órdenes creadas");
        toast(body.message ?? "Órdenes creadas", "success");
        onOrdersCreated?.();
        setData(null);
        fetchSuggestions();
      } else {
        toast(body.error ?? "No se pudieron crear las órdenes", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="card-hover border-dashed">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Calculando compra sugerida...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.groups.length === 0) {
    return null;
  }

  return (
    <Card className="card-hover border-primary/30 bg-primary-light/5 overflow-visible">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">Compra sugerida</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data.summary.totalProducts} producto{data.summary.totalProducts > 1 ? "s" : ""} necesitan reposición.
                Se generarán <strong className="text-foreground">{data.summary.totalOrders}</strong> orden{data.summary.totalOrders > 1 ? "es" : ""}
                {" "}por un total de <strong className="text-foreground">{moneyFormatter.format(data.summary.totalEstimate)}</strong>.
              </p>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <ShoppingCart className="h-4 w-4" />
            {creating ? "Creando..." : "Generar compra sugerida"}
          </Button>
        </div>

        {result && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-success-light p-3 text-sm text-success animate-slide-down">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="flex-1">{result}</span>
            <Link href="/dashboard/purchase-orders" className="shrink-0 font-semibold hover:underline">
              Ver órdenes →
            </Link>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {data.groups.map((group) => {
            const isOpen = expanded[group.supplierId];
            const hasUrgent = group.items.some((i) => i.daysRemaining <= group.leadTime);
            return (
              <div key={group.supplierId} className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.supplierId)}
                  className="flex w-full items-center justify-between gap-2 bg-muted/40 px-4 py-3 text-left transition hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="font-semibold truncate">{group.supplierName}</span>
                    <Badge tone="muted">{group.items.length}</Badge>
                    <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <Truck className="h-3 w-3" /> lead: {group.leadTime} días
                    </span>
                    {hasUrgent && (
                      <Badge tone="danger">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Urgente
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold shrink-0">{moneyFormatter.format(group.totalEstimate)}</span>
                </button>

                {isOpen && (
                  <div className="px-4 py-3">
                    <div className="hidden sm:grid grid-cols-[1fr_4rem_4rem_5rem_6rem] gap-2 text-xs font-medium text-muted-foreground px-1 pb-2">
                      <span>Producto</span>
                      <span className="text-center">Stock</span>
                      <span className="text-center">Sugerido</span>
                      <span className="text-right">P. unit.</span>
                      <span className="text-right">Subtotal</span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.productId} className="rounded-lg border border-border/60 p-2">
                          <div className="grid grid-cols-2 sm:grid-cols-[1fr_4rem_4rem_5rem_6rem] gap-2 items-center">
                            <div className="col-span-2 sm:col-span-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.productSku}</p>
                            </div>
                            <div className="text-sm text-center">
                              <span className="sm:hidden text-[10px] text-muted-foreground block">Stock</span>
                              <Badge tone={item.currentStock <= item.minStock ? "danger" : "muted"}>{item.currentStock}</Badge>
                            </div>
                            <div className="text-sm text-center">
                              <span className="sm:hidden text-[10px] text-muted-foreground block">Sug</span>
                              <span className="font-bold">{item.suggestedQty}</span>
                            </div>
                            <div className="text-sm text-right">
                              <span className="sm:hidden text-[10px] text-muted-foreground block">P. unit</span>
                              <span className="text-muted-foreground">{moneyFormatter.format(item.unitPrice)}</span>
                            </div>
                            <div className="text-sm text-right">
                              <span className="sm:hidden text-[10px] text-muted-foreground block">Subtotal</span>
                              <span className="font-semibold">{moneyFormatter.format(item.priceEstimate)}</span>
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-0.5">
                              <Package className="h-3 w-3" /> Cubre {item.daysOfCoverage === 999 ? "∞" : item.daysOfCoverage} días
                            </span>
                            {item.daysRemaining <= group.leadTime && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-danger/10 px-1.5 py-0.5 text-danger font-medium">
                                <AlertTriangle className="h-3 w-3" /> Se agota en {item.daysRemaining}d
                              </span>
                            )}
                            {item.suggestedQty < item.minOrderQty && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-warning/10 px-1.5 py-0.5 text-warning font-medium">
                                Mínimo: {item.minOrderQty}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
