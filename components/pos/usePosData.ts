"use client";

import { useCallback } from "react";
import { type Product, type CashRegister, type Customer, type TodaySale } from "./types";

interface UsePosDataProps {
  setProducts: (v: Product[]) => void;
  setRegister: (v: CashRegister | null) => void;
  setLoadingRegister: (v: boolean) => void;
  setDailySummary: (v: { totalRevenue: number; transactionCount: number; cashTotal: number; cardTotal: number } | null) => void;
  setTodaySales: (v: TodaySale[]) => void;
  setCustomers: (v: Customer[]) => void;
  setWorkspaceName: (v: string) => void;
}

export function usePosData({
  setProducts,
  setRegister,
  setLoadingRegister,
  setDailySummary,
  setTodaySales,
  setCustomers,
  setWorkspaceName,
}: UsePosDataProps) {
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch { /* ignore */ }
  }, [setProducts]);

  const fetchRegister = useCallback(async () => {
    try {
      setLoadingRegister(true);
      const res = await fetch("/api/dashboard/pos/session");
      const data = await res.json();
      setRegister(data.register);
    } catch { /* ignore */ }
    finally { setLoadingRegister(false); }
  }, [setRegister, setLoadingRegister]);

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

  const fetchAll = useCallback(() => {
    fetchProducts();
    fetchRegister();
    fetchDailySummary();
    fetchCustomers();
    fetchWorkspaceName();
  }, [fetchProducts, fetchRegister, fetchDailySummary, fetchCustomers, fetchWorkspaceName]);

  return {
    fetchProducts,
    fetchRegister,
    fetchDailySummary,
    fetchCustomers,
    fetchWorkspaceName,
    fetchAll,
  };
}
