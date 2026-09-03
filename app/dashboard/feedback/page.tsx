"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { value: "BUG", label: "Bug" },
  { value: "IMPROVEMENT", label: "Mejora" },
  { value: "SUGGESTION", label: "Sugerencia" },
  { value: "OTHER", label: "Otro" },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];

const toneMap: Record<FeedbackType, "danger" | "success" | "accent" | "muted"> = {
  BUG: "danger",
  IMPROVEMENT: "success",
  SUGGESTION: "accent",
  OTHER: "muted",
};

export default function FeedbackPage() {
  const { toast } = useToast();
  const [type, setType] = useState<FeedbackType>("BUG");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = message.trim().length >= 10 && !sending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSending(true);
    try {
      const res = await fetch("/api/dashboard/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), email: email.trim() || undefined }),
      });

      if (!res.ok) throw new Error("Error al enviar");

      setSent(true);
      toast("Feedback enviado", "success");
    } catch {
      toast("Error al enviar el feedback. Intentá de nuevo.", "error");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mb-5">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-xl font-semibold mb-2">¡Gracias! Tu feedback fue enviado.</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Valoramos tu tiempo y tu opinión. Nos ayudás a hacer mejor Ztocky para todos.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => { setSent(false); setType("BUG"); setMessage(""); setEmail(""); }}
        >
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Ayudanos a mejorar</h1>
          <p className="text-sm text-muted-foreground">
            Tu opinión nos ayuda a hacer mejor Ztocky. Contanos qué funciona, qué no, o qué te gustaría ver.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de feedback</label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => setType(ft.value)}
                    className={cn(
                      "inline-flex min-h-6 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                      type === ft.value
                        ? toneMap[ft.value] === "danger"
                          ? "bg-danger/10 text-danger border-danger/30"
                          : toneMap[ft.value] === "success"
                            ? "bg-success/10 text-success border-success/30"
                            : toneMap[ft.value] === "accent"
                              ? "bg-accent-light text-accent border-accent/30"
                              : "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border/50 hover:bg-muted/80",
                    )}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="feedback-message" className="text-sm font-medium">
                Mensaje
              </label>
              <textarea
                id="feedback-message"
                required
                minLength={10}
                rows={5}
                placeholder="Describí tu feedback con el mayor detalle posible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/10 caracteres mínimos
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="feedback-email" className="text-sm font-medium">
                Email <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" disabled={!canSubmit} className="w-full">
              {sending ? "Enviando..." : "Enviar feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
