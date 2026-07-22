"use client";

import { useEffect, useState } from "react";
import { User, Shield, Key, Trash2, Save, Mail, CheckCircle2, Clock, Send, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MembersPanel } from "@/components/dashboard/members-panel";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    cuitCuil: string | null;
    emailVerified: boolean;
    globalRole: string;
    workspaceName: string;
    role: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cuitCuil, setCuitCuil] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [savingWs, setSavingWs] = useState(false);
  const [wsMsg, setWsMsg] = useState<string | null>(null);

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setName(data.name);
          setEmail(data.email);
          setCuitCuil(data.cuitCuil ?? "");
          setWorkspaceName(data.workspaceName || "");
        }
      } catch {
        // silently fail
      }
    };
    fetchUserData();
  }, []);

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
        toast("Perfil actualizado", "success");
      } else {
        toast("No se pudo guardar el perfil", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setSavingWs(true);
    setWsMsg(null);
    try {
      const res = await fetch("/api/dashboard/workspace/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      if (res.ok) {
        setWsMsg("Nombre del comercio actualizado");
        setTimeout(() => setWsMsg(null), 3000);
        toast("Nombre del workspace actualizado", "success");
      } else {
        toast("No se pudo guardar el nombre", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSavingWs(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMsg(data.message || data.error || "Reenviado.");
    } catch {
      setResendMsg("Error al reenviar.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Configuración</h1>
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
          <CardDescription>Información personal de tu cuenta.</CardDescription>
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
              <Shield className="h-4 w-4 text-accent" />
            </div>
            Cuenta
          </CardTitle>
          <CardDescription>Información de tu cuenta y workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Rol global</p>
              <p className="text-xs text-muted-foreground">Permisos de administrador del sistema</p>
            </div>
            <Badge tone={user?.globalRole === "SUPER_ADMIN" ? "danger" : "muted"}>
              {user?.globalRole ?? "USER"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Comercio</p>
                <p className="text-xs text-muted-foreground">Tu espacio de trabajo</p>
              </div>
            </div>
            <Badge tone="default">{user?.role ?? "OWNER"}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email verificado</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.emailVerified ? (
                <Badge tone="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Verificado
                </Badge>
              ) : (
                <>
                  <Badge tone="warning">
                    <Clock className="h-3 w-3" />
                    Pendiente
                  </Badge>
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    <Send className="h-3 w-3" />
                    {resending ? "..." : "Reenviar"}
                  </Button>
                </>
              )}
            </div>
          </div>
          {resendMsg && (
            <p className="text-xs text-muted-foreground text-center">{resendMsg}</p>
          )}
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Building2 className="h-4 w-4" />
            </div>
            Comercio
          </CardTitle>
          <CardDescription>Nombre y configuración de tu espacio de trabajo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wsMsg && (
            <div className="rounded-lg bg-success-light/50 p-3 text-sm text-success">{wsMsg}</div>
          )}
          <div>
            <label className="text-sm font-medium">Nombre del comercio</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Mi comercio"
              />
              <Button onClick={handleSaveWorkspace} disabled={savingWs || !workspaceName.trim()} className="shrink-0">
                <Save className="h-4 w-4" />
                {savingWs ? "..." : "Guardar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Este nombre se muestra en el sidebar y en las invitaciones.
            </p>
          </div>
        </CardContent>
      </Card>

      <MembersPanel />

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
            <Button
              variant="secondary"
              className="text-danger border-danger/20 hover:bg-danger-light"
              onClick={() => { setPwMsg(null); setShowPwForm(!showPwForm); }}
            >
              <Key className="h-4 w-4" />
              Cambiar contrasena
            </Button>
          </div>

          {showPwForm && (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
              <input
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Contraseña actual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Repetir nueva contraseña"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              {pwMsg && (
                <p className="text-xs text-muted-foreground">{pwMsg}</p>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={changingPw}
                  onClick={async () => {
                    if (newPassword.length < 8) {
                      setPwMsg("La contraseña debe tener al menos 8 caracteres.");
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setPwMsg("Las contraseñas no coinciden.");
                      return;
                    }
                    setChangingPw(true);
                    setPwMsg(null);
                    try {
                      const res = await fetch("/api/auth/password", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ currentPassword, newPassword }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setPwMsg("Contraseña actualizada.");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      } else {
                        setPwMsg(data.error ?? "Error al cambiar la contraseña.");
                      }
                    } catch {
                      setPwMsg("Error de conexión.");
                    } finally {
                      setChangingPw(false);
                    }
                  }}
                >
                  {changingPw ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPwForm(false);
                    setPwMsg(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
