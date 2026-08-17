import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toast";
import { PwaManager } from "@/components/pwa/pwa-manager";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ztocky — Gestión inteligente de stock y compras",
    template: "%s | Ztocky",
  },
  description:
    "Sistema inteligente de gestión de compras y stock. Analiza ventas, proyecta agotamientos, automatiza el reabastecimiento y optimiza tus decisiones de inventario.",
  keywords: [
    "gestión de stock",
    "control de inventario",
    "compras inteligentes",
    "reabastecimiento automático",
    "velocidad de venta",
    "proveedores",
    "dashboard inventario",
  ],

  openGraph: {
    title: "Ztocky — Gestión inteligente de stock y compras",
    description:
      "Analiza ventas, proyecta agotamientos y automatiza el reabastecimiento de tu inventario.",
    type: "website",
    locale: "es_AR",
    siteName: "Ztocky",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            {children}
            <PwaManager />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
