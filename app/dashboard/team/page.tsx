import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TeamManager } from "@/components/dashboard/team-manager";

export const metadata = { title: "Equipo" };

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.workspaceId) redirect("/dashboard/settings");

  const canManage = user.role === "OWNER" || user.role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</span>
        </div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Equipo</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gestioná las personas que trabajan en {user.workspaceName}. Invitá miembros, asigná roles y controlá quién tiene acceso.
        </p>
      </div>

      <TeamManager currentUserId={user.id} canManage={canManage} workspaceName={user.workspaceName} />
    </div>
  );
}
