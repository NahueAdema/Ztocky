"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-light">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No se encontró un token de restablecimiento. Solicitá uno nuevo.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Solicitar link
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al restablecer la contraseña.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-light">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Contraseña restablecida</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ya podés ingresar con tu nueva contraseña.
          </p>
          <Button className="mt-6 h-11" onClick={() => router.push("/login")}>
            Ir al inicio de sesión
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresá tu nueva contraseña.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className="pr-10"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              Repetir contraseña
            </label>
            <Input
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button className="h-11 w-full" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Restablecer contraseña"}
          </Button>
        </form>
      </div>
    </main>
  );
}
