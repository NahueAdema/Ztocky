"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";

type InvitationData = {
  id: string;
  email: string;
  role: string;
  workspaceName: string;
  workspaceId: string;
  expiresAt: string;
  userExists: boolean;
};

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Invitación no válida");
        } else {
          setInvitation(data);
        }
      } catch {
        setError("Error al verificar la invitación");
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requireAuth) {
          sessionStorage.setItem("invitation_token", token);
          router.push(`/auth/login?redirect=/invitations/${token}`);
          return;
        }
        setError(data.error || "Error al aceptar invitación");
      } else {
        setSuccess(true);
        sessionStorage.setItem("switch_workspace", data.workspaceId);
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-xl font-bold mb-2">Invitación no válida</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")} variant="secondary">
            Ir al dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-xl font-bold mb-2">¡Bienvenido al equipo!</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Ahora eres miembro de <strong>{invitation?.workspaceName}</strong>
          </p>
          <p className="text-xs text-muted-foreground">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">Te invitaron a un equipo</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Quieres unirte a <strong>{invitation?.workspaceName}</strong>
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Como <span className="font-semibold uppercase">{invitation?.role}</span> · Invitado para: {invitation?.email}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>
        )}

        <Button onClick={handleAccept} disabled={accepting} className="w-full h-11">
          {accepting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uniendo...
            </>
          ) : (
            "Aceptar invitación"
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground mt-4">
          Si no conoces a esta persona, puedes ignorar esta página.
        </p>
      </div>
    </div>
  );
}
