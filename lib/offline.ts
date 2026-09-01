import { type CartItem } from "@/components/pos/types";

export type PendingSale = {
  localId: string;
  createdAt: string;
  cart: CartItem[];
  paymentMethod: string;
  discountAmount: number;
  cashRegisterId: string | null;
  customerId: string | null;
};

export type ProductCache = {
  savedAt: string;
  products: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    currentStock: number;
    category: string | null;
    isActive: boolean;
  }[];
};

const QUEUE_KEY = "ztocky_pos_pending_sales";
const PRODUCTS_CACHE_KEY = "ztocky_pos_products_cache";
const SYNC_LOCK_KEY = "ztocky_pos_sync_lock";

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `${Date.now()}-${localIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function readQueue(): PendingSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingSale[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingSale[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // storage lleno o no disponible
  }
}

export function enqueueSale(sale: Omit<PendingSale, "localId" | "createdAt">): PendingSale {
  const pending: PendingSale = { ...sale, localId: nextLocalId(), createdAt: new Date().toISOString() };
  const queue = readQueue();
  queue.push(pending);
  writeQueue(queue);
  return pending;
}

export function getPendingSales(): PendingSale[] {
  return readQueue();
}

export function removePendingSale(localId: string) {
  writeQueue(readQueue().filter((s) => s.localId !== localId));
}

export function clearPendingSales() {
  writeQueue([]);
}

export function saveProductsCache(products: { id: string; name: string; sku: string; sellingPrice: number; currentStock: number; category: string | null; isActive: boolean }[]) {
  if (typeof window === "undefined") return;
  try {
    const data: ProductCache = { savedAt: new Date().toISOString(), products };
    window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignorar
  }
}

export function getProductsCache(): ProductCache["products"] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRODUCTS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as ProductCache).products : null;
  } catch {
    return null;
  }
}

export function updateCachedStock(productId: string, delta: number) {
  if (typeof window === "undefined") return;
  const cached = getProductsCache();
  if (!cached) return;
  const next = cached.map((p) => (p.id === productId ? { ...p, currentStock: Math.max(0, p.currentStock - delta) } : p));
  try {
    window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), products: next }));
  } catch {
    // ignorar
  }
}

export function acquireSyncLock(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.localStorage.getItem(SYNC_LOCK_KEY)) return false;
    window.localStorage.setItem(SYNC_LOCK_KEY, "1");
    return true;
  } catch {
    return true;
  }
}

export function releaseSyncLock() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SYNC_LOCK_KEY);
  } catch {
    // ignorar
  }
}
