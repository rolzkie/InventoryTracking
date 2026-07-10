import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { localStorageAPI } from "./local-storage-api";

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-3c7e7389`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Edge Function in this repo does not require auth; keeping this off avoids 401/403.
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// Wrapper that tries remote API first, falls back to localStorage
async function apiCall<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.log("Remote API failed, using local storage:", (e as any).message);
    return await fallback();
  }
}

export const api = {
  dashboard: () => apiCall(
    () => request<DashboardStats>("/dashboard"),
    () => localStorageAPI.dashboard()
  ),

  // Warehouses
  warehouses: {
    list: () => apiCall(
      () => request<Warehouse[]>("/warehouses"),
      () => localStorageAPI.warehouses.list()
    ),
    create: (data: Partial<Warehouse>) => apiCall(
      () => request<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(data) }),
      () => localStorageAPI.warehouses.create(data)
    ),
    update: (id: string, data: Partial<Warehouse>) => apiCall(
      () => request<Warehouse>(`/warehouses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      () => localStorageAPI.warehouses.update(id, data)
    ),
    delete: (id: string) => apiCall(
      () => request<{ ok: boolean }>(`/warehouses/${id}`, { method: "DELETE" }),
      () => localStorageAPI.warehouses.delete(id)
    ),
  },

  // Inventory
  inventory: {
    list: () => apiCall(
      () => request<InventoryItem[]>("/inventory"),
      () => localStorageAPI.inventory.list()
    ),
    create: (data: Partial<InventoryItem>) => apiCall(
      () => request<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) }),
      () => localStorageAPI.inventory.create(data)
    ),
    update: (id: string, data: Partial<InventoryItem>) => apiCall(
      () => request<InventoryItem>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      () => localStorageAPI.inventory.update(id, data)
    ),
    delete: (id: string) => apiCall(
      () => request<{ ok: boolean }>(`/inventory/${id}`, { method: "DELETE" }),
      () => localStorageAPI.inventory.delete(id)
    ),
    adjust: (id: string, delta: number) => apiCall(
      () => request<InventoryItem>(`/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta }) }),
      () => localStorageAPI.inventory.adjust(id, delta)
    ),
  },

  // Transfers
  transfers: {
    list: () => apiCall(
      () => request<Transfer[]>("/transfers"),
      () => localStorageAPI.transfers.list()
    ),
    create: (data: Partial<Transfer>) => apiCall(
      () => request<Transfer>("/transfers", { method: "POST", body: JSON.stringify(data) }),
      () => localStorageAPI.transfers.create(data)
    ),
    update: (id: string, data: Partial<Transfer>) => apiCall(
      () => request<Transfer>(`/transfers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      () => localStorageAPI.transfers.update(id, data)
    ),
    delete: (id: string) => apiCall(
      () => request<{ ok: boolean }>(`/transfers/${id}`, { method: "DELETE" }),
      () => localStorageAPI.transfers.delete(id)
    ),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  used: number;
  manager: string;
  status: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  warehouseId: string;
  unitPrice: number;
  lastRestocked: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface Transfer {
  id: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  itemId: string;
  itemName: string;
  quantity: number;
  status: "completed" | "in_transit" | "pending";
  createdAt: string;
  completedAt?: string;
  notes: string;
}

export interface DashboardStats {
  totalSkus: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  warehouseCount: number;
  todayTransfers: number;
  alerts: (InventoryItem & { alertType: string })[];
}

export const CATEGORIES = ["Electronics", "Hardware", "Chemicals", "Packaging", "Raw Materials", "Tools", "Office Supplies", "Safety Equipment"];
export const UNITS = ["pcs", "units", "kg", "liters", "meters", "rolls", "sheets", "boxes", "rods", "pairs"];
