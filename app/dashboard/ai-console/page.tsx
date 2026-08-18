"use client";

import { useState } from "react";
import {
  Bot,
  Database,
  Send,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Package,
  TrendingDown,
  ShoppingCart,
  Factory,
  BarChart3,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_QUERIES = [
  {
    category: "Stock",
    icon: Package,
    queries: [
      { label: "¿Qué productos se están agotando?", query: "¿Qué productos se están agotando más rápido y cuándo se quedan sin stock?" },
      { label: "Stock crítico actual", query: "¿Qué productos tienen stock crítico ahora mismo?" },
      { label: "Productos sin movimiento", query: "¿Qué productos no se vendieron en los últimos 30 días?" },
    ],
  },
  {
    category: "Ventas",
    icon: TrendingDown,
    queries: [
      { label: "Top productos vendidos", query: "¿Cuáles son los 5 productos más vendidos este mes?" },
      { label: "Productos con mayor margen", query: "¿Cuáles son los productos con mayor margen de ganancia?" },
      { label: "Resumen de ventas", query: "¿Cómo fueron las ventas del último mes comparado con el anterior?" },
    ],
  },
  {
    category: "Proveedores",
    icon: Factory,
    queries: [
      { label: "Mejor proveedor hoy", query: "¿Qué proveedor me conviene más hoy considerando precio, confiabilidad y tiempo de entrega?" },
      { label: "Comparar precios", query: "Compara los precios de los proveedores para los productos con mayor rotación." },
      { label: "Órdenes pendientes", query: "¿Cuántas órdenes de compra tenemos y cuáles están pendientes?" },
    ],
  },
  {
    category: "Acción",
    icon: Zap,
    queries: [
      { label: "¿Qué debería comprar?", query: "Basado en el stock actual y las ventas, ¿qué debería comprar esta semana y en qué cantidades?" },
      { label: "Recomendar proveedor", query: "Para los productos que necesitan reposición, ¿qué proveedor me recomiendás y por qué?" },
      { label: "Plan de reposición", query: "Generá un plan de reposición para la próxima semana con cantidades y proveedores sugeridos." },
    ],
  },
];

export default function AiConsolePage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleQuery = async (q?: string) => {
    const queryText = q || query.trim();
    if (!queryText) return;
    setQuery(queryText);
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al procesar la consulta");
        return;
      }
      setResult(data.answer);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4 animate-pulse" />
        Analizando tus datos...
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );

  const formatAnswer = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim().startsWith("-")) {
        return (
          <li key={i} className="ml-5 list-disc text-sm text-foreground/90">
            {line.trim().slice(1).trim()}
          </li>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      return (
        <p key={i} className="text-sm text-foreground/90 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal/20 mb-3">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">
          Consola IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg mx-auto">
          Consultá tu inventario en lenguaje natural. Ztocky analiza los datos reales y te responde con recomendaciones concretas.
        </p>
      </div>

      {/* Quick query cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK_QUERIES.map((group) => (
          <div key={group.category} className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <group.icon className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.category}</p>
            </div>
            {group.queries.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuery(q.query)}
                className="flex w-full items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-left text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary-light/50 hover:text-foreground disabled:opacity-50"
              >
                <MessageSquare className="h-3 w-3 shrink-0 text-primary/60" />
                {q.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Search bar */}
      <Card className="card-hover overflow-hidden border-primary/10">
        <div className="h-1 bg-gradient-to-r from-primary to-teal-400" />
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <MessageSquare className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery();
                  }
                }}
                placeholder="Escribí tu pregunta personalizada..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => handleQuery()}
              disabled={isLoading || !query.trim()}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Consultar
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card className={`card-hover ${result ? "border-success/20" : error ? "border-danger/20" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              result ? "bg-success-light" : error ? "bg-danger-light" : "bg-muted"
            }`}>
              {result ? (
                <Package className="h-4 w-4 text-success" />
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-danger" />
              ) : (
                <Database className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {result ? "Respuesta" : error ? "Error" : "Resultado"}
          </CardTitle>
          <CardDescription>
            {result
              ? "Respuesta generada basada en tus datos."
              : error
                ? "No se pudo completar la consulta."
                : "Seleccioná una consulta rápida o escribí tu propia pregunta."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="min-h-32 flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6">
              <LoadingSkeleton />
            </div>
          ) : result ? (
            <div className="rounded-xl border border-success/20 bg-success-light/10 p-5">
              <div className="prose prose-sm max-w-none">
                {formatAnswer(result)}
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger-light/30 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          ) : (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center px-4">
              <Bot className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Elegí una consulta o escribí tu pregunta
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                La IA analiza tus productos, ventas y proveedores en tiempo real.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
