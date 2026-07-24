import { Activity, Building2, ClipboardList, Package, Shield, Truck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/data/admin";

const metricConfig = [
  { key: "totalUsers", label: "Usuarios", icon: Users },
  { key: "totalWorkspaces", label: "Workspaces", icon: Building2 },
  { key: "activeSessions", label: "Sesiones activas", icon: Activity },
  { key: "superAdmins", label: "Super admins", icon: Shield },
  { key: "products", label: "Productos", icon: Package },
  { key: "suppliers", label: "Proveedores", icon: Truck },
  { key: "purchaseOrders", label: "Órdenes", icon: ClipboardList },
] as const;

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resumen admin</h1>
        <p className="text-sm text-muted-foreground">
          Estado general de cuentas, espacios de trabajo y actividad operativa.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{overview[metric.key]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios por estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between rounded-md bg-muted p-3">
              <span>Activos</span>
              <strong>{overview.activeUsers}</strong>
            </div>
            <div className="flex justify-between rounded-md bg-muted p-3">
              <span>Suspendidos</span>
              <strong>{overview.suspendedUsers}</strong>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lineamientos de soporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>No borrar cuentas desde soporte temprano: suspender preserva auditoria.</p>
            <p>Separar rol global de rol del workspace evita mezclar clientes con admins internos.</p>
            <p>Revisar sesiones activas ante reportes de acceso sospechoso.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
