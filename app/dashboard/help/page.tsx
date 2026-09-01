"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  MessageSquare,
  BookOpen,
  Mail,
  Bot,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  CreditCard,
  ShieldCheck,
  Wifi,
  Camera,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    category: "Primeros pasos",
    questions: [
      {
        q: "¿Cómo agrego productos a mi inventario?",
        a: "Andá a la sección Productos y usá el botón \"Nuevo producto\". Podés cargarlos uno por uno, o subir un archivo CSV/Excel con varios a la vez desde la opción de importación.",
      },
      {
        q: "¿Cómo invito a alguien a trabajar conmigo?",
        a: "Abrí el menú de tu usuario (esquina superior derecha) → Equipo. Desde ahí podés enviar una invitación por email y elegir si la persona será Miembro o Administrador.",
      },
      {
        q: "¿Qué es un workspace?",
        a: "Es tu espacio de trabajo: agrupa los productos, ventas, proveedores y miembros de tu negocio. Todo lo que cargues queda dentro de ese espacio.",
      },
    ],
  },
  {
    category: "Punto de venta (POS)",
    questions: [
      {
        q: "¿Cómo cobro una venta?",
        a: "En el Punto de Venta, agregá los productos al carrito, elegí el método de pago (efectivo, tarjeta, transferencia o cuenta corriente) y presioná Cobrar. Podés aplicar descuentos por producto o al total.",
      },
      {
        q: "¿Cómo escaneo códigos de barras con la cámara?",
        a: "En el POS, tocá el botón de la cámara. Necesitás conexión HTTPS y aceptar el permiso de cámara. En iOS abrí la web desde Safari (no desde la app instalada). Android funciona tanto en Chrome como en la app.",
      },
      {
        q: "¿Qué es la apertura de caja?",
        a: "Es controlar cuánto efectivo hay al iniciar y al cerrar el día. Al abrir la caja indicás el efectivo inicial; al cerrar, marcás el final y el sistema calcula la diferencia.",
      },
      {
        q: "¿Cómo hago una devolución?",
        a: "En la sección Devoluciones, seleccioná la venta que querés anular, elegí los productos a devolver y confirmá. El stock se restaura automáticamente.",
      },
    ],
  },
  {
    category: "Inventario y stock",
    questions: [
      {
        q: "¿Qué significa una alerta de stock?",
        a: "El sistema vigila tu stock y te avisa cuando algo baja de nivel. Hay tres tipos: bajo (LOW_STOCK), crítico (CRITICAL_STOCK, se agota pronto) y sin movimiento (STAGNANT_STOCK, no se vende hace tiempo).",
      },
      {
        q: "¿Cómo se calcula el \"burn rate\"?",
        a: "Es la velocidad a la que vendés un producto, calculada con tus últimos 30 días de ventas. Sirve para estimar cuándo se va a agotar y cuánto conviene pedir.",
      },
      {
        q: "¿Cómo registro una orden de compra?",
        a: "En la sección Órdenes creás una orden nueva, elegís el proveedor, agregás los productos con cantidad y precio, y la vas moviendo de estado: borrador → enviada → confirmada → recibida.",
      },
    ],
  },
  {
    category: "Facturación y pagos",
    questions: [
      {
        q: "¿Puedo vender a cuenta corriente?",
        a: "Sí. En el POS elegí el método \"Cta Cte\" y vinculá un cliente. La deuda queda registrada en la ficha del cliente y podés cargar pagos después.",
      },
      {
        q: "¿Cómo descargo o imprimo un ticket?",
        a: "Al finalizar una venta, la pantalla de confirmación te deja descargar el ticket en PDF o imprimirlo directamente. Tiene formato térmico 80mm.",
      },
    ],
  },
  {
    category: "Cuenta y seguridad",
    questions: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Entrá a tu perfil desde el menú de usuario → Configuración, y ahí vas a encontrar la opción para actualizar tu contraseña.",
      },
      {
        q: "¿Puedo usar Ztocky en el celular?",
        a: "Sí. Ztocky es una app web progresiva (PWA): la podés agregar a la pantalla de inicio desde el navegador del celular y usarla como una app instalada, incluso con notificaciones.",
      },
    ],
  },
];

const contactCards = [
  {
    title: "Guía de uso",
    description: "Guía completa por sección con atajos de teclado y ejemplos.",
    icon: BookOpen,
    href: "/dashboard/guide",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Consola IA",
    description: "Preguntale a la IA sobre tu inventario, ventas y proveedores.",
    icon: Bot,
    href: "/dashboard/ai-console",
    color: "bg-teal-500/10 text-teal-600",
  },
  {
    title: "Feedback",
    description: "Reportá un problema, pedí una función o dejá una sugerencia.",
    icon: MessageSquare,
    href: "/dashboard/feedback",
    color: "bg-accent/10 text-accent",
  },
];

const categoryIcon: Record<string, typeof Package> = {
  "Primeros pasos": Users,
  "Punto de venta (POS)": ShoppingCart,
  "Inventario y stock": Package,
  "Facturación y pagos": CreditCard,
  "Cuenta y seguridad": ShieldCheck,
};

export default function HelpPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal/20 mb-3">
          <HelpCircle className="h-7 w-7 text-white" />
        </div>
        <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">Centro de ayuda</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg mx-auto">
          Respuestas a las preguntas más frecuentes. No encontrás lo que buscás? Contactanos.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {contactCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary-light/40">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold group-hover:text-primary transition-colors">{card.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.description}</p>
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            Preguntas frecuentes
          </CardTitle>
          <CardDescription>
            Marcá la pregunta para ver la respuesta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {faqs.map((group) => {
            const Icon = categoryIcon[group.category] ?? Package;
            return (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.category}</h3>
                </div>
                <div className="space-y-2">
                  {group.questions.map((fq) => {
                    const key = `${group.category}-${fq.q}`;
                    const isOpen = open === key;
                    return (
                      <div key={key} className="overflow-hidden rounded-xl border border-border/70">
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : key)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40"
                        >
                          {fq.q}
                          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="border-t border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground/80 leading-relaxed">
                            {fq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Still need help */}
      <div className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 to-teal-500/5 p-6 text-center">
        <Mail className="h-6 w-6 text-primary mx-auto" />
        <h3 className="mt-2 text-base font-semibold">¿Necesitás más ayuda?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mandanos un mensaje por el formulario de feedback y te respondemos lo antes posible.
        </p>
        <Link
          href="/dashboard/feedback"
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition hover:bg-primary-dark"
        >
          <MessageSquare className="h-4 w-4" />
          Enviar feedback
        </Link>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge tone="muted">Soporte</Badge>
          <Badge tone="muted">Helpdesk</Badge>
        </div>
      </div>
    </div>
  );
}
