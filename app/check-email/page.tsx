import Link from "next/link";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Revisá tu correo</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Te enviamos un link de verificación. Hacé clic en el link para activar tu cuenta y poder ingresar.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Si no lo ves, revisá la carpeta de spam.
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
