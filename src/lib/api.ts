import { projectId, publicAnonKey } from "../../utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-3c7e7389`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${publicAnonKey}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  seed: () => request<{ ok: boolean }>("/seed", { method: "POST" }),

  dashboard: () => request<DashboardStats>("/dashboard"),

  // Warehouses
  warehouses: {
    list: () => request<Warehouse[]>("/warehouses"),
    create: (data: Partial<Warehouse>) => request<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Warehouse>) => request<Warehouse>(`/warehouses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/warehouses/${id}`, { method: "DELETE" }),
  },

  // Inventory
  inventory: {
    list: () => request<InventoryItem[]>("/inventory"),
    create: (data: Partial<InventoryItem>) => request<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<InventoryItem>) => request<InventoryItem>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/inventory/${id}`, { method: "DELETE" }),
    adjust: (id: string, delta: number) => request<InventoryItem>(`/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta }) }),
  },

  // Transfers
  transfers: {
    list: () => request<Transfer[]>("/transfers"),
    create: (data: Partial<Transfer>) => request<Transfer>("/transfers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Transfer>) => request<Transfer>(`/transfers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/transfers/${id}`, { method: "DELETE" }),
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
  name: string;
  sku: string;
  category: string;
  warehouseId: string;
  warehouseName?: string;
  qty: number;
  reorderPoint: number;
  unit: string;
  cost: number;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Transfer {
  id: string;
  itemId: string;
  itemName: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  qty: number;
  date: string;
  status: string;
  initiator: string;
  notes: string;
  createdAt: string;
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
