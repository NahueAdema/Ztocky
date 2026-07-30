"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Check, Loader2, Package, Plus, ScanLine, X, DollarSign, TrendingUp, AlertTriangle, Wallet, CreditCard, ArrowRightLeft, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { moneyFormatter } from "@/lib/format";

type ProductResult = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  category: string | null;
  isActive: boolean;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type ScanHistory = {
  product: string;
  sku: string;
  stock: number;
  price: number;
  found: boolean;
  timestamp: string;
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo", icon: DollarSign, color: "text-success" },
  { value: "CARD", label: "Tarjeta", icon: CreditCard, color: "text-sky" },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowRightLeft, color: "text-primary" },
  { value: "ACCOUNT", label: "Cta Cte", icon: User, color: "text-warning" },
];

export default function ScanPage() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastCodeRef = useRef<string>("");
  const scanningRef = useRef(false);

  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selling, setSelling] = useState(false);

  const [newName, setNewName] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newCategory, setNewCategory] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSkuSubmit = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setProduct(null);
    setNotFound(false);
    setShowCreate(false);
    setFeedback(null);
    try {
      const res = await fetch(`/api/dashboard/products/by-sku?sku=${encodeURIComponent(code.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          setNotFound(true);
          setNewName("");
          setNewSellingPrice("");
          setNewCostPrice("");
          setNewStock("0");
          setNewCategory("");
          setHistory((prev) => [{ product: "—", sku: code.trim(), stock: 0, price: 0, found: false, timestamp: new Date().toISOString() }, ...prev].slice(0, 20));
        } else {
          setFeedback({ type: "error", message: "Error al buscar el producto" });
        }
        return;
      }
      const data = await res.json();
      setProduct(data);
      setHistory((prev) => [{ product: data.name, sku: data.sku, stock: data.currentStock, price: data.sellingPrice, found: true, timestamp: new Date().toISOString() }, ...prev].slice(0, 20));
    } catch {
      setFeedback({ type: "error", message: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateProduct = async () => {
    if (!newName.trim() || !newSellingPrice) return;
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          sku: sku.trim(),
          sellingPrice: Number(newSellingPrice),
          costPrice: Number(newCostPrice) || 0,
          currentStock: Number(newStock) || 0,
          category: newCategory.trim() || null,
          minStock: 5,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFeedback({ type: "error", message: data.error || "Error al crear el producto" });
        return;
      }
      const data = await res.json();
      setProduct({
        id: data.id,
        name: newName.trim(),
        sku: sku.trim(),
        currentStock: Number(newStock) || 0,
        minStock: 5,
        costPrice: Number(newCostPrice) || 0,
        sellingPrice: Number(newSellingPrice),
        category: newCategory.trim() || null,
        isActive: true,
      });
      setNotFound(false);
      setShowCreate(false);
      setFeedback({ type: "success", message: `Producto "${newName.trim()}" creado correctamente` });
      setHistory((prev) => [{ product: newName.trim(), sku: sku.trim(), stock: Number(newStock) || 0, price: Number(newSellingPrice), found: true, timestamp: new Date().toISOString() }, ...prev].slice(0, 20));
      inputRef.current?.focus();
    } catch {
      setFeedback({ type: "error", message: "Error de conexión al crear el producto" });
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSkuSubmit(sku);
  };

  const handleSale = async () => {
    if (!product) return;
    setSelling(true);
    try {
      const res = await fetch("/api/dashboard/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1, unitPrice: product.sellingPrice }],
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Error al registrar la venta", "error");
        return;
      }
      const label = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod;
      toast(`Venta registrada — ${label}`, "success");
      setProduct({ ...product, currentStock: product.currentStock - 1 });
      setHistory((prev) => [{ product: product.name, sku: product.sku, stock: product.currentStock - 1, price: product.sellingPrice, found: true, timestamp: new Date().toISOString() }, ...prev].slice(0, 20));
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSelling(false);
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
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "codabar", "data_matrix", "itf", "pdf417"],
        });
        const scan = async () => {
          if (!videoRef.current || !scanningRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code !== lastCodeRef.current) {
                lastCodeRef.current = code;
                setSku(code);
                scanningRef.current = false;
                setCameraActive(false);
                handleSkuSubmit(code);
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
  }, [cameraActive, handleSkuSubmit]);

  useEffect(() => {
    inputRef.current?.focus();
    setHasBarcodeDetector("BarcodeDetector" in window);
  }, []);

  const resetSearch = () => {
    setSku("");
    setProduct(null);
    setNotFound(false);
    setShowCreate(false);
    setFeedback(null);
    inputRef.current?.focus();
  };

  const margin = product ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title text-3xl font-bold tracking-tight">Consulta rápida</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escaneá un código de barras o ingresalo manualmente para ver la información de un producto al instante.
        </p>
      </div>

      {/* Scanner input */}
      <Card className="card-hover">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ingresá o escaneá un código de barras..."
                className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-base shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                autoFocus
              />
              {sku && (
                <button
                  type="button"
                  onClick={resetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              disabled={!hasBarcodeDetector}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all ${
                cameraActive
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                  : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={hasBarcodeDetector ? "Escanear con cámara" : "No disponible en este navegador"}
            >
              <Camera className="h-5 w-5" />
            </button>
          </form>
          {!hasBarcodeDetector && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Camera className="h-3 w-3" />
              Escaneo por cámara requiere Chrome o Edge. En PC conectá un escáner USB y enfocá el input.
            </p>
          )}

          {cameraActive && (
            <div className="relative mt-4 overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-64 w-full object-cover" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
              </div>
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full">
                Enfocá el código de barras
              </p>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
              <X className="h-3 w-3" /> {cameraError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Buscando producto...</span>
        </div>
      )}

      {/* Not found */}
      {notFound && !showCreate && (
        <Card className="border-danger/20">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light">
              <X className="h-6 w-6 text-danger" />
            </div>
            <p className="font-semibold">Producto no encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No existe un producto con el código <span className="font-mono font-medium text-foreground">{sku}</span>
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={resetSearch}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Buscar otro código
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Crear producto
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create product form */}
      {showCreate && (
        <Card className="border-primary/20 card-hover">
          <div className="h-1.5 bg-gradient-to-r from-primary to-teal-400" />
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Nuevo producto</h3>
                <p className="text-xs text-muted-foreground">
                  SKU: <span className="font-mono font-medium">{sku}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Arroz"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Precio de venta *</label>
                <input
                  type="number"
                  min={0}
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                  placeholder="1200"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Precio de costo</label>
                <input
                  type="number"
                  min={0}
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  placeholder="800"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Stock inicial</label>
                <input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoría</label>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej: Almacén"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={creating || !newName.trim() || !newSellingPrice}
                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Crear producto
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product result */}
      {product && (
        <Card className="card-hover overflow-hidden border-primary/20">
          <div className="h-1.5 bg-gradient-to-r from-primary to-teal-400" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                </div>
              </div>
              <Badge tone={product.currentStock <= product.minStock ? "danger" : "success"} className="text-xs">
                {product.currentStock} en stock
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <DollarSign className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Venta</p>
                <p className="mt-1 text-lg font-bold text-foreground">{moneyFormatter.format(product.sellingPrice)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <DollarSign className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Costo</p>
                <p className="mt-1 text-lg font-bold text-foreground">{moneyFormatter.format(product.costPrice)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <TrendingUp className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Margen</p>
                <p className={`mt-1 text-lg font-bold ${margin >= 30 ? "text-success" : margin >= 15 ? "text-warning" : "text-danger"}`}>
                  {margin}%
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {product.category && (
                <Badge tone="muted" className="text-[11px]">{product.category}</Badge>
              )}
              {product.currentStock <= product.minStock && (
                <Badge tone="warning" className="text-[11px]">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Stock bajo (mínimo: {product.minStock})
                </Badge>
              )}
              {!product.isActive && (
                <Badge tone="danger" className="text-[11px]">Inactivo</Badge>
              )}
            </div>

            <div className="mt-5 border-t border-border pt-4 space-y-3">
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

              <button
                onClick={handleSale}
                disabled={selling || product.currentStock <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {product.currentStock <= 0 ? "Sin stock" : "Vender"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-success/20 bg-success-light/30 text-success"
              : "border-danger/20 bg-danger-light/30 text-danger"
          }`}
        >
          {feedback.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {feedback.message}
        </div>
      )}

      {/* Scan history */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="h-4 w-4 text-primary" />
              Consultas recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="text-left">Producto</th>
                    <th className="text-left">SKU</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={i}>
                      <td className="font-medium">{item.product}</td>
                      <td className="font-mono text-xs text-muted-foreground">{item.sku}</td>
                      <td className="text-right text-sm">{item.found ? item.stock : "—"}</td>
                      <td className="text-right text-sm">{item.found ? moneyFormatter.format(item.price) : "—"}</td>
                      <td className="text-right">
                        <Badge tone={item.found ? "success" : "danger"} className="text-[10px]">
                          {item.found ? "Encontrado" : "No existe"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Los escáneres de código de barras físicos funcionan automáticamente: enfocá el input y escaneá.
      </p>
    </div>
  );
}
