import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminWorkspaces } from "@/lib/data/admin";

export default async function AdminWorkspacesPage() {
  const workspaces = await getAdminWorkspaces();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Cada comercio debe tener su propio espacio de trabajo y miembros asociados.
        </p>
      </div>
      <div className="grid gap-4">
        {workspaces.map((workspace) => (
          <Card key={workspace.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{workspace.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{workspace.slug}</p>
              </div>
              <Badge tone="default">{workspace._count.members} miembros</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Metric label="Productos" value={workspace._count.products} />
                <Metric label="Proveedores" value={workspace._count.suppliers} />
                <Metric label="Órdenes" value={workspace._count.orders} />
                <Metric label="Alertas" value={workspace._count.alerts} />
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Miembros principales</p>
                {workspace.members.map((member) => (
                  <div className="flex justify-between rounded-md bg-muted p-2" key={member.id}>
                    <span>{member.user.email}</span>
                    <span className="font-semibold">{member.role}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
