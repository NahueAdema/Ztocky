"use client";

import { FormEvent, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

export function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const verified = searchParams.get("verified") === "true";
  const tokenError = searchParams.get("error");

  const tokenErrorMsg = tokenError === "token-invalido"
    ? "Link de verificación inválido."
    : tokenError === "token-expirado"
      ? "El link de verificación expiró. Registrate de nuevo."
    : tokenError === "error-verificacion"
      ? "Error al verificar. Intentalo de nuevo."
    : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "No pudimos procesar la solicitud.");
      return;
    }

    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        <p className="text-2xl font-bold text-primary">Ztocky</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "register"
            ? "Creá tu cuenta para empezar"
            : "Ingresá a tu cuenta"}
        </p>
      </div>

      {verified && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-success/20 bg-success-light/50 p-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Email verificado correctamente. Ya podés ingresar.
        </div>
      )}

      {tokenErrorMsg && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-danger/20 bg-danger-light/50 p-3 text-sm text-danger">
          {tokenErrorMsg}
        </div>
      )}

      <div className="mb-6 flex rounded-lg border border-border bg-muted p-1">
        <button
          className={`flex-1 h-9 rounded-md text-sm font-medium transition ${
            mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Ingresar
        </button>
        <button
          className={`flex-1 h-9 rounded-md text-sm font-medium transition ${
            mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setMode("register")}
          type="button"
        >
          Registro
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/[0.04]">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <AuthField icon={UserRound} label="Nombre y Apellido">
                <Input
                  autoComplete="name"
                  name="name"
                  placeholder="Juan Perez"
                />
              </AuthField>
              <AuthField icon={IdCard} label="CUIT/CUIL (opcional)">
                <Input
                  name="cuitCuil"
                  placeholder="22-44567867-9"
                />
              </AuthField>
            </>
          )}

          <AuthField icon={Mail} label="Correo electronico">
            <Input
              autoComplete="email"
              name="email"
              placeholder="ejemplo@gmail.com"
              type="email"
            />
          </AuthField>

          <AuthField icon={LockKeyhole} label="Contrasena">
            <div className="relative">
              <Input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="pr-10"
                name="password"
                placeholder="********"
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </AuthField>

          {mode === "register" && (
            <AuthField icon={LockKeyhole} label="Repetir contrasena">
              <Input
                autoComplete="new-password"
                name="confirmPassword"
                placeholder="********"
                type={showPassword ? "text" : "password"}
              />
            </AuthField>
          )}

          {error && (
            <div className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              <p className="font-medium">{error}</p>
              {error.includes("Verificá tu email") && (
                <Link
                  href="/reenviar-verificacion"
                  className="mt-1 inline-block font-semibold text-primary hover:underline"
                >
                  Reenviar link de verificación
                </Link>
              )}
            </div>
          )}

          <Button className="h-11 w-full" disabled={isLoading}>
            {isLoading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Ingresar"}
          </Button>

          {mode === "login" && (
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Olvidaste tu contraseña?
              </Link>
            </div>
          )}
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o continuá con</span>
          </div>
        </div>

        <a
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition hover:bg-muted"
          href="/api/auth0/login"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </a>
      </div>
    </div>
  );
}

function AuthField({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
      {children}
    </div>
  );
}
