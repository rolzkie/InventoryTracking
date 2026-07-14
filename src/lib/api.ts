import { localStorageAPI } from "./local-storage-api";

function getApiBase(): string {
  const configured = (import.meta as any).env?.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");


  return "/api";
}

const BASE = getApiBase();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = data?.error ?? data?.message ?? res.statusText ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
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

function isNumericResourceId(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  return /^\d+$/.test(String(value ?? "").trim());
}

function normalizeInventoryItem(item: Partial<InventoryItem> & Record<string, any>): InventoryItem {
  const quantity = Number(item.quantity ?? item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.cost ?? 0);
  const description = item.description ?? item.notes ?? "";

  // Prefer server-provided status; fallback for local/dev.
  const status =
    item.status ??
    (!item.warehouseId ? "unassigned" : quantity === 0 ? "out_of_stock" : quantity < Number(item.reorderPoint ?? 0) ? "low_stock" : "in_stock");

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
    storageLocation: item.storageLocation ?? "",
    zone: item.zone ?? "",
    rack: item.rack ?? "",
    shelf: item.shelf ?? "",
    assignedAt: item.assignedAt ?? "",
    unitPrice,
    lastRestocked: item.lastRestocked ?? "",
    expiryDate: item.expiryDate,

    status,
    qty: quantity,
    cost: unitPrice,
    unit: item.unit ?? "pcs",
    notes: description,
    createdAt: item.createdAt ?? item.lastRestocked ?? new Date().toISOString(),
    warehouseName: item.warehouseName ?? "",
  } as InventoryItem;
}


function normalizeWarehouse(warehouse: Partial<Warehouse> & Record<string, any>): Warehouse {
  const capacity = Number(warehouse.capacity ?? 0);
  const used = Number(warehouse.capacityUsed ?? warehouse.used ?? warehouse.usedQty ?? 0);
  const status = warehouse.status ?? (capacity > 0 && used >= capacity ? "near_full" : "active");

  return {
    ...warehouse,
    id: String(warehouse.id ?? ""),
    name: warehouse.name ?? "",
    location: warehouse.location ?? "",
    capacity,
    used,
    manager: warehouse.manager ?? "",
    status,
    createdAt: warehouse.createdAt ?? "",
  } as Warehouse;
}

function normalizeTransfer(transfer: Partial<Transfer> & Record<string, any>): Transfer {
  const quantity = Number(transfer.quantity ?? transfer.qty ?? 0);

  return {
    ...transfer,
    id: String(transfer.id ?? ""),
    sourceWarehouse: String(transfer.sourceWarehouse ?? transfer.fromWarehouseId ?? ""),
    destinationWarehouse: String(transfer.destinationWarehouse ?? transfer.toWarehouseId ?? ""),
    fromWarehouseId: String(transfer.fromWarehouseId ?? transfer.sourceWarehouse ?? ""),
    toWarehouseId: String(transfer.toWarehouseId ?? transfer.destinationWarehouse ?? ""),
    itemId: String(transfer.itemId ?? ""),
    itemName: transfer.itemName ?? transfer.name ?? "",
    quantity,
    qty: quantity,
    status: transfer.status ?? "pending",
    createdAt: transfer.createdAt ?? transfer.date ?? "",
    date: transfer.date ?? transfer.createdAt ?? "",
    notes: transfer.notes ?? "",
    initiator: transfer.initiator ?? "Sarah Chen",
    fromZone: transfer.fromZone ?? "",
    fromRack: transfer.fromRack ?? "",
    fromShelf: transfer.fromShelf ?? "",
    toZone: transfer.toZone ?? "",
    toRack: transfer.toRack ?? "",
    toShelf: transfer.toShelf ?? "",
  } as Transfer;
}

function toInventoryPayload(data: Partial<InventoryItem>): Partial<InventoryItem> {
  const reorderPoint = Number(data.reorderPoint ?? 0);
  const unitPrice = Number(data.unitPrice ?? data.cost ?? 0);

  return {
    sku: data.sku,
    name: data.name,
    description: data.description ?? data.notes ?? "",
    category: data.category,
    unit: data.unit,
    reorderPoint: Number.isFinite(reorderPoint) ? reorderPoint : 0,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
  };
}

function toTransferPayload(data: Partial<Transfer>): Partial<Transfer> {
  const quantity = Number(data.quantity ?? data.qty ?? 0);

  return {
    sourceWarehouse: data.sourceWarehouse ?? data.fromWarehouseId ?? "",
    destinationWarehouse: data.destinationWarehouse ?? data.toWarehouseId ?? "",
    fromWarehouseId: data.fromWarehouseId ?? data.sourceWarehouse ?? "",
    toWarehouseId: data.toWarehouseId ?? data.destinationWarehouse ?? "",
    itemId: data.itemId ?? "",
    quantity: Number.isFinite(quantity) ? quantity : 0,
    qty: Number.isFinite(quantity) ? quantity : 0,
    status: data.status ?? "pending",
    notes: data.notes ?? "",
    initiator: data.initiator ?? "Sarah Chen",
    fromZone: data.fromZone ?? "",
    fromRack: data.fromRack ?? "",
    fromShelf: data.fromShelf ?? "",
    toZone: data.toZone ?? "",
    toRack: data.toRack ?? "",
    toShelf: data.toShelf ?? "",
    createdAt: data.createdAt ?? data.date ?? new Date().toISOString(),
    date: data.date ?? data.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

export const api = {
  dashboard: () => apiCall(
    () => request<DashboardStats>("/dashboard"),
    () => localStorageAPI.dashboard()
  ),

  reports: {
    summary: () => apiCall(
      () => request<ReportSummary>("/reports/summary"),
      () => localStorageAPI.reports.summary()
    ),
    lowStock: () => apiCall(
      () => request<LowStockSummaryItem[]>("/reports/low-stock"),
      () => localStorageAPI.reports.lowStock()
    ),
  },

  // Warehouses
  warehouses: {
    list: () => apiCall(
      () => request<Warehouse[]>('/warehouses').then(items => items.map(normalizeWarehouse)),
      () => localStorageAPI.warehouses.list().then(items => items.map(normalizeWarehouse))
    ),
    create: (data: Partial<Warehouse>) => apiCall(
      () => request<Warehouse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }).then(normalizeWarehouse),
      () => localStorageAPI.warehouses.create(data).then(normalizeWarehouse)
    ),
    update: (id: string, data: Partial<Warehouse>) => apiCall(
      () => request<Warehouse>(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(normalizeWarehouse),
      () => localStorageAPI.warehouses.update(id, data).then(normalizeWarehouse)
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
    update: (id: string, data: Partial<InventoryItem>) => {
      if (!isNumericResourceId(id)) {
        return localStorageAPI.inventory.update(id, data);
      }

      return apiCall(
        () => request<InventoryItem>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(toInventoryPayload(data)) }).then(normalizeInventoryItem),
        () => localStorageAPI.inventory.update(id, data)
      );
    },
    delete: (id: string) => {
      if (!isNumericResourceId(id)) {
        return localStorageAPI.inventory.delete(id);
      }

      return apiCall(
        () => request<{ ok: boolean }>(`/inventory/${id}`, { method: "DELETE" }),
        () => localStorageAPI.inventory.delete(id)
      );
    },
    assign: (id: string, data: { warehouseId: string; storageLocation?: string; zone?: string; rack?: string; shelf?: string }) => {
      if (!isNumericResourceId(id)) {
        return localStorageAPI.inventory.update(id, data as Partial<InventoryItem>);
      }

      return apiCall(
        () => request<InventoryItem>(`/inventory/${id}/assign`, { method: "POST", body: JSON.stringify({ warehouseId: Number(data.warehouseId), storageLocation: data.storageLocation ?? null, zone: data.zone ?? null, rack: data.rack ?? null, shelf: data.shelf ?? null }) }).then(normalizeInventoryItem),
        () => localStorageAPI.inventory.update(id, data as Partial<InventoryItem>)
      );
    },
    adjust: (id: string, delta: number) => {
      if (!isNumericResourceId(id)) {
        return localStorageAPI.inventory.adjust(id, delta);
      }

      return apiCall(
        () => request<InventoryItem>(`/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta }) }).then(normalizeInventoryItem),
        () => localStorageAPI.inventory.adjust(id, delta)
      );
    },
  },

  // Transfers
  transfers: {
    list: () => apiCall(
      () => request<Transfer[]>('/transfers').then(items => items.map(normalizeTransfer)),
      () => localStorageAPI.transfers.list().then(items => items.map(normalizeTransfer))
    ),
    create: (data: Partial<Transfer>) => apiCall(
      () => request<Transfer>('/transfers', { method: 'POST', body: JSON.stringify(toTransferPayload(data)) }).then(normalizeTransfer),
      () => localStorageAPI.transfers.create(data).then(normalizeTransfer)
    ),
    update: (id: string, data: Partial<Transfer>) => apiCall(
      () => request<Transfer>(`/transfers/${id}`, { method: 'PUT', body: JSON.stringify(toTransferPayload(data)) }).then(normalizeTransfer),
      () => localStorageAPI.transfers.update(id, data).then(normalizeTransfer)
    ),
    delete: (id: string) => apiCall(
      () => request<{ ok: boolean }>(`/transfers/${id}`, { method: "DELETE" }),
      () => localStorageAPI.transfers.delete(id)
    ),
  },

  transactions: {
    list: () => apiCall(
      () => request<StockTransaction[]>('/transactions').then((items) => items.map((item) => ({
        ...item,
        itemName: (item as any).itemName ?? (item as any).item?.name ?? "",
        warehouseName: (item as any).warehouseName ?? (item as any).warehouse?.name ?? "",
      })) ),

      () => localStorageAPI.transactions.list()
    ),
    create: (data: Partial<StockTransaction>) => apiCall(
      () => request<StockTransaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }).then((item) => ({
        ...item,
        itemName: (item as any).itemName ?? (item as any).item?.name ?? "",
        warehouseName: (item as any).warehouseName ?? (item as any).warehouse?.name ?? "",
      })),
      () => localStorageAPI.transactions.create(data)
    ),
    update: (id: string, data: Partial<StockTransaction>) => apiCall(
      () => request<StockTransaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((item) => ({
        ...item,
        itemName: (item as any).itemName ?? (item as any).item?.name ?? "",
        warehouseName: (item as any).warehouseName ?? (item as any).warehouse?.name ?? "",
      })),
      () => localStorageAPI.transactions.update(id, data)
    ),

    delete: (id: string) => apiCall(
      () => request<{ ok: boolean }>(`/transactions/${id}`, { method: 'DELETE' }),
      () => localStorageAPI.transactions.delete(id)
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
  storageLocation: string;
  zone: string;
  rack: string;
  shelf: string;
  assignedAt: string;
  unitPrice: number;
  lastRestocked: string;
  expiryDate?: string;
  status: "unassigned" | "in_stock" | "low_stock" | "out_of_stock" | "Expiring" | string;
  qty: number;
  cost: number;
  unit: string;
  notes: string;
  createdAt: string;
  warehouseName: string;
}


export interface Transfer {
  id: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  qty: number;
  status: "completed" | "in_transit" | "pending" | "cancelled";
  createdAt: string;
  date: string;
  completedAt?: string;
  notes: string;
  initiator: string;
  fromZone: string;
  fromRack: string;
  fromShelf: string;
  toZone: string;
  toRack: string;
  toShelf: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  warehouseId: string;
  transactionType: "stock_in" | "stock_out";
  quantity: number;
  expirationDate?: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  itemName: string;
  warehouseName: string;
}

export interface ReportSummary {
  warehouseCount: number;
  inventoryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  transferCount: number;
  unassignedCount: number;
  totalValue: number;
  alerts: Array<{ id: string; sku: string; name: string; quantity: number; reorderPoint: number; status: string; warehouseName: string }>;
  generatedAt: string;
}

export interface LowStockSummaryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  warehouseName: string;
  status?: string;
}

export interface DashboardStats {
  totalSkus: number;
  unassigned: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  warehouseCount: number;
  todayTransfers: number;
  alerts: (InventoryItem & { alertType: string })[];
}

export const CATEGORIES = ["Electronics", "Hardware", "Chemicals", "Packaging", "Raw Materials", "Tools", "Office Supplies", "Safety Equipment"];
export const UNITS = ["pcs", "units", "kg", "liters", "meters", "rolls", "sheets", "boxes", "rods", "pairs"];
