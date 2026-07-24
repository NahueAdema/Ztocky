"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";
import { downloadReceiptPDF, printReceipt } from "@/lib/receipt";
import {
  Search, ScanLine, ShoppingCart, Trash2, Plus, Minus, X,
  DollarSign, CreditCard, ArrowRightLeft, User, Loader2,
  CheckCircle2, Receipt, Wallet, Package, BarChart3, History, Ban, Download, Camera
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  category: string | null;
  isActive: boolean;
};

type CartItem = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
};

type CashRegister = {
  id: string;
  openingAmount: number;
  status: string;
  openedAt: string;
  totalSales: number;
  cashSales: number;
  transactionCount: number;
};

type SaleResult = {
  id: string;
  receiptNumber: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  saleDate: string;
  items: { name: string; sku: string; quantity: number; unitPrice: number; discountAmount: number; totalPrice: number }[];
};

type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

type TodaySale = {
  id: string;
  receiptNumber: number;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
  seller: string;
  customer?: string;
  createdAt: string;
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo", icon: DollarSign, color: "text-success" },
  { value: "CARD", label: "Tarjeta", icon: CreditCard, color: "text-sky" },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowRightLeft, color: "text-primary" },
  { value: "ACCOUNT", label: "Cta Cte", icon: User, color: "text-warning" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Bebidas: "bg-sky text-sky-foreground",
  Lácteos: "bg-primary text-primary-foreground",
  Panadería: "bg-warning text-warning-foreground",
  Carnes: "bg-danger text-danger-foreground",
  Verduras: "bg-success text-success-foreground",
  Snacks: "bg-accent text-accent-foreground",
  Limpieza: "bg-muted-foreground text-background",
};

function getCategoryColor(category: string | null): string {
  if (!category) return "bg-muted text-muted-foreground";
  return CATEGORY_COLORS[category] ?? "bg-primary text-primary-foreground";
}

export default function POSPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loadingRegister, setLoadingRegister] = useState(true);
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const barcodeRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(false);
  const lastCodeRef = useRef("");


  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchRegister = useCallback(async () => {
    try {
      setLoadingRegister(true);
      const res = await fetch("/api/dashboard/pos/session");
      const data = await res.json();
      setRegister(data.register);
    } catch { /* ignore */ }
    finally { setLoadingRegister(false); }
  }, []);

  const fetchDailySummary = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/pos/today");
      const data = await res.json();
      setDailySummary(data.summary);
      setTodaySales(data.summary?.recentSales ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/customers");
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchWorkspaceName = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.workspace?.name) setWorkspaceName(data.workspace.name);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchRegister();
    fetchDailySummary();
    fetchCustomers();
    fetchWorkspaceName();
  }, [fetchProducts, fetchRegister, fetchDailySummary, fetchCustomers, fetchWorkspaceName]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "F2") {
        e.preventDefault();
        barcodeRef.current?.focus();
      } else if (e.key === "F3") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[placeholder*="Buscar por nombre"]');
        searchInput?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0 && register) handleCheckout();
      } else if (e.key === "Escape") {
        if (showOpenModal) setShowOpenModal(false);
        else if (showCloseModal) setShowCloseModal(false);
        else if (showReceipt) setShowReceipt(null);
        else if (isInput) {
          setSearch("");
          setBarcodeInput("");
          setCustomerSearch("");
          setShowCustomerList(false);
          setEditingItemDiscount(null);
          setEditingQty(null);
          barcodeRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const filtered = products.filter((p) => {
    if (!p.isActive) return false;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q);
  });

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      toast("Sin stock disponible", "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast(`Stock máximo: ${product.currentStock}`, "error");
          return prev;
        }
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        quantity: 1,
        discountAmount: 0,
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      const product = products.find((p) => p.id === productId);
      if (newQty < 1) return i;
      if (product && newQty > product.currentStock) {
        toast(`Stock máximo: ${product.currentStock}`, "error");
        return i;
      }
      return { ...i, quantity: newQty };
    }));
  };

  const setQuantityDirect = (productId: string, qty: number) => {
    if (qty < 1) return;
    const product = products.find((p) => p.id === productId);
    if (product && qty > product.currentStock) {
      toast(`Stock máximo: ${product.currentStock}`, "error");
      return;
    }
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const setItemDiscount = (productId: string, amount: number) => {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, discountAmount: Math.max(0, amount) } : i));
    setEditingItemDiscount(null);
    setItemDiscountValue("");
  };

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemDiscounts = cart.reduce((sum, i) => sum + i.discountAmount, 0);
  const total = subtotal - itemDiscounts - discount;

  const handleCheckout = async () => {
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
      setCart([]);
      setDiscount(0);
      setCashReceived("");
      setSelectedCustomer(null);
      fetchProducts();
      fetchRegister();
      fetchDailySummary();
      toast("Venta registrada", "success");
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleVoidSale = async (saleId: string) => {
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
  };

  const handleOpenRegister = async () => {
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
  };

  const handleCloseRegister = async () => {
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
  };

  const handleBarcodeSubmit = async (code: string) => {
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
  };

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setCameraActive(false);
    setCameraError("");
  }, []);

  const startCamera = useCallback(() => {
    setCameraError("");
    if (!("BarcodeDetector" in window)) {
      setCameraError("Tu navegador no soporta detección por cámara.");
      return;
    }
    scanningRef.current = true;
    lastCodeRef.current = "";
    setCameraActive(true);
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      scanningRef.current = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    let cancelled = false;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!scanningRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "codabar"],
        });
        const scan = async () => {
          if (!videoRef.current || !scanningRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code !== lastCodeRef.current) {
                lastCodeRef.current = code;
                setBarcodeInput(code);
                scanningRef.current = false;
                setCameraActive(false);
                handleBarcodeSubmit(code);
                if (videoRef.current?.srcObject) {
                  (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
                  videoRef.current.srcObject = null;
                }
                return;
              }
            }
          } catch { /* keep going */ }
          if (scanningRef.current) setTimeout(scan, 400);
        };
        scan();
      } catch {
        if (!cancelled) {
          setCameraError("No se pudo acceder a la cámara. Verificá los permisos.");
          setCameraActive(false);
        }
      }
    };
    initCamera();
    return () => { cancelled = true; };
  }, [cameraActive, handleBarcodeSubmit]);

  const handleExportDaily = () => {
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
  };

  const changeDue = paymentMethod === "CASH" && cashReceived ? Math.max(0, Number(cashReceived) - total) : 0;

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q);
  });

  if (showReceipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-xl font-bold">Venta completada</h2>
            <p className="text-muted-foreground">Ticket N° {showReceipt.receiptNumber}</p>
            {selectedCustomer && <p className="text-sm text-muted-foreground">Cliente: {selectedCustomer.name}</p>}
            <div className="text-3xl font-bold text-primary">{moneyFormatter.format(showReceipt.totalAmount)}</div>
            <div className="text-sm text-muted-foreground">{PAYMENT_METHODS.find((m) => m.value === showReceipt.paymentMethod)?.label}</div>
            <div className="border-t pt-4 space-y-1 text-sm text-left">
              {showReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{moneyFormatter.format(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            {showReceipt.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Descuento</span>
                <span>-{moneyFormatter.format(showReceipt.discountAmount)}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowReceipt(null)}>
                Cerrar
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => downloadReceiptPDF({
                receiptNumber: showReceipt.receiptNumber,
                totalAmount: showReceipt.totalAmount,
                discountAmount: showReceipt.discountAmount,
                paymentMethod: showReceipt.paymentMethod,
                saleDate: showReceipt.saleDate,
                items: showReceipt.items,
                customerName: selectedCustomer?.name,
                storeName: workspaceName,
              })}>
                <Receipt className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button className="flex-1" onClick={() => printReceipt({
                receiptNumber: showReceipt.receiptNumber,
                totalAmount: showReceipt.totalAmount,
                discountAmount: showReceipt.discountAmount,
                paymentMethod: showReceipt.paymentMethod,
                saleDate: showReceipt.saleDate,
                items: showReceipt.items,
                customerName: selectedCustomer?.name,
                storeName: workspaceName,
              })}>
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] -m-6 lg:-m-8">
      {/* Left panel - Products */}
      <div className="flex-1 flex flex-col border-r border-border bg-background overflow-hidden">
        {/* Barcode scanner */}
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={barcodeRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && barcodeInput) {
                  handleBarcodeSubmit(barcodeInput);
                }
              }}
              placeholder="Escanear código de barras..."
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              autoFocus
            />
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              type="button"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                cameraActive
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={cameraActive ? "Cerrar cámara" : "Escanear con cámara"}
            >
              <Camera className="h-4 w-4" />
            </button>
            <Badge tone={register ? "success" : "warning"} className="shrink-0">
              {register ? "Caja abierta" : "Sin caja"}
            </Badge>
          </div>
          {cameraActive && (
            <div className="mt-2 relative rounded-lg overflow-hidden border border-border">
              <video ref={videoRef} className="w-full h-48 object-cover bg-black" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-24 border-2 border-primary/60 rounded-lg" />
              </div>
              <button
                onClick={stopCamera}
                type="button"
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80 bg-black/40 py-1">Apuntá al código de barras</p>
            </div>
          )}
          {cameraError && (
            <p className="mt-1.5 text-xs text-danger">{cameraError}</p>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search) {
                  const product = filtered[0];
                  if (product) addToCart(product);
                }
              }}
              placeholder="Buscar por nombre, SKU o categoría..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-border">
          {Array.from(new Set(products.filter((p) => p.isActive).map((p) => p.category).filter(Boolean) as string[])).map((cat) => (
            <button
              key={cat}
              onClick={() => setSearch(cat)}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">{search ? "Sin resultados" : "No hay productos"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.currentStock <= 0}
                  className="text-left p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getCategoryColor(product.category)}`}>
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary truncate">{product.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{product.sku}</div>
                  <div className="text-lg font-bold text-primary mt-2">{moneyFormatter.format(product.sellingPrice)}</div>
                  <Badge tone={product.currentStock <= 0 ? "danger" : product.currentStock <= 10 ? "warning" : "success"} className="mt-1 text-[10px]">
                    Stock: {product.currentStock}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Cart */}
      <div className="w-full lg:w-[380px] flex flex-col bg-card border-l border-border">
        {/* Cart header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="font-semibold">Carrito</span>
            {cart.length > 0 && <Badge tone="default">{cart.length}</Badge>}
          </div>
          <div className="flex gap-1">
            {!register ? (
              <Button className="h-8 px-3 text-xs" onClick={() => setShowOpenModal(true)}>
                <Wallet className="h-3.5 w-3.5 mr-1" /> Abrir caja
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="h-8 px-2" onClick={() => { fetchDailySummary(); setShowSalesHistory(!showSalesHistory); }} title="Historial del día">
                  <History className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => { fetchDailySummary(); }}>
                  <BarChart3 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => setShowCloseModal(true)}>
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
                            if (!isNaN(val)) setQuantityDirect(item.productId, val);
                            setEditingQty(null);
                          }
                          if (e.key === "Escape") setEditingQty(null);
                        }}
                        onBlur={() => {
                          const val = parseInt(qtyValue);
                          if (!isNaN(val)) setQuantityDirect(item.productId, val);
                          setEditingQty(null);
                        }}
                        className="h-7 w-12 text-center text-sm font-medium rounded-md border border-primary bg-background"
                        autoFocus
                        min={1}
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingQty(item.productId); setQtyValue(String(item.quantity)); }}
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
                          onClick={() => setQuantityDirect(item.productId, preset)}
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
                      <button onClick={() => updateQuantity(item.productId, -1)} className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold w-20 text-right">{moneyFormatter.format(item.unitPrice * item.quantity - item.discountAmount)}</div>
                  <button onClick={() => removeFromCart(item.productId)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger-light transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{moneyFormatter.format(item.unitPrice)} x {item.quantity}</span>
                  {editingItemDiscount === item.productId ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <Input
                        type="number"
                        value={itemDiscountValue}
                        onChange={(e) => setItemDiscountValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setItemDiscount(item.productId, Number(itemDiscountValue) || 0);
                          if (e.key === "Escape") { setEditingItemDiscount(null); setItemDiscountValue(""); }
                        }}
                        className="h-6 w-16 text-xs px-1"
                        placeholder="0"
                        autoFocus
                        min={0}
                      />
                      <button onClick={() => setItemDiscount(item.productId, Number(itemDiscountValue) || 0)} className="text-success hover:underline">OK</button>
                      <button onClick={() => { setEditingItemDiscount(null); setItemDiscountValue(""); }} className="text-muted-foreground hover:underline">X</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingItemDiscount(item.productId); setItemDiscountValue(item.discountAmount > 0 ? String(item.discountAmount) : ""); }}
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
                  {selectedCustomer.phone && <span className="text-xs text-muted-foreground">{selectedCustomer.phone}</span>}
                  <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-danger">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerList(true); }}
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
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setShowCustomerList(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          {c.name} {c.phone && <span className="text-muted-foreground">· {c.phone}</span>}
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

            {/* Cash received (only for cash) */}
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

            {/* Checkout button */}
            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handleCheckout}
              disabled={processing || !register}
            >
              {processing ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Procesando...</>
              ) : (
                <>Cobrar {moneyFormatter.format(total)}</>
              )}
            </Button>
          </div>
        )}

        {/* Sales history panel */}
        {showSalesHistory && register && (
          <div className="border-t border-border p-4 space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">Ventas de hoy</h3>
              <button onClick={() => setShowSalesHistory(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {todaySales.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Sin ventas hoy</p>
            ) : (
              todaySales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs">
                  <div>
                    <div className="font-medium">#{String(sale.receiptNumber).padStart(4, "0")} · {sale.itemCount} items</div>
                    <div className="text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {sale.seller}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{moneyFormatter.format(sale.totalAmount)}</span>
                    <button onClick={() => handleVoidSale(sale.id)} className="text-muted-foreground hover:text-danger" title="Anular venta">
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Daily summary when no cart */}
        {cart.length === 0 && dailySummary && register && (
          <div className="border-t border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">Resumen del día</h3>
              <button onClick={handleExportDaily} className="flex items-center gap-1 text-xs text-primary hover:underline">
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
                <div className="font-bold text-primary">{moneyFormatter.format(dailySummary.totalRevenue)}</div>
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
      </div>

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-muted/80 backdrop-blur-sm text-[10px] text-muted-foreground select-none z-30">
        <span><kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono">F2</kbd> Escanear</span>
        <span className="opacity-40">·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono">F3</kbd> Buscar</span>
        <span className="opacity-40">·</span>
        <span><kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono">F4</kbd> Cobrar</span>
      </div>

      {/* Open register modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md animate-overlay">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-2xl animate-modal">
            <h2 className="text-lg font-bold mb-4">Abrir caja</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Efectivo inicial</label>
                <Input
                  type="number"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                  min={0}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowOpenModal(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleOpenRegister}>Abrir</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close register modal */}
      {showCloseModal && register && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md animate-overlay">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-2xl animate-modal">
            <h2 className="text-lg font-bold mb-4">Cerrar caja</h2>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Apertura</span><span>{moneyFormatter.format(register.openingAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ventas efectivo</span><span>{moneyFormatter.format(register.cashSales)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Esperado en caja</span><span className="font-bold">{moneyFormatter.format(register.openingAmount + register.cashSales)}</span></div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Efectivo contado</label>
                <Input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                  min={0}
                  autoFocus
                />
              </div>
              {closingAmount && (
                <div className={`p-2 rounded-lg text-sm font-medium text-center ${
                  Number(closingAmount) === register.openingAmount + register.cashSales
                    ? "bg-success-light text-success"
                    : "bg-warning-light text-warning"
                }`}>
                  Diferencia: {moneyFormatter.format(Number(closingAmount) - register.openingAmount - register.cashSales)}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCloseModal(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleCloseRegister}>Cerrar caja</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
