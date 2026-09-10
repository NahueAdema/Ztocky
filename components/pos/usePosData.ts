"use client";

import { useCallback, useRef } from "react";
import { type Product, type CashRegister, type Customer, type TodaySale, type StoreSettings } from "./types";
import { saveProductsCache, getProductsCache } from "@/lib/offline";

const PAGE_SIZE = 20;

interface UsePosDataProps {
  deviceId?: string;
  setProducts: (v: Product[] | ((prev: Product[]) => Product[])) => void;
  setRegister: (v: CashRegister | null) => void;
  setLoadingRegister: (v: boolean) => void;
  setDailySummary: (v: { totalRevenue: number; transactionCount: number; cashTotal: number; cardTotal: number } | null) => void;
  setTodaySales: (v: TodaySale[]) => void;
  setCustomers: (v: Customer[]) => void;
  setWorkspaceName: (v: string) => void;
  setStoreSettings: (v: StoreSettings | null) => void;
  setTotalProducts?: (v: number) => void;
  setLoadingMore?: (v: boolean) => void;
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
  setTotalProducts,
  setLoadingMore,
}: UsePosDataProps) {
  const loadingMoreRef = useRef(false);

  const fetchProducts = useCallback(async (search?: string, append = false) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", String(PAGE_SIZE));
      if (append) {
        // Need to know current count — caller manages offset via state
      }
      const qs = params.toString();
      const res = await fetch(`/api/dashboard/products${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const list = (data.products ?? []) as Product[];
      if (append) {
        setProducts((prev: Product[]) => [...prev, ...list]);
      } else {
        setProducts(list);
        saveProductsCache(list);
      }
      setTotalProducts?.(data.total ?? 0);
    } catch {
      if (!append) {
        const cached = getProductsCache();
        if (cached && cached.length > 0) {
          setProducts(cached);
        }
      }
    }
  }, [setProducts, setTotalProducts]);

  const searchProducts = useCallback(async (search: string) => {
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/dashboard/products?${params.toString()}`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const list = (data.products ?? []) as Product[];
      setProducts(list);
      setTotalProducts?.(data.total ?? 0);
    } catch {
      const cached = getProductsCache();
      if (cached && cached.length > 0) {
        setProducts(cached);
      }
    }
  }, [setProducts, setTotalProducts]);

  const loadMoreProducts = useCallback(async (search: string, currentCount: number) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore?.(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(currentCount),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/dashboard/products?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.products ?? []) as Product[];
      if (list.length > 0) {
        setProducts((prev: Product[]) => [...prev, ...list]);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore?.(false);
    }
  }, [setProducts, setLoadingMore]);

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
    searchProducts,
    loadMoreProducts,
    fetchRegister,
    fetchDailySummary,
    fetchCustomers,
    fetchWorkspaceName,
    fetchStoreSettings,
    fetchAll,
  };
}
