"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";
import {
  ArrowLeft, User, Phone, Mail, DollarSign, Loader2, History, CreditCard,
} from "lucide-react";

type CustomerInfo = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  saleCount: number;
  totalSpent: number;
};

type AccountSale = {
  id: string;
  receiptNumber: number;
  totalAmount: number;
  saleDate: string;
  itemCount: number;
};

type Payment = {
  id: string;
  amount: number;
  note: string | null;
  userName: string | null;
  createdAt: string;
};

type Balance = {
  totalOwed: number;
  totalPaid: number;
  balance: number;
};

export default function CustomerAccountPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [accountSales, setAccountSales] = useState<AccountSale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [custRes, balRes, salesRes, payRes] = await Promise.all([
        fetch(`/api/dashboard/customers/${id}`),
        fetch(`/api/dashboard/customers/${id}/balance`),
        fetch(`/api/dashboard/customers/${id}/sales`),
        fetch(`/api/dashboard/customers/${id}/payments`),
      ]);

      const custData = await custRes.json();
      if (custRes.ok) setCustomer(custData);

      const balData = await balRes.json();
      if (balRes.ok) setBalance(balData);

      const salesData = await salesRes.json();
      if (salesRes.ok) setAccountSales(salesData.sales ?? []);

      const payData = await payRes.json();
      if (payRes.ok) setPayments(payData.payments ?? []);
    } catch {
      toast("Error al cargar datos del cliente", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handlePayment = async () => {
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast("Ingresá un monto válido", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dashboard/customers/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: paymentNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error al registrar pago", "error");
        return;
      }
      setPaymentAmount("");
      setPaymentNote("");
      toast("Pago registrado", "success");
      fetchAll();
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Cliente no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pos" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{customer.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {customer.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Balance cards */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Debe</div>
                  <div className="text-lg font-bold text-warning">{moneyFormatter.format(balance.totalOwed)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pagado</div>
                  <div className="text-lg font-bold text-success">{moneyFormatter.format(balance.totalPaid)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${balance.balance > 0 ? "bg-danger/10" : "bg-success/10"}`}>
                  <DollarSign className={`h-5 w-5 ${balance.balance > 0 ? "text-danger" : "text-success"}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Saldo</div>
                  <div className={`text-lg font-bold ${balance.balance > 0 ? "text-danger" : "text-success"}`}>
                    {moneyFormatter.format(balance.balance)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Register payment */}
      {balance && balance.balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="number"
                placeholder="Monto"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="sm:w-40"
                min={0}
              />
              <Input
                placeholder="Nota (opcional)"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handlePayment} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Registrar pago
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Ventas a cuenta ({accountSales.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accountSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin ventas a cuenta</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {accountSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                    <div>
                      <div className="font-medium">Ticket #{String(sale.receiptNumber).padStart(4, "0")}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.saleDate).toLocaleDateString("es-AR")} · {sale.itemCount} items
                      </div>
                    </div>
                    <span className="font-semibold text-warning">{moneyFormatter.format(sale.totalAmount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagos realizados ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                    <div>
                      <div className="font-medium text-success">+{moneyFormatter.format(p.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("es-AR")} {new Date(p.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {p.userName && ` · ${p.userName}`}
                      </div>
                      {p.note && <div className="text-xs text-muted-foreground mt-0.5">{p.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
