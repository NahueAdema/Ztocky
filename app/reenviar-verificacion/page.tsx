"use client";

import { FormEvent, useState } from "react";
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ReenviarVerificacionPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/auth/resend-verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      setMessage(data.message);
    } else {
      setStatus("error");
      setMessage(data.error || "Error al reenviar.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reenviar verificación</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Ingresá el correo con el que te registraste y te mandamos un nuevo link de verificación.
        </p>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning-light/50 p-3 text-left text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Tip:</strong> Revisá también la carpeta de <strong>Spam / Correo no deseado</strong>.
            Si usás Gmail, a veces los mails de verificación quedan allí.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="ejemplo@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary"
          />

          {message && (
            <div className={`flex items-center gap-2.5 rounded-xl border p-3 text-sm ${
              status === "success"
                ? "border-success/20 bg-success-light/50 text-success"
                : "border-danger/20 bg-danger-light/50 text-danger"
            }`}>
              {status === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Reenviar link"
            )}
          </button>
        </form>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
