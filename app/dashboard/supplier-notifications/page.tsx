"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, ITEMS_PER_PAGE } from "@/components/ui/pagination";
import { Bell, Mail, MailCheck, MailX, Factory } from "lucide-react";
import { moneyFormatter } from "@/lib/format";

type Notification = {
  id: string;
  supplierId: string;
  supplierName: string;
  type: string;
  subject: string;
  message: string;
  changesSummary: {
    productName: string;
    productSku: string;
    previousPrice: number | null;
    newPrice: number;
    changeType: string;
  }[] | null;
  emailSentAt: string | null;
  emailTo: string | null;
  createdAt: string;
};


export default function SupplierNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/supplier-notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = notifications.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">
          Notificaciones a Proveedores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de cambios de precios notificados a tus proveedores.
        </p>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones enviadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Sin notificaciones</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                Cuando importes precios, se notificará automáticamente a tus proveedores.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="rounded-xl border border-border p-4 transition hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          {notif.emailSentAt ? (
                            <MailCheck className="h-5 w-5 text-success" />
                          ) : (
                            <MailX className="h-5 w-5 text-danger" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{notif.subject}</p>
                            <Badge tone={notif.emailSentAt ? "success" : "danger"}>
                              {notif.emailSentAt ? "Enviado" : "Error"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          {notif.emailTo && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {notif.emailTo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Factory className="h-3 w-3" />
                          {notif.supplierName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(notif.createdAt).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>

                    {notif.changesSummary && notif.changesSummary.length > 0 && (
                      <div className="mt-3 ml-13 rounded-lg bg-muted/50 p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                          Productos afectados
                        </p>
                        <div className="space-y-1.5">
                          {notif.changesSummary.map((change, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Badge
                                  tone={
                                    change.changeType === "CREATED"
                                      ? "success"
                                      : change.changeType === "DELETED"
                                        ? "danger"
                                        : "default"
                                  }
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {change.changeType === "CREATED"
                                    ? "NUEVO"
                                    : change.changeType === "DELETED"
                                      ? "ELIM"
                                      : "ACT"}
                                </Badge>
                                <span className="font-medium">{change.productName}</span>
                                <span className="text-muted-foreground font-mono text-[10px]">
                                  {change.productSku}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {change.previousPrice !== null && change.changeType !== "CREATED" && (
                                  <span className="text-muted-foreground line-through font-mono text-[10px]">
                                    {moneyFormatter.format(change.previousPrice)}
                                  </span>
                                )}
                                <span className="font-semibold font-mono text-[11px]">
                                  {moneyFormatter.format(change.newPrice)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
