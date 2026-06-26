"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al procesar la solicitud.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-light">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Revisá tu correo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Si existe una cuenta con ese correo, recibirás un link para restablecer tu contraseña.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Olvidaste tu contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresá tu correo y te enviaremos un link para restablecerla.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Correo electrónico
            </label>
            <Input
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              type="email"
              value={email}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button className="h-11 w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      </div>
    </main>
  );
}
