"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CashRegisterModals } from "@/components/pos/CashRegisterModals";
import { ReceiptView } from "@/components/pos/ReceiptView";
import { useCameraScanner } from "@/components/pos/useCameraScanner";
import { useKeyboardShortcuts } from "@/components/pos/useKeyboardShortcuts";
import { usePosData } from "@/components/pos/usePosData";
import { useCart } from "@/components/pos/useCart";
import { usePosHandlers } from "@/components/pos/usePosHandlers";
import {
  type Product,
  type CashRegister,
  type SaleResult,
  type Customer,
  type TodaySale,
} from "@/components/pos/types";
import { PAYMENT_METHODS } from "@/components/pos/constants";

export default function POSPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<SaleResult | null>(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [dailySummary, setDailySummary] = useState<{ totalRevenue: number; transactionCount: number; cashTotal: number; cardTotal: number } | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [todaySales, setTodaySales] = useState<TodaySale[]>([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [editingItemDiscount, setEditingItemDiscount] = useState<string | null>(null);
  const [itemDiscountValue, setItemDiscountValue] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [editingQty, setEditingQty] = useState<string | null>(null);
  const [qtyValue, setQtyValue] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);

  const { cart, addToCart, updateQuantity, setQuantityDirect, removeFromCart, setItemDiscount: applyItemDiscount, clearCart, subtotal, itemDiscounts } = useCart(products);

  const handleBarcodeSubmit = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      try {
        const res = await fetch(`/api/dashboard/products/by-sku?sku=${encodeURIComponent(code.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            addToCart(data.product);
            setBarcodeInput("");
            return;
          }
        }
        toast("Producto no encontrado", "error");
      } catch {
        toast("Error de conexión", "error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { cameraActive, setCameraActive, cameraError, startCamera, stopCamera, videoRef } =
    useCameraScanner({ onScan: handleBarcodeSubmit });

  const {
    fetchProducts,
    fetchRegister,
    fetchDailySummary,
    fetchCustomers,
    fetchAll,
  } = usePosData({
    setProducts,
    setRegister,
    setLoadingRegister: () => {},
    setDailySummary,
    setTodaySales,
    setCustomers,
    setWorkspaceName,
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const { handleCheckout, handleVoidSale, handleOpenRegister, handleCloseRegister, handleExportDaily } =
    usePosHandlers({
      cart,
      register,
      paymentMethod,
      discount,
      cashReceived,
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
    });

  const setItemDiscount = (productId: string, amount: number) => {
    applyItemDiscount(productId, amount);
    setEditingItemDiscount(null);
    setItemDiscountValue("");
  };

  const total = subtotal - itemDiscounts - discount;

  useKeyboardShortcuts({
    barcodeRef,
    onBarcodeFocus: () => barcodeRef.current?.focus(),
    onSearchFocus: () => {
      const searchInput = document.querySelector<HTMLInputElement>('[placeholder*="Buscar por nombre"]');
      searchInput?.focus();
    },
    onCheckout: handleCheckout,
    cartLength: cart.length,
    registerExists: !!register,
    showOpenModal,
    showCloseModal,
    showReceipt: !!showReceipt,
    showMobileCart,
    onCloseOpenModal: () => setShowOpenModal(false),
    onCloseCloseModal: () => setShowCloseModal(false),
    onCloseReceipt: () => setShowReceipt(null),
    onCloseMobileCart: () => setShowMobileCart(false),
    onClearInputs: () => {
      setSearch("");
      setBarcodeInput("");
      setCustomerSearch("");
      setShowCustomerList(false);
      setEditingItemDiscount(null);
      setEditingQty(null);
    },
  });

  const changeDue = paymentMethod === "CASH" && cashReceived ? Math.max(0, Number(cashReceived) - total) : 0;

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q);
  });

  if (showReceipt) {
    return (
      <ReceiptView
        sale={showReceipt}
        selectedCustomer={selectedCustomer}
        workspaceName={workspaceName}
        onClose={() => setShowReceipt(null)}
      />
    );
  }

  const productGridProps = {
    products,
    search,
    setSearch,
    barcodeInput,
    setBarcodeInput,
    barcodeRef,
    onAddToCart: addToCart,
    onBarcodeSubmit: handleBarcodeSubmit,
    cameraActive,
    setCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    videoRef,
    register,
  };

  const cartPanelProps = {
    cart,
    register,
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,
    cashReceived,
    setCashReceived,
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
    onUpdateQuantity: updateQuantity,
    onSetQuantityDirect: setQuantityDirect,
    onRemoveItem: removeFromCart,
    onSetItemDiscount: setItemDiscount,
    onCheckout: handleCheckout,
    onShowOpenModal: () => setShowOpenModal(true),
    onShowCloseModal: () => setShowCloseModal(true),
    onShowSalesHistory: () => { fetchDailySummary(); },
    dailySummary,
    todaySales,
    showSalesHistory,
    setShowSalesHistory,
    onVoidSale: handleVoidSale,
    onExportDaily: handleExportDaily,
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
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] -m-6 lg:-m-8">
      {/* Desktop left panel */}
      <div className="hidden lg:flex flex-1 flex-col border-r border-border bg-background overflow-hidden">
        <ProductGrid {...productGridProps} mode="desktop" />
      </div>

      {/* Desktop right panel */}
      <div className="hidden lg:flex w-[380px] flex-col bg-card border-l border-border">
        <CartPanel {...cartPanelProps} />
      </div>

      {/* Mobile left panel */}
      <div className="flex lg:hidden flex-1 flex-col bg-background overflow-hidden">
        <ProductGrid {...productGridProps} mode="mobile" />
      </div>

      {/* Mobile floating cart button */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button
          onClick={() => setShowMobileCart(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-danger text-danger-foreground text-[10px] font-bold flex items-center justify-center">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <span className="text-sm font-semibold">{moneyFormatter.format(total)}</span>
          )}
        </button>
      </div>

      {/* Mobile cart overlay */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 flex flex-col bg-card lg:hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <button
              onClick={() => setShowMobileCart(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="font-semibold">Carrito</span>
            {cart.length > 0 && <Badge tone="default">{cart.length}</Badge>}
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col">
            <CartPanel {...cartPanelProps} />
          </div>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-muted/80 backdrop-blur-sm text-[10px] text-muted-foreground select-none z-30">
        <span><kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono">F2</kbd> Escanear</span>
        <span className="opacity-40">·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono">F3</kbd> Buscar</span>
        <span className="opacity-40">·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono">F4</kbd> Cobrar</span>
      </div>

      <CashRegisterModals
        showOpenModal={showOpenModal}
        setShowOpenModal={setShowOpenModal}
        showCloseModal={showCloseModal}
        setShowCloseModal={setShowCloseModal}
        openingAmount={openingAmount}
        setOpeningAmount={setOpeningAmount}
        closingAmount={closingAmount}
        setClosingAmount={setClosingAmount}
        register={register}
        onOpenRegister={handleOpenRegister}
        onCloseRegister={handleCloseRegister}
      />
    </div>
  );
}
