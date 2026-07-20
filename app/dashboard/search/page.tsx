"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Package, Factory, ShoppingCart, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SearchResult = {
  type: "product" | "supplier" | "sale" | "order" | "alert";
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: "default" | "danger" | "warning" | "success" | "muted";
  href: string;
};

const typeIcons: Record<string, typeof Search> = {
  product: Package,
  supplier: Factory,
  sale: ShoppingCart,
  order: FileText,
  alert: AlertTriangle,
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [productsRes, suppliersRes, ordersRes] = await Promise.all([
        fetch("/api/dashboard/products"),
        fetch("/api/dashboard/suppliers"),
        fetch("/api/dashboard/purchase-orders"),
      ]);

      const items: SearchResult[] = [];

      if (productsRes.ok) {
        const data = await productsRes.json();
        data.products
          .filter((p: { name: string; sku: string; category: string }) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.sku.toLowerCase().includes(q.toLowerCase()) ||
            (p.category ?? "").toLowerCase().includes(q.toLowerCase())
          )
          .forEach((p: { id: string; name: string; sku: string; category: string; currentStock: number; minStock: number }) => {
            items.push({
              type: "product",
              id: p.id,
              title: p.name,
              subtitle: `${p.sku} · Stock: ${p.currentStock}`,
              badge: p.category ?? "Producto",
              badgeTone: p.currentStock <= p.minStock ? "danger" : "success",
              href: "/dashboard/products",
            });
          });
      }

      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        data.suppliers
          .filter((s: { name: string; contactEmail: string }) =>
            s.name.toLowerCase().includes(q.toLowerCase()) ||
            (s.contactEmail ?? "").toLowerCase().includes(q.toLowerCase())
          )
          .forEach((s: { id: string; name: string; contactEmail: string; leadTime: number }) => {
            items.push({
              type: "supplier",
              id: s.id,
              title: s.name,
              subtitle: s.contactEmail ?? "Sin email",
              badge: `${s.leadTime}d lead`,
              badgeTone: "default",
              href: "/dashboard/suppliers",
            });
          });
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        data.orders
          .filter((o: { supplierName: string; id: string; status: string }) =>
            o.supplierName.toLowerCase().includes(q.toLowerCase()) ||
            o.id.toLowerCase().includes(q.toLowerCase())
          )
          .forEach((o: { id: string; supplierName: string; status: string; totalAmount: number }) => {
            items.push({
              type: "order",
              id: o.id,
              title: `Orden ${o.id.slice(0, 8).toUpperCase()}`,
              subtitle: `${o.supplierName}`,
              badge: o.status,
              badgeTone: o.status === "RECEIVED" ? "success" : o.status === "DRAFT" ? "muted" : "warning",
              href: "/dashboard/purchase-orders",
            });
          });
      }

      setResults(items);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    doSearch(query);
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Busqueda global</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buscar en productos, proveedores, ordenes y mas.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, SKU, proveedor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 pl-12 text-base rounded-xl"
            autoFocus
          />
        </div>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Buscando...</p>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold">Sin resultados para "{query}"</p>
          <p className="text-xs text-muted-foreground mt-1">Intenta con otros terminos.</p>
        </div>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = typeIcons[type] ?? Search;
            const labels: Record<string, string> = {
              product: "Productos",
              supplier: "Proveedores",
              order: "Ordenes",
              sale: "Ventas",
              alert: "Alertas",
            };
            return (
              <Card key={type} className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {labels[type] ?? type}
                    <Badge tone="muted">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(item.href)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                          </div>
                        </div>
                        <Badge tone={item.badgeTone}>{item.badge}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
