"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { moneyFormatter } from "@/lib/format";
import {
  ShoppingCart, Trash2, Plus, Minus, X, Loader2, User,
  Wallet, BarChart3, History, Download, ExternalLink,
} from "lucide-react";
import { type CartItem, type CashRegister, type Customer, type TodaySale } from "./types";
import { PAYMENT_METHODS } from "./constants";
import { SalesHistory } from "./SalesHistory";

interface CartPanelProps {
  cart: CartItem[];
  register: CashRegister | null;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  discount: number;
  setDiscount: (v: number) => void;
  cashReceived: string;
  setCashReceived: (v: string) => void;
  amountPaid: string;
  setAmountPaid: (v: string) => void;
  accountDue: number;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (v: Customer | null) => void;
  customers: Customer[];
  processing: boolean;
  editingItemDiscount: string | null;
  setEditingItemDiscount: (v: string | null) => void;
  itemDiscountValue: string;
  setItemDiscountValue: (v: string) => void;
  editingQty: string | null;
  setEditingQty: (v: string | null) => void;
  qtyValue: string;
  setQtyValue: (v: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSetQuantityDirect: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onSetItemDiscount: (productId: string, amount: number) => void;
  onCheckout: () => void;
  onShowOpenModal: () => void;
  onShowCloseModal: () => void;
  onShowSalesHistory: () => void;
  dailySummary: { totalRevenue: number; transactionCount: number; cashTotal: number; cardTotal: number } | null;
  todaySales: TodaySale[];
  showSalesHistory: boolean;
  setShowSalesHistory: (v: boolean) => void;
  onVoidSale: (saleId: string) => void;
  onExportDaily: () => void;
  fetchCustomers: () => void;
  subtotal: number;
  itemDiscounts: number;
  total: number;
  changeDue: number;
  filteredCustomers: Customer[];
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  showCustomerList: boolean;
  setShowCustomerList: (v: boolean) => void;
}

export function CartPanel({
  cart,
  register,
  paymentMethod,
  setPaymentMethod,
  discount,
  setDiscount,
  cashReceived,
  setCashReceived,
  amountPaid,
  setAmountPaid,
  accountDue,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  processing,
  editingItemDiscount,
  setEditingItemDiscount,
  itemDiscountValue,
  setItemDiscountValue,
  editingQty,
  setEditingQty,
  qtyValue,
  setQtyValue,
  onUpdateQuantity,
  onSetQuantityDirect,
  onRemoveItem,
  onSetItemDiscount,
  onCheckout,
  onShowOpenModal,
  onShowCloseModal,
  onShowSalesHistory,
  dailySummary,
  todaySales,
  showSalesHistory,
  setShowSalesHistory,
  onVoidSale,
  onExportDaily,
  fetchCustomers,
  subtotal,
  itemDiscounts,
  total,
  changeDue,
  filteredCustomers,
  customerSearch,
  setCustomerSearch,
  showCustomerList,
  setShowCustomerList,
}: CartPanelProps) {
  return (
    <>
      {/* Cart header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <span className="font-semibold">Carrito</span>
          {cart.length > 0 && <Badge tone="default">{cart.length}</Badge>}
        </div>
        <div className="flex gap-1">
          {!register ? (
            <Button className="h-8 px-3 text-xs" onClick={onShowOpenModal}>
              <Wallet className="h-3.5 w-3.5 mr-1" /> Abrir caja
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="h-8 px-2"
                onClick={() => {
                  onShowSalesHistory();
                  setShowSalesHistory(!showSalesHistory);
                }}
                title="Historial del día"
              >
                <History className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" className="h-8 px-2" onClick={onShowSalesHistory}>
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                className="h-8 px-3 text-xs"
                onClick={onShowCloseModal}
              >
                Cerrar caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Escaneá o buscá productos</p>
            <p className="text-xs mt-1 opacity-70">F2 escanear · F3 buscar · F4 cobrar</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.sku}</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {editingQty === item.productId ? (
                    <input
                      type="number"
                      value={qtyValue}
                      onChange={(e) => setQtyValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(qtyValue);
                          if (!isNaN(val)) onSetQuantityDirect(item.productId, val);
                          setEditingQty(null);
                        }
                        if (e.key === "Escape") setEditingQty(null);
                      }}
                      onBlur={() => {
                        const val = parseInt(qtyValue);
                        if (!isNaN(val)) onSetQuantityDirect(item.productId, val);
                        setEditingQty(null);
                      }}
                      className="h-7 w-12 text-center text-sm font-medium rounded-md border border-primary bg-background"
                      autoFocus
                      min={1}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingQty(item.productId);
                        setQtyValue(String(item.quantity));
                      }}
                      className="h-7 w-12 text-center text-sm font-bold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Clic para editar cantidad"
                    >
                      x{item.quantity}
                    </button>
                  )}
                  <div className="flex items-center gap-0.5">
                    {[1, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => onSetQuantityDirect(item.productId, preset)}
                        className={`h-5 px-1 rounded text-[10px] font-medium transition-colors ${
                          item.quantity === preset
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-primary/10"
                        }`}
                      >
                        x{preset}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, -1)}
                      className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, 1)}
                      className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold w-20 text-right">
                  {moneyFormatter.format(item.unitPrice * item.quantity - item.discountAmount)}
                </div>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger-light transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {moneyFormatter.format(item.unitPrice)} x {item.quantity}
                </span>
                {editingItemDiscount === item.productId ? (
                  <div className="flex items-center gap-1 ml-auto">
                    <Input
                      type="number"
                      value={itemDiscountValue}
                      onChange={(e) => setItemDiscountValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          onSetItemDiscount(item.productId, Number(itemDiscountValue) || 0);
                        if (e.key === "Escape") {
                          setEditingItemDiscount(null);
                          setItemDiscountValue("");
                        }
                      }}
                      className="h-6 w-16 text-xs px-1"
                      placeholder="0"
                      autoFocus
                      min={0}
                    />
                    <button
                      onClick={() => onSetItemDiscount(item.productId, Number(itemDiscountValue) || 0)}
                      className="text-success hover:underline"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => {
                        setEditingItemDiscount(null);
                        setItemDiscountValue("");
                      }}
                      className="text-muted-foreground hover:underline"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingItemDiscount(item.productId);
                      setItemDiscountValue(item.discountAmount > 0 ? String(item.discountAmount) : "");
                    }}
                    className="ml-auto text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.discountAmount > 0 ? (
                      <span className="text-success">-{moneyFormatter.format(item.discountAmount)}</span>
                    ) : (
                      <span>Dto.</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart summary + checkout */}
      {cart.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          {/* Customer */}
          <div className="relative">
            {selectedCustomer ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="flex-1 font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.phone && (
                  <span className="text-xs text-muted-foreground">{selectedCustomer.phone}</span>
                )}
                <Link
                  href={`/dashboard/customers/${selectedCustomer.id}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Ver cuenta corriente"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-muted-foreground hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerList(true);
                  }}
                  onFocus={() => setShowCustomerList(true)}
                  onBlur={() => setTimeout(() => setShowCustomerList(false), 200)}
                  placeholder="Buscar cliente (nombre o teléfono)..."
                  className="h-9 text-sm"
                />
                {showCustomerList && customerSearch && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {filteredCustomers.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch("");
                          setShowCustomerList(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {c.name}{" "}
                        {c.phone && <span className="text-muted-foreground">· {c.phone}</span>}
                      </button>
                    ))}
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/dashboard/customers", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: customerSearch }),
                        });
                        const data = await res.json();
                        if (data.customer) {
                          setSelectedCustomer(data.customer);
                          setCustomerSearch("");
                          setShowCustomerList(false);
                          fetchCustomers();
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/5 border-t border-border"
                    >
                      + Crear &quot;{customerSearch}&quot;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Descuento"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="h-9 text-sm"
              min={0}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Descuento</span>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{moneyFormatter.format(subtotal - itemDiscounts)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Descuento</span>
                <span>-{moneyFormatter.format(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-foreground border-t pt-1">
              <span>Total</span>
              <span>{moneyFormatter.format(total)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="grid grid-cols-4 gap-1">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all ${
                    paymentMethod === method.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Cash received */}
          {paymentMethod === "CASH" && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Efectivo recibido"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="h-9 text-sm"
                min={0}
              />
              {changeDue > 0 && (
                <Badge tone="success" className="whitespace-nowrap">
                  Vuelto: {moneyFormatter.format(changeDue)}
                </Badge>
              )}
            </div>
          )}

          {/* Cta Cte / seña */}
          {paymentMethod === "ACCOUNT" && (
            <>
              {!selectedCustomer && (
                <p className="text-xs text-muted-foreground">
                  Seleccioná un cliente para cobrar a cuenta corriente.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  placeholder="Monto recibido (seña)"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="h-9 text-sm w-40"
                  min={0}
                />
                <Badge tone={accountDue > 0 ? "warning" : "success"} className="whitespace-nowrap">
                  {accountDue > 0
                    ? `Saldo a cuenta: ${moneyFormatter.format(accountDue)}`
                    : "Cuenta saldada"}
                </Badge>
              </div>
            </>
          )}

          {/* Checkout button */}
          <Button
            className="w-full h-12 text-lg font-bold"
            onClick={onCheckout}
            disabled={processing || !register}
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Procesando...
              </>
            ) : (
              <>Cobrar {moneyFormatter.format(total)}</>
            )}
          </Button>
        </div>
      )}

      {/* Sales history panel */}
      {showSalesHistory && register && (
        <SalesHistory
          todaySales={todaySales}
          onClose={() => setShowSalesHistory(false)}
          onVoidSale={onVoidSale}
        />
      )}

      {/* Daily summary when no cart */}
      {cart.length === 0 && dailySummary && register && (
        <div className="border-t border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">Resumen del día</h3>
            <button
              onClick={onExportDaily}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Download className="h-3 w-3" /> Exportar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Ventas</div>
              <div className="font-bold">{dailySummary.transactionCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Total</div>
              <div className="font-bold text-primary">
                {moneyFormatter.format(dailySummary.totalRevenue)}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Efectivo</div>
              <div className="font-bold">{moneyFormatter.format(dailySummary.cashTotal)}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-muted-foreground">Tarjeta</div>
              <div className="font-bold">{moneyFormatter.format(dailySummary.cardTotal)}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
