"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { type Product, type CartItem } from "./types";

export function useCart(products: Product[]) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (product: Product) => {
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
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.sellingPrice,
            quantity: 1,
            discountAmount: 0,
          },
        ];
      });
    },
    [toast]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setCart((prev) =>
        prev.map((i) => {
          if (i.productId !== productId) return i;
          const newQty = i.quantity + delta;
          const product = products.find((p) => p.id === productId);
          if (newQty < 1) return i;
          if (product && newQty > product.currentStock) {
            toast(`Stock máximo: ${product.currentStock}`, "error");
            return i;
          }
          return { ...i, quantity: newQty };
        })
      );
    },
    [products, toast]
  );

  const setQuantityDirect = useCallback(
    (productId: string, qty: number) => {
      if (qty < 1) return;
      const product = products.find((p) => p.id === productId);
      if (product && qty > product.currentStock) {
        toast(`Stock máximo: ${product.currentStock}`, "error");
        return;
      }
      setCart((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
      );
    },
    [products, toast]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setItemDiscount = useCallback((productId: string, amount: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, discountAmount: Math.max(0, amount) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemDiscounts = cart.reduce((sum, i) => sum + i.discountAmount, 0);

  return {
    cart,
    addToCart,
    updateQuantity,
    setQuantityDirect,
    removeFromCart,
    setItemDiscount,
    clearCart,
    subtotal,
    itemDiscounts,
  };
}
