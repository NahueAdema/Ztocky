import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.globalRole === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12" style={{ background: "linear-gradient(135deg, #0f2027 0%, #1a3a4a 40%, #038786 100%)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-20 h-48 w-48 rounded-full bg-accent blur-3xl" />
        </div>
        <Link href="/" className="relative z-10">
          <Image
            alt="Ztocky"
            className="h-12 w-auto rounded-lg object-contain brightness-0 invert"
            height={64}
            priority
            src="/logo.png"
            width={180}
          />
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-semibold uppercase text-white/60">
            Ingreso operativo
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white">
            Controlá tu stock antes de que el stock te controle.
          </h1>
          <p className="mt-4 text-lg leading-7 text-white/70">
            Cada usuario entra a su propio espacio de trabajo para separar productos,
            proveedores, alertas y ordenes.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {["Alertas de stock", "Proveedores", "Ordenes"].map((item) => (
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm" key={item}>
              <p className="text-sm font-medium text-white">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <Suspense>
          <AuthCard />
        </Suspense>
      </section>
    </main>
  );
}
