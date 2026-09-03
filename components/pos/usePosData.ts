"use client";

import { useCallback } from "react";
import { type Product, type CashRegister, type Customer, type TodaySale, type StoreSettings } from "./types";
import { saveProductsCache, getProductsCache } from "@/lib/offline";

interface UsePosDataProps {
  deviceId?: string;
  setProducts: (v: Product[]) => void;
  setRegister: (v: CashRegister | null) => void;
  setLoadingRegister: (v: boolean) => void;
  setDailySummary: (v: { totalRevenue: number; transactionCount: number; cashTotal: number; cardTotal: number } | null) => void;
  setTodaySales: (v: TodaySale[]) => void;
  setCustomers: (v: Customer[]) => void;
  setWorkspaceName: (v: string) => void;
  setStoreSettings: (v: StoreSettings | null) => void;
}

export function usePosData({
  deviceId,
  setProducts,
  setRegister,
  setLoadingRegister,
  setDailySummary,
  setTodaySales,
  setCustomers,
  setWorkspaceName,
  setStoreSettings,
}: UsePosDataProps) {
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/products");
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const list = (data.products ?? []) as Product[];
      setProducts(list);
      saveProductsCache(list);
    } catch {
      const cached = getProductsCache();
      if (cached && cached.length > 0) {
        setProducts(cached);
      }
    }
  }, [setProducts]);

  const fetchRegister = useCallback(async () => {
    try {
      setLoadingRegister(true);
      const params = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : "";
      const res = await fetch(`/api/dashboard/pos/session${params}`);
      const data = await res.json();
      setRegister(data.register);
    } catch { /* ignore */ }
    finally { setLoadingRegister(false); }
  }, [deviceId, setRegister, setLoadingRegister]);

  const fetchDailySummary = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/pos/today");
      const data = await res.json();
      setDailySummary(data.summary);
      setTodaySales(data.summary?.recentSales ?? []);
    } catch { /* ignore */ }
  }, [setDailySummary, setTodaySales]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/customers");
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch { /* ignore */ }
  }, [setCustomers]);

  const fetchWorkspaceName = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.workspace?.name) setWorkspaceName(data.workspace.name);
    } catch { /* ignore */ }
  }, [setWorkspaceName]);

  const fetchStoreSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/workspace/store-settings");
      if (res.ok) {
        const data = await res.json();
        setStoreSettings(data);
      }
    } catch { /* ignore */ }
  }, [setStoreSettings]);

  const fetchAll = useCallback(() => {
    fetchProducts();
    fetchRegister();
    fetchDailySummary();
    fetchCustomers();
    fetchWorkspaceName();
    fetchStoreSettings();
  }, [fetchProducts, fetchRegister, fetchDailySummary, fetchCustomers, fetchWorkspaceName, fetchStoreSettings]);

  return {
    fetchProducts,
    fetchRegister,
    fetchDailySummary,
    fetchCustomers,
    fetchWorkspaceName,
    fetchStoreSettings,
    fetchAll,
  };
}
