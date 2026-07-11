import { localStorageAPI } from "./local-storage-api";

const BASE = `http://localhost:8000/api`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

function normalizeInventoryItem(item: Partial<InventoryItem> & Record<string, any>): InventoryItem {
  const quantity = Number(item.quantity ?? item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.cost ?? 0);
  const description = item.description ?? item.notes ?? "";
  const status = item.status ?? (quantity === 0 ? "out_of_stock" : quantity < Number(item.reorderPoint ?? 0) ? "low_stock" : "in_stock");

  return {
    ...item,
    id: String(item.id ?? ""),
    sku: item.sku ?? "",
    name: item.name ?? "",
    description,
    category: item.category ?? "",
    quantity,
    reorderPoint: Number(item.reorderPoint ?? 0),
    warehouseId: String(item.warehouseId ?? ""),
    unitPrice,
    lastRestocked: item.lastRestocked ?? "",
    status,
    qty: quantity,
    cost: unitPrice,
    unit: item.unit ?? "pcs",
    notes: description,
    createdAt: item.createdAt ?? item.lastRestocked ?? new Date().toISOString(),
    warehouseName: item.warehouseName ?? "",
  } as InventoryItem;
}

function toInventoryPayload(data: Partial<InventoryItem>): Partial<InventoryItem> {
  return {
    sku: data.sku,
    name: data.name,
    description: data.description ?? data.notes ?? "",
    category: data.category,
    quantity: Number(data.quantity ?? data.qty ?? 0),
    reorderPoint: Number(data.reorderPoint ?? 0),
    warehouseId: Number(data.warehouseId ?? 0),
    unitPrice: Number(data.unitPrice ?? data.cost ?? 0),
  };
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
      () => request<InventoryItem[]>("/inventory").then(items => items.map(normalizeInventoryItem)),
      () => localStorageAPI.inventory.list().then(items => items.map(normalizeInventoryItem))
    ),
    create: (data: Partial<InventoryItem>) => apiCall(
      () => request<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(toInventoryPayload(data)) }).then(normalizeInventoryItem),
      () => localStorageAPI.inventory.create(data)
    ),
    update: (id: string, data: Partial<InventoryItem>) => apiCall(
      () => request<InventoryItem>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(toInventoryPayload(data)) }).then(normalizeInventoryItem),
      () => localStorageAPI.inventory.update(id, data)
    ),
    delete: (id: string) => apiCall(
      () => request<{ ok: boolean }>(`/inventory/${id}`, { method: "DELETE" }),
      () => localStorageAPI.inventory.delete(id)
    ),
    adjust: (id: string, delta: number) => apiCall(
      () => request<InventoryItem>(`/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta }) }).then(normalizeInventoryItem),
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
  qty?: number;
  cost?: number;
  unit?: string;
  notes?: string;
  createdAt?: string;
  warehouseName?: string;
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
