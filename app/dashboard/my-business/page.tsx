"use client";

import { useEffect, useState } from "react";
import { Store, Save, Receipt, Shield, Landmark, MapPin, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type StoreSettings = {
  businessName: string | null;
  cuit: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  contactEmail: string | null;
  taxRegime: string | null;
  saleConditions: string | null;
  maxDiscountPct: number;
  voidPermission: string;
};

export default function MyBusinessPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/dashboard/workspace/store-settings");
        if (res.ok) setSettings(await res.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const update = (field: keyof StoreSettings, value: string | number) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const saveSection = async (section: string, data: Record<string, unknown>) => {
    setSaving(section);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/workspace/store-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setSettings(result.settings);
        setMsg("Guardado correctamente");
        setTimeout(() => setMsg(null), 3000);
        toast("Configuración guardada", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "Error al guardar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="page-title text-3xl font-bold tracking-tight">Mi negocio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Mi negocio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurá los datos de tu comercio, impuestos, comprobantes y reglas de venta.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-success/20 bg-success-light/50 p-4 text-sm font-medium text-success animate-slide-down">
          {msg}
        </div>
      )}

      {/* ── Datos del negocio ── */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Store className="h-4 w-4" />
            </div>
            Datos del negocio
          </CardTitle>
          <CardDescription>Información fiscal y de contacto de tu comercio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Razón social</label>
              <Input
                value={settings.businessName ?? ""}
                onChange={(e) => update("businessName", e.target.value)}
                placeholder="Mi comercio S.R.L."
              />
              <p className="text-[11px] text-muted-foreground mt-1">Aparece en los tickets y comprobantes.</p>
            </div>
            <div>
              <label className="text-sm font-medium">CUIT</label>
              <Input
                value={settings.cuit ?? ""}
                onChange={(e) => update("cuit", e.target.value)}
                placeholder="20-12345678-9"
              />
              <p className="text-[11px] text-muted-foreground mt-1">CUIT o CUIL del responsable.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={settings.address ?? ""}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Av. Corrientes 1234"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Localidad</label>
              <Input
                value={settings.city ?? ""}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Buenos Aires"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={settings.phone ?? ""}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email de contacto</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={settings.contactEmail ?? ""}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="info@micomercio.com"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <Button onClick={() => saveSection("business", {
            businessName: settings.businessName,
            cuit: settings.cuit,
            address: settings.address,
            city: settings.city,
            phone: settings.phone,
            contactEmail: settings.contactEmail,
          })} disabled={saving === "business"}>
            <Save className="h-4 w-4" />
            {saving === "business" ? "Guardando..." : "Guardar datos del negocio"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Régimen fiscal ── */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
              <Landmark className="h-4 w-4 text-accent" />
            </div>
            Régimen fiscal
          </CardTitle>
          <CardDescription>Tu condición impositiva. Define cómo se emiten los comprobantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Régimen impositivo</label>
              <select
                value={settings.taxRegime ?? ""}
                onChange={(e) => update("taxRegime", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Seleccionar...</option>
                <option value="MONOTRIBUTO">Monotributo</option>
                <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                <option value="EXENTO">Exento</option>
              </select>
            </div>
          </div>
          <Button onClick={() => saveSection("tax", { taxRegime: settings.taxRegime })} disabled={saving === "tax"}>
            <Save className="h-4 w-4" />
            {saving === "tax" ? "Guardando..." : "Guardar régimen fiscal"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Condiciones de venta ── */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            Condiciones de venta
          </CardTitle>
          <CardDescription>Texto que aparece en los tickets y comprobantes de venta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Condiciones de venta</label>
            <textarea
              value={settings.saleConditions ?? ""}
              onChange={(e) => update("saleConditions", e.target.value)}
              placeholder="Ej: Contado, transferencia bancaria, tarjetas de crédito/débito. Cuenta corriente a 30 días."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-y"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Opcional. Se muestra al pie de los comprobantes.</p>
          </div>
          <Button onClick={() => saveSection("saleConditions", { saleConditions: settings.saleConditions })} disabled={saving === "saleConditions"}>
            <Save className="h-4 w-4" />
            {saving === "saleConditions" ? "Guardando..." : "Guardar condiciones"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Reglas de venta ── */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <Shield className="h-4 w-4 text-warning" />
            </div>
            Reglas de venta
          </CardTitle>
          <CardDescription>Controlá descuentos y permisos de anulación en el punto de venta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tope de descuento (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.maxDiscountPct}
                onChange={(e) => update("maxDiscountPct", Math.max(0, Math.min(100, Number(e.target.value))))}
                placeholder="0 = sin límite"
              />
              <p className="text-[11px] text-muted-foreground mt-1">0 = sin límite. 50 = máximo 50% de descuento.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Quién puede anular ventas</label>
              <select
                value={settings.voidPermission}
                onChange={(e) => update("voidPermission", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ONLY_OWNER">Solo propietario</option>
                <option value="OWNER_ADMIN">Propietario y administrador</option>
                <option value="ALL">Todos los miembros</option>
              </select>
            </div>
          </div>
          <Button onClick={() => saveSection("rules", { maxDiscountPct: settings.maxDiscountPct, voidPermission: settings.voidPermission })} disabled={saving === "rules"}>
            <Save className="h-4 w-4" />
            {saving === "rules" ? "Guardando..." : "Guardar reglas"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
