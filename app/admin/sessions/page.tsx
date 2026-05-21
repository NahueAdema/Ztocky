import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSessions } from "@/lib/data/admin";

export default async function AdminSessionsPage() {
  const sessions = await getAdminSessions();
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sesiones</h1>
        <p className="text-sm text-muted-foreground">
          Vista para soporte ante reportes de accesos o sesiones vencidas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Últimas sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Usuario</th>
                  <th className="py-3 pr-4 font-medium">Estado</th>
                  <th className="py-3 pr-4 font-medium">Creada</th>
                  <th className="py-3 font-medium">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={session.expiresAt > now ? "success" : "muted"}>
                        {session.expiresAt > now ? "Activa" : "Vencida"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{session.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                    <td className="py-3">{session.expiresAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
