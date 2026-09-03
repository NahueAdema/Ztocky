"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Crown,
  UserCog,
  Loader2,
  Users,
  Clock,
  Send,
  XCircle,
  RefreshCw,
} from "lucide-react";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
};

type Invitation = {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
};

interface TeamManagerProps {
  currentUserId: string;
  canManage: boolean;
  workspaceName: string;
}

const roleConfig = {
  OWNER: { label: "Propietario", icon: Crown, tone: "default" as const },
  ADMIN: { label: "Administrador", icon: UserCog, tone: "accent" as const },
  MEMBER: { label: "Miembro", icon: UserPlus, tone: "muted" as const },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TeamManager({ currentUserId, canManage, workspaceName }: TeamManagerProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);

  const [removing, setRemoving] = useState<Member | null>(null);
  const [removingInvite, setRemovingInvite] = useState<string | null>(null);
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/workspace/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setInvitations(data.invitations || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast("Ingresá un email válido", "error");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/dashboard/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "No se pudo invitar", "error");
        return;
      }
      toast(`Invitación enviada a ${inviteEmail.trim()}`, "success");
      setInviteEmail("");
      setInviteRole("MEMBER");
      fetchAll();
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: Member, role: "ADMIN" | "MEMBER") => {
    setBusyRole(member.id);
    try {
      const res = await fetch(`/api/dashboard/workspace/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "No se pudo cambiar el rol", "error");
        return;
      }
      toast("Rol actualizado", "success");
      fetchAll();
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setBusyRole(null);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      const res = await fetch(`/api/dashboard/workspace/members/${removing.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "No se pudo eliminar", "error");
        setRemoving(null);
        return;
      }
      toast("Miembro eliminado", "success");
      setRemoving(null);
      fetchAll();
    } catch {
      toast("Error de conexión", "error");
      setRemoving(null);
    }
  };

  const handleRemoveInvite = async () => {
    if (!removingInvite) return;
    try {
      const res = await fetch(`/api/dashboard/workspace/invite/${removingInvite}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "No se pudo cancelar", "error");
        setRemovingInvite(null);
        return;
      }
      toast("Invitación cancelada", "success");
      setRemovingInvite(null);
      fetchAll();
    } catch {
      toast("Error de conexión", "error");
      setRemovingInvite(null);
    }
  };

  const handleResend = async (invitationId: string) => {
    setResending(invitationId);
    try {
      const res = await fetch("/api/dashboard/workspace/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "No se pudo reenviar", "error");
        return;
      }
      toast("Invitación reenviada", "success");
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setResending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite card */}
      {canManage && (
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 to-teal-500/5 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Invitar a alguien</p>
              <p className="text-xs text-muted-foreground">Enviá una invitación por email para sumar a tu equipo</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="email@ejemplo.com"
                type="email"
                className="pl-10"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              className="h-10 rounded-lg border border-border/60 bg-card px-3 text-sm outline-none focus:border-primary"
            >
              <option value="MEMBER">Miembro</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Invitar
            </Button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Miembros</h2>
            <Badge tone="muted">{members.length}</Badge>
          </div>
        </div>
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Aún no hay miembros</p>
            <p className="text-xs text-muted-foreground mt-1">Invita a tu equipo para empezar a colaborar.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {members.map((member) => {
              const cfg = roleConfig[member.role];
              const RoleIcon = cfg.icon;
              const isSelf = member.userId === currentUserId;
              const isOwner = member.role === "OWNER";
              const canEditThis = canManage && !isSelf && !isOwner;
              return (
                <li key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-bold text-white">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{member.name}</p>
                      {isSelf && <Badge tone="success">Tú</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      member.role === "OWNER"
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : member.role === "ADMIN"
                          ? "border-accent/20 bg-accent/10 text-accent"
                          : "border-border/60 bg-muted text-muted-foreground"
                    }`}>
                      <RoleIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    {isOwner && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        desde {new Date(member.joinedAt).toLocaleDateString("es-AR")}
                      </span>
                    )}
                    {canEditThis && (
                      <>
                        <select
                          value={member.role}
                          disabled={busyRole === member.id}
                          onChange={(e) => handleRoleChange(member, e.target.value as "ADMIN" | "MEMBER")}
                          className="h-8 rounded-lg border border-border/60 bg-card px-2 text-xs outline-none disabled:opacity-50"
                        >
                          <option value="MEMBER">Miembro</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={() => setRemoving(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"
                          title="Eliminar miembro"
                        >
                          {busyRole === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Invitations */}
      {invitations.length > 0 && (
        <div className="rounded-2xl border border-warning/20 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-warning/20">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <h2 className="font-semibold">Invitaciones pendientes</h2>
              <Badge tone="warning">{invitations.length}</Badge>
            </div>
          </div>
          <ul className="divide-y divide-border/60">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{inv.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {inv.role === "ADMIN" ? "Administrador" : "Miembro"} · invitado por {inv.invitedBy} · vence{" "}
                    {new Date(inv.expiresAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => handleResend(inv.id)}
                      disabled={resending === inv.id}
                      title="Reenviar invitación"
                    >
                      {resending === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">Reenviar</span>
                    </Button>
                    <button
                      onClick={() => setRemovingInvite(inv.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-light hover:text-danger"
                      title="Cancelar invitación"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Permissions hint */}
      {canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Roles de acceso</p>
            <ul className="mt-1.5 space-y-1">
              <li><span className="font-medium text-primary">Propietario</span> — control total, no se puede quitar.</li>
              <li><span className="font-medium text-accent">Administrador</span> — puede gestionar miembros y la configuración.</li>
              <li><span className="font-medium">Miembro</span> — acceso para operar el día a día.</li>
            </ul>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removing}
        title="Eliminar miembro"
        description={`¿Seguro que querés quitar a ${removing?.name ?? "este miembro"} de ${workspaceName}? Perderá el acceso al workspace.`}
        confirmLabel="Eliminar"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={!!removingInvite}
        title="Cancelar invitación"
        description="¿Querés cancelar esta invitación pendiente? La persona ya no podrá aceptar el acceso."
        confirmLabel="Cancelar invitación"
        onConfirm={handleRemoveInvite}
        onCancel={() => setRemovingInvite(null)}
      />
    </div>
  );
}
