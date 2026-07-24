"use client";

import { useCallback, useEffect, useState } from "react";
import { Gauge, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Product = {
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  burnRate: number;
  daysRemaining: number;
  margin: number;
  lastSale: string;
};

export default function SimulatorPage() {
  const [demandIncrease, setDemandIncrease] = useState(30);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const simulatedProducts = products.map((p) => {
    const projectedBurnRate = p.burnRate * (1 + demandIncrease / 100);
    const currentDays = p.burnRate > 0 ? Math.floor(p.currentStock / p.burnRate) : 999;
    const projectedDays = projectedBurnRate > 0 ? Math.floor(p.currentStock / projectedBurnRate) : 999;
    const willCollapse = projectedDays <= 7 && currentDays > 7;
    return { ...p, projectedBurnRate, currentDays, projectedDays, willCollapse };
  }).sort((a, b) => a.projectedDays - b.projectedDays);

  const collapseCount = simulatedProducts.filter((p) => p.willCollapse).length;
  const attentionCount = simulatedProducts.filter((p) => !p.willCollapse && p.projectedDays <= 14).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Simulador de demanda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proyecta como cambia el stock si las ventas aumentan o disminuyen.
        </p>
      </div>

      <Card className="card-hover border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Gauge className="h-4 w-4" />
            </div>
            Configurar escenario
          </CardTitle>
          <CardDescription>Ajusta el porcentaje de cambio en la demanda para ver el impacto.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium">Aumento de demanda (%)</label>
            <Input
              type="number"
              value={demandIncrease}
              onChange={(e) => setDemandIncrease(Number(e.target.value))}
              aria-label="Aumento de demanda"
              className="text-lg font-bold"
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-gradient-to-r from-primary-light to-accent-soft p-4">
            <Zap className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Con {demandIncrease > 0 ? "+" : ""}{demandIncrease}% de ventas, el stock se agota más rápido y se reducen los días restantes por producto.
            </p>
          </div>
        </CardContent>
      </Card>

      {collapseCount > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger-light/50 p-4 flex items-center gap-3 animate-slide-down">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-danger">{collapseCount} producto{collapseCount > 1 ? "s" : ""} colapsarían</p>
            <p className="text-xs text-danger/80">Con este aumento de demanda, estos productos se agotarían en menos de 7 días.</p>
          </div>
        </div>
      )}

      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Impacto proyectado</CardTitle>
              <CardDescription>Productos ordenados por riesgo de agotamiento bajo el escenario actual.</CardDescription>
            </div>
            <div className="flex gap-2">
              {collapseCount > 0 && <Badge tone="danger">{collapseCount} colapsan</Badge>}
              {attentionCount > 0 && <Badge tone="warning">{attentionCount} atención</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : simulatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Gauge className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Sin productos</p>
              <p className="text-xs text-muted-foreground mt-1">Agrega productos para simular escenarios.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="text-left">Producto</th>
                    <th className="text-left">Stock</th>
                    <th className="text-left">Burn actual</th>
                    <th className="text-left">Burn proyectado</th>
                    <th className="text-left">Días actuales</th>
                    <th className="text-left">Días proyectados</th>
                    <th className="text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {simulatedProducts.map((product) => (
                    <tr key={product.sku}>
                      <td>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                      </td>
                      <td>
                        <span className="inline-flex h-7 items-center justify-center rounded-md bg-muted px-2 text-xs font-bold">
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="text-sm">{product.burnRate}/dia</td>
                      <td className="text-sm font-bold text-primary">{product.projectedBurnRate.toFixed(1)}/dia</td>
                      <td className="text-sm">{product.currentDays}</td>
                      <td>
                        <span className={`text-sm font-bold ${product.projectedDays <= 7 ? "text-danger" : ""}`}>
                          {product.projectedDays}
                        </span>
                      </td>
                      <td>
                        {product.willCollapse ? (
                          <Badge tone="danger">
                            <TrendingDown className="mr-1 h-3 w-3" />
                            Colapsa
                          </Badge>
                        ) : product.projectedDays <= 14 ? (
                          <Badge tone="warning">Atención</Badge>
                        ) : (
                          <Badge tone="success">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Estable
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
