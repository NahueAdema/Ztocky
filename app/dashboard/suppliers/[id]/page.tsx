"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Truck, Clock, Mail, Phone, Package, TrendingUp, TrendingDown, ChevronRight, Factory, FileText, CheckCircle2, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { moneyFormatter } from "@/lib/format";

type DetailProduct = {
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  minOrderQty: number;
  isCheapest: boolean;
  cheapestPrice: number;
  supplierCount: number;
};

type RecentPriceIncrease = {
  productId: string;
  productName: string;
  productSku: string;
  previousPrice: number;
  newPrice: number;
  changeDate: string;
};

type SupplierDetail = {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  leadTime: number;
  shippingCost: number;
  reliability: number;
  notes: string | null;
  products: DetailProduct[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
    lastOrderStatus: string | null;
    lastOrderAmount: number | null;
    productCount: number;
    convenientCount: number;
  };
  recentPriceIncreases: RecentPriceIncrease[];
  summary: string;
};

const ORDER_LABELS: Record<string, string> = {
  DRAFT: "Borrador", SENT: "Enviada", CONFIRMED: "Confirmada",
  SHIPPED: "En camino", RECEIVED: "Recibida", CANCELLED: "Cancelada",
};

function SkeletonCard() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="mt-3 h-7 w-32 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border p-5">
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-4 w-full rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/suppliers/${id}/detail`);
      if (res.status === 404) {
        setError("Proveedor no encontrado");
      } else if (res.ok) {
        const data = await res.json();
        setSupplier(data.supplier);
      } else {
        setError("Error al cargar el proveedor");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonCard />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href="/dashboard/suppliers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a proveedores
        </Link>
        <EmptyState
          icon={Factory}
          title={error ?? "No encontrado"}
          description="No se pudo cargar la ficha de este proveedor."
        />
      </div>
    );
  }

  const isCheapestPct = supplier.stats.productCount > 0
    ? Math.round((supplier.stats.convenientCount / supplier.stats.productCount) * 100)
    : 0;

  const kpis = [
    {
      title: "Total comprado",
      value: moneyFormatter.format(supplier.stats.totalSpent),
      icon: FileText,
    },
    {
      title: "Órdenes",
      value: String(supplier.stats.totalOrders),
      icon: FileText,
    },
    {
      title: "Productos",
      value: String(supplier.stats.productCount),
      icon: Package,
    },
    {
      title: "Es el más barato en",
      value: `${supplier.stats.convenientCount} / ${supplier.stats.productCount}`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/dashboard/suppliers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a proveedores
      </Link>

      {/* Header */}
      <Card className="card-hover">
        <CardContent className="p-0">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-lg">
                  <Factory className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {supplier.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {supplier.contactEmail && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {supplier.contactEmail}
                      </span>
                    )}
                    {supplier.contactPhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {supplier.contactPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Lead time: {supplier.leadTime} días
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" /> Envío: {moneyFormatter.format(supplier.shippingCost)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className={`h-3.5 w-3.5 ${supplier.reliability >= 4.5 ? "text-warning" : "text-muted-foreground"}`} />
                      <span className={`font-bold ${supplier.reliability >= 4.5 ? "text-warning" : ""}`}>{supplier.reliability}</span>
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/purchase-orders"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted/60 active:scale-[0.98]"
              >
                Ver órdenes
              </Link>
            </div>
            {supplier.notes && (
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{supplier.notes}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.title}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Conveniencia */}
      {supplier.stats.productCount > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Conveniencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{supplier.summary}</p>
            <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCheapestPct >= 60 ? "bg-success" : isCheapestPct >= 35 ? "bg-warning" : "bg-danger"}`}
                style={{ width: `${isCheapestPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {supplier.stats.convenientCount} de {supplier.stats.productCount} productos ({isCheapestPct}%)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Productos del catálogo */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            Productos que provee
            <Badge tone="default">{supplier.products.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Sin productos"
              description="Este proveedor no tiene productos en su catálogo todavía."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="text-left">Producto</th>
                    <th className="text-right">Precio</th>
                    <th className="text-left">Min. pedido</th>
                    <th className="text-left">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.products.map((p) => {
                    const diffPct = p.cheapestPrice > 0
                      ? Math.round(((p.unitPrice - p.cheapestPrice) / p.cheapestPrice) * 100)
                      : 0;
                    return (
                      <tr key={p.productId}>
                        <td>
                          <p className="font-semibold">{p.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.productSku}</p>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold">{moneyFormatter.format(p.unitPrice)}</span>
                          {p.supplierCount > 1 && !p.isCheapest && (
                            <p className={`text-[10px] font-medium ${diffPct > 0 ? "text-danger" : "text-muted-foreground"}`}>
                              {diffPct > 0 ? `+${diffPct}% vs el más barato` : "el más barato"}
                            </p>
                          )}
                        </td>
                        <td>{p.minOrderQty}</td>
                        <td>
                          {p.isCheapest ? (
                            <Badge tone="success">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Más barato
                            </Badge>
                          ) : p.supplierCount > 1 ? (
                            <Badge tone="warning">
                              <TrendingDown className="h-3 w-3 mr-1" /> {moneyFormatter.format(p.cheapestPrice)} en otro
                            </Badge>
                          ) : (
                            <Badge tone="muted">
                              <Minus className="h-3 w-3 mr-1" /> Único
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aumentos de precio recientes */}
      {supplier.recentPriceIncreases.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-danger" />
              Aumentos recientes (30 días)
              <Badge tone="danger">{supplier.recentPriceIncreases.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {supplier.recentPriceIncreases.map((r) => {
                const diffPct = r.previousPrice > 0
                  ? Math.round(((r.newPrice - r.previousPrice) / r.previousPrice) * 100)
                  : 0;
                return (
                  <div key={r.productId} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.productSku}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground line-through">{moneyFormatter.format(r.previousPrice)}</span>
                      <span className="text-sm font-bold text-danger">{moneyFormatter.format(r.newPrice)}</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">
                        <TrendingUp className="h-3 w-3" /> +{diffPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Última compra */}
      {supplier.stats.lastOrderDate && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Última compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>
                <span className="text-muted-foreground">Fecha: </span>
                <span className="font-medium">{new Date(supplier.stats.lastOrderDate).toLocaleDateString("es-AR")}</span>
              </span>
              {supplier.stats.lastOrderStatus && (
                <span>
                  <span className="text-muted-foreground">Estado: </span>
                  <span className="font-medium">{ORDER_LABELS[supplier.stats.lastOrderStatus] ?? supplier.stats.lastOrderStatus}</span>
                </span>
              )}
              {supplier.stats.lastOrderAmount !== null && (
                <span>
                  <span className="text-muted-foreground">Monto: </span>
                  <span className="font-bold text-primary">{moneyFormatter.format(supplier.stats.lastOrderAmount)}</span>
                </span>
              )}
              <Link href="/dashboard/purchase-orders" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Ver todas las órdenes <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
