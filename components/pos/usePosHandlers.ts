"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";
import {
  type CartItem,
  type CashRegister,
  type SaleResult,
  type Customer,
  type TodaySale,
} from "./types";
import { PAYMENT_METHODS } from "./constants";
import { enqueueSale, updateCachedStock, type PendingSale } from "@/lib/offline";

interface UsePosHandlersProps {
  cart: CartItem[];
  register: CashRegister | null;
  paymentMethod: string;
  discount: number;
  cashReceived: string;
  selectedCustomer: Customer | null;
  todaySales: TodaySale[];
  openingAmount: string;
  closingAmount: string;
  setShowReceipt: (v: SaleResult | null) => void;
  clearCart: () => void;
  setDiscount: (v: number) => void;
  setCashReceived: (v: string) => void;
  setSelectedCustomer: (v: Customer | null) => void;
  setShowMobileCart: (v: boolean) => void;
  setRegister: (v: CashRegister | null) => void;
  setShowOpenModal: (v: boolean) => void;
  setShowCloseModal: (v: boolean) => void;
  setProcessing: (v: boolean) => void;
  setOpeningAmount: (v: string) => void;
  setClosingAmount: (v: string) => void;
  fetchProducts: () => void;
  fetchRegister: () => void;
  fetchDailySummary: () => void;
  onOfflineSale?: (pending: PendingSale) => void;
}

export function usePosHandlers({
  cart,
  register,
  paymentMethod,
  discount,
  selectedCustomer,
  todaySales,
  openingAmount,
  closingAmount,
  setShowReceipt,
  clearCart,
  setDiscount,
  setCashReceived,
  setSelectedCustomer,
  setShowMobileCart,
  setRegister,
  setShowOpenModal,
  setShowCloseModal,
  setProcessing,
  setOpeningAmount,
  setClosingAmount,
  fetchProducts,
  fetchRegister,
  fetchDailySummary,
  onOfflineSale,
}: UsePosHandlersProps) {
  const { toast } = useToast();

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast("El carrito está vacío", "error");
      return;
    }
    if (!register) {
      toast("Abrí la caja primero", "error");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/dashboard/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount,
          })),
          paymentMethod,
          discountAmount: discount,
          cashRegisterId: register.id,
          customerId: selectedCustomer?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error al procesar", "error");
        return;
      }
      setShowReceipt(data.sale);
      clearCart();
      setDiscount(0);
      setCashReceived("");
      setSelectedCustomer(null);
      setShowMobileCart(false);
      fetchProducts();
      fetchRegister();
      fetchDailySummary();
      toast("Venta registrada", "success");
    } catch {
      const pending = enqueueSale({
        cart,
        paymentMethod,
        discountAmount: discount,
        cashRegisterId: register?.id ?? null,
        customerId: selectedCustomer?.id || null,
      });
      cart.forEach((i) => updateCachedStock(i.productId, i.quantity));
      onOfflineSale?.(pending);
      clearCart();
      setDiscount(0);
      setCashReceived("");
      setSelectedCustomer(null);
      setShowMobileCart(false);
      toast("Sin conexión: venta guardada para sincronizar", "info");
    } finally {
      setProcessing(false);
    }
  }, [cart, register, paymentMethod, discount, selectedCustomer, toast, setShowReceipt, clearCart, setDiscount, setCashReceived, setSelectedCustomer, setShowMobileCart, fetchProducts, fetchRegister, fetchDailySummary, setProcessing, onOfflineSale]);

  const handleVoidSale = useCallback(async (saleId: string) => {
    if (!confirm("Anular esta venta? Se restaurará el stock.")) return;
    try {
      const res = await fetch("/api/dashboard/pos/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error al anular", "error");
        return;
      }
      toast("Venta anulada, stock restaurado", "success");
      fetchProducts();
      fetchDailySummary();
    } catch {
      toast("Error de conexión", "error");
    }
  }, [toast, fetchProducts, fetchDailySummary]);

  const handleOpenRegister = useCallback(async () => {
    const amount = Number(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast("Ingresá un monto válido", "error");
      return;
    }
    try {
      const res = await fetch("/api/dashboard/pos/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error", "error");
        return;
      }
      setRegister(data.register);
      setShowOpenModal(false);
      setOpeningAmount("");
      toast("Caja abierta", "success");
    } catch {
      toast("Error de conexión", "error");
    }
  }, [openingAmount, toast, setRegister, setShowOpenModal, setOpeningAmount]);

  const handleCloseRegister = useCallback(async () => {
    const amount = Number(closingAmount);
    if (isNaN(amount) || amount < 0) {
      toast("Ingresá un monto válido", "error");
      return;
    }
    try {
      const res = await fetch("/api/dashboard/pos/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerId: register!.id, closingAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Error", "error");
        return;
      }
      setRegister(null);
      setShowCloseModal(false);
      setClosingAmount("");
      fetchDailySummary();
      toast(`Caja cerrada. Diferencia: ${moneyFormatter.format(data.register.difference)}`, data.register.difference === 0 ? "success" : "info");
    } catch {
      toast("Error de conexión", "error");
    }
  }, [closingAmount, register, toast, setRegister, setShowCloseModal, setClosingAmount, fetchDailySummary]);

  const handleExportDaily = useCallback(() => {
    if (todaySales.length === 0) {
      toast("No hay ventas para exportar", "info");
      return;
    }
    const header = "Ticket,Hora,Items,Total,Método,Vendedor,Cliente";
    const rows = todaySales.map((s) => {
      const time = new Date(s.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const method = PAYMENT_METHODS.find((m) => m.value === s.paymentMethod)?.label ?? s.paymentMethod;
      return `#${String(s.receiptNumber).padStart(4, "0")},${time},${s.itemCount},${s.totalAmount},${method},${s.seller},${s.customer ?? ""}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exportado", "success");
  }, [todaySales, toast]);

  return {
    handleCheckout,
    handleVoidSale,
    handleOpenRegister,
    handleCloseRegister,
    handleExportDaily,
  };
}
