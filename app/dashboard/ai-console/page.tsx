"use client";

import { useState } from "react";
import { Bot, Database, Send, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const examples = [
  "Que producto no se vendio en 30 dias?",
  "Cuales se agotan antes del viernes?",
  "Que proveedor conviene si necesito entrega urgente?",
];

export default function AiConsolePage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Consola IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta tu inventario en lenguaje natural.
        </p>
      </div>

      <Card className="card-hover border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo text-white">
              <Bot className="h-4 w-4" />
            </div>
            Consulta inteligente
          </CardTitle>
          <CardDescription>
            Escribe tu pregunta y el engine buscara la respuesta en tu base de
            datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input + botón: columna en mobile, fila en sm+ */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Ej: que producto me hizo perder mas dinero?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuery();
              }}
              className="flex-1"
            />
            <Button
              onClick={handleQuery}
              disabled={isLoading || !query.trim()}
              className="w-full sm:w-auto"
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
            </Button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Consultas de ejemplo
            </p>
            {/* 1 col mobile, 3 col sm+ */}
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuery(example)}
                  className="flex items-start gap-2 rounded-xl border border-border p-3 text-left text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-primary-light hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {example}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
              <Database className="h-4 w-4 text-accent-foreground" />
            </div>
            Resultado
          </CardTitle>
          <CardDescription>
            Respuesta generada por el motor de IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <Sparkles className="h-10 w-10 animate-pulse text-primary" />
              <p className="mt-3 text-sm font-medium">
                Analizando tu consulta...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Groq esta procesando tu pregunta
              </p>
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center px-4">
              <Database className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Sin consulta activa
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Escribe una pregunta para ver el resultado aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
