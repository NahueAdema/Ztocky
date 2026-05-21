"use client";

import { useCallback, useEffect, useState } from "react";
import { User, Bell, Shield, Key, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; cuitCuil: string | null } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cuitCuil, setCuitCuil] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setName(data.name);
        setEmail(data.email);
        setCuitCuil(data.cuitCuil ?? "");
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cuitCuil }),
      });
      if (res.ok) {
        setMsg("Datos actualizados correctamente");
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestioná tu cuenta y preferencias.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-success/20 bg-success-light/50 p-4 text-sm font-medium text-success animate-slide-down">
          {msg}
        </div>
      )}

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <User className="h-4 w-4" />
            </div>
            Perfil
          </CardTitle>
          <CardDescription>Informacion personal de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar.</p>
          </div>
          <div>
            <label className="text-sm font-medium">CUIT/CUIL</label>
            <Input value={cuitCuil} onChange={(e) => setCuitCuil(e.target.value)} placeholder="22-44567867-9" />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
              <Shield className="h-4 w-4 text-accent-foreground" />
            </div>
            Cuenta
          </CardTitle>
          <CardDescription>Informacion de tu cuenta y workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Rol global</p>
              <p className="text-xs text-muted-foreground">Permisos de administrador del sistema</p>
            </div>
            <Badge tone={user && "globalRole" in user && user.globalRole === "SUPER_ADMIN" ? "danger" : "muted"}>
              {user && "globalRole" in user ? String(user.globalRole) : "USER"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Workspace</p>
              <p className="text-xs text-muted-foreground">Espacio de trabajo actual</p>
            </div>
            <Badge tone="default">{user && "workspaceName" in user ? String(user.workspaceName) : "Mi comercio"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover border-danger/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger text-white">
              <Trash2 className="h-4 w-4" />
            </div>
            Zona de peligro
          </CardTitle>
          <CardDescription>Acciones irreversibles.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Estas acciones no se pueden deshacer. Contacta a soporte si necesitas ayuda.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="text-danger border-danger/20 hover:bg-danger-light">
              <Key className="h-4 w-4" />
              Cambiar contrasena
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
