import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="relative mb-8">
          <Image
            src="/404.png"
            alt="Ztocky no encuentra la página"
            width={224}
            height={224}
            className="h-48 w-48 object-contain drop-shadow-xl sm:h-56 sm:w-56"
            priority
          />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
          404
        </h1>
        <p className="mt-2 text-lg font-semibold text-foreground">
          Upa, Ztocky se perdió
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Buscó por todos lados pero no encontró lo que buscás. 
          La página no existe o fue movida.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-dark active:scale-[0.97]"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al login
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-xs text-muted-foreground">
        Ztocky — {new Date().getFullYear()}
      </footer>
    </main>
  );
}
