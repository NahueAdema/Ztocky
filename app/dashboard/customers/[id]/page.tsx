"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";
import { downloadReceiptPDF, printReceipt } from "@/lib/receipt";
import {
  ArrowLeft, User, Phone, Mail, DollarSign, Loader2, History, CreditCard, Receipt, X,
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

type SaleDetail = {
  id: string;
  receiptNumber: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  saleDate: string;
  sellerName: string | null;
  items: {
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
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
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [accountSales, setAccountSales] = useState<AccountSale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [viewingSale, setViewingSale] = useState<SaleDetail | null>(null);
  const [viewingSaleLoading, setViewingSaleLoading] = useState(false);

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

  const openSaleReceipt = async (saleId: string) => {
    setViewingSaleLoading(true);
    try {
      const res = await fetch(`/api/dashboard/sales/${saleId}`);
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error al cargar el ticket", "error");
        return;
      }
      setViewingSale({
        id: data.id,
        receiptNumber: data.receiptNumber,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount,
        paymentMethod: data.paymentMethod,
        saleDate: data.saleDate,
        sellerName: data.sellerName ?? null,
        items: (data.items ?? []).map((it: { productName: string; productSku: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
          name: it.productName,
          sku: it.productSku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        })),
      });
    } catch {
      toast("Error de conexión al cargar el ticket", "error");
    } finally {
      setViewingSaleLoading(false);
    }
  };

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
    <>
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard/customers");
            }
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Volver"
          title="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
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
                  <button
                    key={sale.id}
                    onClick={() => openSaleReceipt(sale.id)}
                    disabled={viewingSaleLoading}
                    className="flex w-full items-center justify-between p-3 rounded-lg bg-muted/50 text-sm hover:bg-muted transition-colors text-left disabled:opacity-50"
                  >
                    <div>
                      <div className="font-medium">Ticket #{String(sale.receiptNumber).padStart(4, "0")}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.saleDate).toLocaleDateString("es-AR")} · {sale.itemCount} items
                      </div>
                    </div>
                    <span className="font-semibold text-warning">{moneyFormatter.format(sale.totalAmount)}</span>
                  </button>
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

    {viewingSale && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-sm max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Ticket #{String(viewingSale.receiptNumber).padStart(4, "0")}
            </h3>
            <button onClick={() => setViewingSale(null)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <CardContent className="flex-1 overflow-y-auto p-4 text-sm space-y-1">
            {customer && (
              <div className="text-xs text-muted-foreground mb-1">Cliente: {customer.name}</div>
            )}
            <div className="text-xs text-muted-foreground mb-2">
              {new Date(viewingSale.saleDate).toLocaleDateString("es-AR")}
              {viewingSale.sellerName ? ` · Vendedor: ${viewingSale.sellerName}` : ""}
              {` · Pago: ${{ CASH: "Efectivo", CARD: "Tarjeta", TRANSFER: "Transferencia", ACCOUNT: "Cta Cte" }[viewingSale.paymentMethod] ?? viewingSale.paymentMethod}`}
            </div>
            <div className="border-t pt-2 space-y-1">
              {viewingSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span className="flex-1">
                    {item.quantity}x {item.name}
                    <span className="text-muted-foreground"> · {item.sku}</span>
                  </span>
                  <span className="font-medium">{moneyFormatter.format(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            {viewingSale.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Descuento</span>
                <span>-{moneyFormatter.format(viewingSale.discountAmount)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{moneyFormatter.format(viewingSale.totalAmount)}</span>
            </div>
          </CardContent>
          <div className="flex gap-2 p-4 border-t border-border">
            <Button variant="secondary" className="flex-1" onClick={() => setViewingSale(null)}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={viewingSaleLoading}
              onClick={() => downloadReceiptPDF({
                receiptNumber: viewingSale.receiptNumber,
                totalAmount: viewingSale.totalAmount,
                discountAmount: viewingSale.discountAmount,
                paymentMethod: viewingSale.paymentMethod,
                saleDate: viewingSale.saleDate,
                items: viewingSale.items.map((it) => ({ ...it, discountAmount: 0 })),
                customerName: customer?.name,
                seller: viewingSale.sellerName ?? undefined,
              })}
            >
              <Receipt className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              className="flex-1"
              disabled={viewingSaleLoading}
              onClick={() => printReceipt({
                receiptNumber: viewingSale.receiptNumber,
                totalAmount: viewingSale.totalAmount,
                discountAmount: viewingSale.discountAmount,
                paymentMethod: viewingSale.paymentMethod,
                saleDate: viewingSale.saleDate,
                items: viewingSale.items.map((it) => ({ ...it, discountAmount: 0 })),
                customerName: customer?.name,
                seller: viewingSale.sellerName ?? undefined,
              })}
            >
              Imprimir
            </Button>
          </div>
        </Card>
      </div>
    )}
    </>
  );
}
