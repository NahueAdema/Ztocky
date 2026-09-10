"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination, ITEMS_PER_PAGE } from "@/components/ui/pagination";
import { Search, Users, ExternalLink, Phone, Mail } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  _count: { sales: number; accountPayments: number };
  sales: { totalAmount: number }[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalServer, setTotalServer] = useState(0);
  const loadedCountRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const BATCH_SIZE = 50;

  const fetchCustomers = useCallback(async (searchTerm?: string, offset?: number, append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: String(BATCH_SIZE) });
      if (searchTerm) params.set("search", searchTerm);
      if (offset !== undefined) params.set("offset", String(offset));
      const res = await fetch(`/api/dashboard/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.customers ?? [];
        if (append) {
          setCustomers((prev) => [...prev, ...list]);
        } else {
          setCustomers(list);
        }
        loadedCountRef.current = append ? loadedCountRef.current + list.length : list.length;
        setTotalServer(data.total ?? 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Búsqueda server-side con debounce
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      loadedCountRef.current = 0;
      fetchCustomers(search);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, fetchCustomers]);

  const getBalance = (c: Customer) => {
    const totalOwed = (c.sales ?? []).reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalPaid = c._count?.accountPayments ?? 0;
    return { totalOwed, saleCount: c._count?.sales ?? 0, paymentCount: totalPaid };
  };

  const totalPages = Math.ceil(totalServer / ITEMS_PER_PAGE);
  const paginatedCustomers = customers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Cuando el usuario cambia de página y faltan datos, cargar más clientes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const neededIndex = newPage * ITEMS_PER_PAGE;
    if (neededIndex > loadedCountRef.current && loadedCountRef.current < totalServer) {
      fetchCustomers(search, loadedCountRef.current, true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestioná la cuenta corriente de tus clientes.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : paginatedCustomers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold">{search ? "Sin resultados" : "No hay clientes registrados"}</p>
            <p className="text-xs text-muted-foreground mt-1">Los clientes se crean automáticamente al usar Cta Cte en el POS.</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCustomers.map((customer) => {
            const { saleCount } = getBalance(customer);
            return (
              <Link key={customer.id} href={`/dashboard/customers/${customer.id}`}>
                <Card className="card-hover h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />{customer.phone}
                            </p>
                          )}
                          {customer.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />{customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="muted" className="text-[10px]">{saleCount} venta{saleCount !== 1 ? "s" : ""}</Badge>
                      <Badge tone={(customer._count?.accountPayments ?? 0) > 0 ? "success" : "default"} className="text-[10px]">
                        {(customer._count?.accountPayments ?? 0) > 0 ? "Con pagos" : "Sin pagos"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}
        </>
      )}
    </div>
  );
}
