"use client";

import { RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { moneyFormatter } from "@/lib/format";
import { Search, ScanLine, Package, Camera, X } from "lucide-react";
import { type Product, type CashRegister } from "./types";
import { getCategoryColor } from "./constants";

interface ProductGridProps {
  products: Product[];
  search: string;
  setSearch: (v: string) => void;
  barcodeInput: string;
  setBarcodeInput: (v: string) => void;
  barcodeRef: RefObject<HTMLInputElement | null>;
  onAddToCart: (product: Product) => void;
  onBarcodeSubmit: (code: string) => void;
  cameraActive: boolean;
  setCameraActive: (v: boolean) => void;
  cameraError: string;
  startCamera: () => void;
  stopCamera: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  register: CashRegister | null;
  mode?: "desktop" | "mobile";
}

export function ProductGrid({
  products,
  search,
  setSearch,
  barcodeInput,
  setBarcodeInput,
  barcodeRef,
  onAddToCart,
  onBarcodeSubmit,
  cameraActive,
  cameraError,
  startCamera,
  stopCamera,
  videoRef,
  register,
  mode = "desktop",
}: ProductGridProps) {
  const filtered = products.filter((p) => {
    if (!p.isActive) return false;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  const gridCols = mode === "desktop" ? "grid-cols-3 xl:grid-cols-5" : "grid-cols-2";

  return (
    <>
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
                onBarcodeSubmit(barcodeInput);
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
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80 bg-black/40 py-1">
              Apuntá al código de barras
            </p>
          </div>
        )}
        {cameraError && <p className="mt-1.5 text-xs text-danger">{cameraError}</p>}
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
                if (product) onAddToCart(product);
              }
            }}
            placeholder="Buscar por nombre, SKU o categoría..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-border">
        {Array.from(
          new Set(
            products
              .filter((p) => p.isActive)
              .map((p) => p.category)
              .filter(Boolean) as string[]
          )
        ).map((cat) => (
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
      <div className={`flex-1 overflow-y-auto p-4${mode === "mobile" ? " pb-24" : ""}`}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">{search ? "Sin resultados" : "No hay productos"}</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-3`}>
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={product.currentStock <= 0}
                className="text-left p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getCategoryColor(product.category)}`}
                  >
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary truncate">
                    {product.name}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{product.sku}</div>
                <div className="text-lg font-bold text-primary mt-2">
                  {moneyFormatter.format(product.sellingPrice)}
                </div>
                <Badge
                  tone={
                    product.currentStock <= 0
                      ? "danger"
                      : product.currentStock <= 10
                        ? "warning"
                        : "success"
                  }
                  className="mt-1 text-[10px]"
                >
                  Stock: {product.currentStock}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
