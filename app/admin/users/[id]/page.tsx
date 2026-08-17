import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, KeyRound, Mail, ShoppingBag, Undo2, User as UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserDetail } from "@/lib/data/admin";
import { UserDetailClient } from "@/components/admin/user-detail-client";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserDetail(id);
  if (!user) notFound();

  const now = new Date();

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a usuarios
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-lg font-bold text-white shadow-sm">
            {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
            {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
          </Badge>
          <Badge tone={user.role === "SUPER_ADMIN" ? "success" : "muted"}>
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ventas</p>
              <p className="text-xl font-semibold">{user._count.sales}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-light">
              <Undo2 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Devoluciones</p>
              <p className="text-xl font-semibold">{user._count.returns}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-light">
              <KeyRound className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sesiones</p>
              <p className="text-xl font-semibold">{user._count.sessions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registro</p>
              <p className="text-sm font-semibold">{user.createdAt.toISOString().slice(0, 10)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workspaces */}
        <Card>
          <CardHeader>
            <CardTitle>Workspaces ({user.memberships.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {user.memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pertenece a ningún workspace.</p>
            ) : (
              <div className="space-y-2">
                {user.memberships.map((m: { id: string; role: string; workspace: { name: string; slug: string } }) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <p className="text-sm font-medium">{m.workspace.name}</p>
                      <p className="text-xs text-muted-foreground">{m.workspace.slug}</p>
                    </div>
                    <Badge tone={m.role === "OWNER" ? "success" : m.role === "ADMIN" ? "accent" : "muted"}>
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Email verificado</span>
              <span className="font-medium">{user.emailVerified ? "Sí" : "No"}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Último ingreso</span>
              <span className="font-medium">{user.lastLoginAt?.toISOString().slice(0, 16).replace("T", " ") ?? "Nunca"}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">CUIT/CUIL</span>
              <span className="font-medium">{user.cuitCuil || "—"}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-muted-foreground">Miembro desde</span>
              <span className="font-medium">{user.createdAt.toISOString().slice(0, 10)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Notes */}
      <UserDetailClient userId={user.id} initialNotes={user.supportNotes} />

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sesiones recientes ({user.sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {user.sessions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No hay sesiones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium">Creada</th>
                    <th className="py-3 px-4 font-medium">Expira</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.sessions.map((session: { id: string; expiresAt: Date; createdAt: Date }) => {
                    const isActive = session.expiresAt > now;
                    return (
                      <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <Badge tone={isActive ? "success" : "muted"}>
                            {isActive ? "Activa" : "Vencida"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {session.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {session.expiresAt.toISOString().slice(0, 16).replace("T", " ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
