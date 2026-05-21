import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUsers } from "@/lib/data/admin";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de cuentas para soporte. Cambiá estado o rol sin eliminar datos.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cuentas registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Usuario</th>
                  <th className="py-3 pr-4 font-medium">Rol global</th>
                  <th className="py-3 pr-4 font-medium">Estado</th>
                  <th className="py-3 pr-4 font-medium">Workspaces</th>
                  <th className="py-3 pr-4 font-medium">Último ingreso</th>
                  <th className="py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={user.role === "SUPER_ADMIN" ? "success" : "muted"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {user.memberships.map((membership) => membership.workspace.name).join(", ") || "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {user.lastLoginAt?.toISOString().slice(0, 10) ?? "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <form action={`/api/admin/users/${user.id}/status`} method="post">
                          <input
                            name="status"
                            type="hidden"
                            value={user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"}
                          />
                          <button className="rounded-md border border-border px-3 py-2 font-semibold hover:bg-muted" type="submit">
                            {user.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                          </button>
                        </form>
                        <form action={`/api/admin/users/${user.id}/role`} method="post">
                          <input
                            name="role"
                            type="hidden"
                            value={user.role === "SUPER_ADMIN" ? "USER" : "SUPER_ADMIN"}
                          />
                          <button className="rounded-md border border-border px-3 py-2 font-semibold hover:bg-muted" type="submit">
                            {user.role === "SUPER_ADMIN" ? "Quitar admin" : "Hacer admin"}
                          </button>
                        </form>
                      </div>
                    </td>
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
