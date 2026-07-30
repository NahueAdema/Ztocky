"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  UserPlus,
  MoreHorizontal,
  Shield,
  User,
  Crown,
  Mail,
  X,
  Clock,
  RotateCcw,
} from "lucide-react";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
};

type MembersData = {
  members: Member[];
  invitations: Invitation[];
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3" />,
  ADMIN: <Shield className="h-3 w-3" />,
  MEMBER: <User className="h-3 w-3" />,
};

const ROLE_TONES: Record<string, "warning" | "default" | "muted"> = {
  OWNER: "warning",
  ADMIN: "default",
  MEMBER: "muted",
};

export function MembersPanel() {
  const [data, setData] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await fetch("/api/dashboard/workspace/members");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, []);

  const refreshMembers = async () => {
    try {
      const res = await fetch("/api/dashboard/workspace/members");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // silent
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error);
        return;
      }
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      refreshMembers();
    } catch {
      setError("Error de conexión");
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/dashboard/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) refreshMembers();
    } catch {
      // silent
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("¿Eliminar este miembro del workspace?")) return;
    try {
      const res = await fetch(`/api/dashboard/workspace/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) refreshMembers();
    } catch {
      // silent
    }
  };

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      const res = await fetch("/api/dashboard/workspace/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Miembros del equipo</CardTitle>
          <CardDescription>
            {data?.members.length || 0} miembro{(data?.members.length || 0) !== 1 ? "s" : ""} · {data?.invitations.length || 0} invitación{(data?.invitations.length || 0) !== 1 ? "es" : ""} pendiente{(data?.invitations.length || 0) !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)} className="h-9 px-3 text-sm">
          <UserPlus className="h-4 w-4 mr-1" />
          Invitar
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {showInvite && (
          <div className="mb-4 rounded-xl border border-border p-4 space-y-3 bg-muted/30">
            <Input
              placeholder="email@ejemplo.com"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <div className="flex gap-2">
              {["MEMBER", "ADMIN"].map((r) => (
                <Button
                  key={r}
                  variant={inviteRole === r ? "primary" : "secondary"}
                  className="h-8 px-3 text-xs"
                  onClick={() => setInviteRole(r)}
                >
                  {ROLE_LABELS[r]}
                </Button>
              ))}
            </div>
            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="w-full h-9">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Enviar invitación
            </Button>
          </div>
        )}

        {data?.members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {member.name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge tone={ROLE_TONES[member.role]}>
                {ROLE_ICONS[member.role]}
                <span className="ml-1">{ROLE_LABELS[member.role]}</span>
              </Badge>
              {member.role !== "OWNER" && (
                <DropdownMenu
                  trigger={
                    <Button variant="ghost" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  }
                >
                  {member.role === "MEMBER" && (
                    <DropdownMenuItem
                      onClick={() => handleChangeRole(member.id, "ADMIN")}
                      icon={<Shield className="h-3.5 w-3.5" />}
                    >
                      Hacer administrador
                    </DropdownMenuItem>
                  )}
                  {member.role === "ADMIN" && (
                    <DropdownMenuItem
                      onClick={() => handleChangeRole(member.id, "MEMBER")}
                      icon={<User className="h-3.5 w-3.5" />}
                    >
                      Quitar administrador
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleRemove(member.id)}
                    icon={<X className="h-3.5 w-3.5" />}
                  >
                    Eliminar del equipo
                  </DropdownMenuItem>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {data?.invitations.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-dashed border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-warning shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{inv.email}</p>
                <p className="text-xs text-muted-foreground">
                  Invitado por {inv.invitedBy} · <Clock className="h-3 w-3 inline mr-1" />Pendiente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge tone={ROLE_TONES[inv.role] || "muted"}>
                {ROLE_LABELS[inv.role] || inv.role}
              </Badge>
              <button
                onClick={() => handleResend(inv.id)}
                disabled={resendingId === inv.id}
                title="Reenviar invitación"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              >
                {resendingId === inv.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
