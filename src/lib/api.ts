import type {
  Category,
  InventoryItem,
  Notification,
  ReorderRequest,
  StockTransaction,
  Supplier,
  Transfer,
  User,
  Warehouse,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const AUTH_STORAGE_KEY = "warehouseiq.auth";

type ApiRecord = Record<string, unknown>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = "";
  try {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? window.localStorage.getItem(AUTH_STORAGE_KEY);
    token = stored ? String(JSON.parse(stored).token ?? "") : "";
  } catch {
    token = "";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = Object.values(body?.errors ?? {}).flat().join(" ").trim();
    const message =
      body?.message ||
      body?.error ||
      validationMessage ||
      `Request failed with status ${response.status}`;
    throw new ApiError(String(message), response.status, body);
  }

  return body as T;
}

function dateOnly(value: unknown): string {
  return typeof value === "string" && value ? value.slice(0, 10) : "";
}

function itemStatus(item: {
  quantity: number;
  reorderPoint: number;
  maxStock: number;
  expirationDate: string | null;
}): InventoryItem["status"] {
  if (item.quantity === 0) return "out-of-stock";
  if (item.expirationDate && new Date(item.expirationDate) <= new Date()) return "expired";
  if (item.quantity <= item.reorderPoint) return "low-stock";
  if (item.maxStock > 0 && item.quantity > item.maxStock) return "overstock";
  return "in-stock";
}

export function normalizeWarehouse(raw: ApiRecord): Warehouse {
  const capacity = Number(raw.capacity ?? 0);
  const used = Number(raw.capacityUsed ?? raw.used ?? 0);
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    location: String(raw.location ?? ""),
    address: String(raw.address ?? raw.location ?? ""),
    capacity,
    used,
    manager: String(raw.manager ?? ""),
    zones: Array.isArray(raw.zones) ? (raw.zones as Warehouse["zones"]) : [],
    createdAt: dateOnly(raw.created_at ?? raw.createdAt),
  };
}

export function normalizeItem(raw: ApiRecord, categories: Category[]): InventoryItem {
  const categoryName = String(raw.category ?? "");
  const category =
    categories.find((entry) => entry.name.toLowerCase() === categoryName.toLowerCase()) ??
    categories.find((entry) => entry.id === categoryName);
  const quantity = Number(raw.quantity ?? 0);
  const reorderPoint = Number(raw.reorderPoint ?? 0);
  const maxStock = Number(raw.maxStock ?? Math.max(reorderPoint * 5, quantity, 1));
  const expirationDate = raw.expiryDate ? dateOnly(raw.expiryDate) : null;
  const item = {
    id: String(raw.id ?? ""),
    sku: String(raw.sku ?? ""),
    name: String(raw.name ?? ""),
    categoryId: category?.id ?? categoryName,
    warehouseId: raw.warehouseId == null ? null : String(raw.warehouseId),
    zoneId: raw.zone == null ? null : String(raw.zone),
    quantity,
    reorderPoint,
    maxStock,
    expirationDate,
    unitCost: Number(raw.unitPrice ?? 0),
    supplierId: raw.supplierId == null ? null : String(raw.supplierId),
    status: "in-stock" as InventoryItem["status"],
    description: String(raw.description ?? ""),
    unit: String(raw.unit ?? "pcs"),
    createdAt: dateOnly(raw.created_at ?? raw.createdAt),
    updatedAt: dateOnly(raw.updated_at ?? raw.updatedAt),
  };
  return { ...item, status: itemStatus(item) };
}

export function normalizeTransaction(raw: ApiRecord): StockTransaction {
  const type = String(raw.transactionType ?? raw.type) === "stock_out" ? "stock-out" : "stock-in";
  return {
    id: String(raw.id ?? ""),
    itemId: String(raw.itemId ?? ""),
    type,
    quantity: Number(raw.quantity ?? 0),
    date: dateOnly(raw.createdAt ?? raw.date),
    supplierId: raw.supplierId ? String(raw.supplierId) : undefined,
    purpose: raw.purpose ? String(raw.purpose) : undefined,
    referenceNumber: String(raw.referenceNumber ?? ""),
    notes: String(raw.notes ?? ""),
    processedBy: String(raw.processedBy ?? "System"),
    unitCost: Number(raw.unitCost ?? (raw.item ? (raw.item as ApiRecord).unitPrice : 0) ?? 0),
    expirationDate: raw.expirationDate ? dateOnly(raw.expirationDate) : undefined,
  };
}

export function normalizeTransfer(raw: ApiRecord): Transfer {
  const statusMap: Record<string, Transfer["status"]> = {
    pending: "pending",
    in_transit: "in-transit",
    "in-transit": "in-transit",
    completed: "completed",
    cancelled: "cancelled",
  };
  return {
    id: String(raw.id ?? ""),
    itemId: String(raw.itemId ?? ""),
    fromWarehouseId: String(raw.sourceWarehouse ?? raw.fromWarehouseId ?? ""),
    toWarehouseId: String(raw.destinationWarehouse ?? raw.toWarehouseId ?? ""),
    fromZoneId: raw.fromZone ? String(raw.fromZone) : undefined,
    toZoneId: raw.toZone ? String(raw.toZone) : undefined,
    quantity: Number(raw.quantity ?? 0),
    status: statusMap[String(raw.status ?? "pending")] ?? "pending",
    requestedBy: String(raw.requestedBy ?? "System"),
    approvedBy: raw.approvedBy ? String(raw.approvedBy) : undefined,
    date: dateOnly(raw.createdAt ?? raw.date),
    completedAt: raw.completedAt ? dateOnly(raw.completedAt) : undefined,
    notes: String(raw.notes ?? ""),
  };
}

function normalizeCategory(raw: ApiRecord): Category {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    color: String(raw.color ?? "#3B82F6"),
  };
}

function normalizeSupplier(raw: ApiRecord): Supplier {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    contact: String(raw.contact ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
  };
}

function normalizeUser(raw: ApiRecord): User {
  const name = String(raw.name ?? "");
  return {
    id: String(raw.id ?? ""),
    name,
    email: String(raw.email ?? ""),
    role: (raw.role ?? "staff") as User["role"],
    avatar: String(raw.avatar ?? name.split(" ").map((part) => part[0]).join("").slice(0, 2)),
    department: String(raw.department ?? ""),
    lastLogin: raw.last_login ? String(raw.last_login).replace("T", " ").slice(0, 16) : "Never",
    active: Boolean(raw.active ?? true),
    createdAt: dateOnly(raw.created_at),
  };
}

function normalizeReorder(raw: ApiRecord): ReorderRequest {
  return {
    id: String(raw.id ?? ""),
    itemId: String(raw.itemId ?? ""),
    supplierId: raw.supplierId == null ? "" : String(raw.supplierId),
    quantity: Number(raw.quantity ?? 0),
    status: (raw.status ?? "pending") as ReorderRequest["status"],
    createdAt: dateOnly(raw.created_at ?? raw.createdAt),
    estimatedDelivery: raw.estimatedDelivery ? dateOnly(raw.estimatedDelivery) : undefined,
    notes: String(raw.notes ?? ""),
  };
}

function normalizeNotification(raw: ApiRecord): Notification {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    message: String(raw.message ?? ""),
    type: (raw.type ?? "info") as Notification["type"],
    read: Boolean(raw.read),
    createdAt: String(raw.created_at ?? raw.createdAt ?? "").replace("T", " ").slice(0, 16),
  };
}

function categoryName(item: InventoryItem, categories: Category[]): string {
  return categories.find((entry) => entry.id === item.categoryId)?.name ?? item.categoryId;
}

function itemPayload(item: InventoryItem, categories: Category[]) {
  return {
    sku: item.sku,
    name: item.name,
    description: item.description,
    category: categoryName(item, categories),
    unit: item.unit,
    quantity: item.quantity,
    reorderPoint: item.reorderPoint,
    maxStock: item.maxStock,
    supplierId: item.supplierId,
    unitPrice: item.unitCost,
    expiryDate: item.expirationDate,
  };
}

export const api = {
  operational: {
    async load() {
      const [categoryRows, supplierRows] = await Promise.all([
        request<ApiRecord[]>("/categories"),
        request<ApiRecord[]>("/suppliers"),
      ]);
      const categories = categoryRows.map(normalizeCategory);
      const hasAuthenticatedSession = Boolean(
        window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? window.localStorage.getItem(AUTH_STORAGE_KEY),
      );
      const [warehouseRows, itemRows, transactionRows, transferRows, userRows, reorderRows, notificationRows, settings, acknowledgedAlertIds] = await Promise.all([
        request<ApiRecord[]>("/warehouses"),
        request<ApiRecord[]>("/inventory"),
        request<ApiRecord[]>("/transactions"),
        request<ApiRecord[]>("/transfers"),
        hasAuthenticatedSession ? request<ApiRecord[]>("/users") : Promise.resolve([]),
        request<ApiRecord[]>("/reorders"),
        request<ApiRecord[]>("/notifications"),
        request<Record<string, Record<string, unknown>>>("/settings"),
        request<string[]>("/alert-acknowledgements"),
      ]);
      return {
        categories,
        suppliers: supplierRows.map(normalizeSupplier),
        warehouses: warehouseRows.map(normalizeWarehouse),
        items: itemRows.map((row) => normalizeItem(row, categories)),
        transactions: transactionRows.map(normalizeTransaction),
        transfers: transferRows.map(normalizeTransfer),
        users: userRows.map(normalizeUser),
        reorderRequests: reorderRows.map(normalizeReorder),
        notifications: notificationRows.map(normalizeNotification),
        settings,
        acknowledgedAlertIds,
      };
    },
  },
  auth: {
    login: (email: string, password: string) =>
      request<{ user: ApiRecord; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }).then((result) => ({ user: normalizeUser(result.user), token: result.token })),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
    forgotPassword: (email: string) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },
  users: {
    create: (user: User, password: string) =>
      request<ApiRecord>("/users", {
        method: "POST",
        body: JSON.stringify({ ...user, password }),
      }).then(normalizeUser),
    update: (user: User) =>
      request<ApiRecord>(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(user),
      }).then(normalizeUser),
    delete: (id: string) => request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" }),
  },
  reorders: {
    create: (reorder: ReorderRequest) =>
      request<ApiRecord>("/reorders", {
        method: "POST",
        body: JSON.stringify({
          ...reorder,
          itemId: Number(reorder.itemId),
          supplierId: reorder.supplierId ? Number(reorder.supplierId) : null,
        }),
      }).then(normalizeReorder),
    update: (reorder: ReorderRequest) =>
      request<ApiRecord>(`/reorders/${reorder.id}`, {
        method: "PUT",
        body: JSON.stringify(reorder),
      }).then(normalizeReorder),
  },
  notifications: {
    markRead: (id: string) =>
      request<ApiRecord>(`/notifications/${id}/read`, { method: "PATCH" }).then(normalizeNotification),
    markAllRead: () => request<{ ok: boolean }>("/notifications/read-all", { method: "PATCH" }),
  },
  alerts: {
    acknowledge: (alertId: string, userId?: string) =>
      request<{ ok: boolean }>("/alert-acknowledgements", {
        method: "POST",
        body: JSON.stringify({
          alertId,
          userId: userId && /^\d+$/.test(userId) ? Number(userId) : null,
        }),
      }),
  },
  settings: {
    update: (section: string, payload: Record<string, unknown>) =>
      request<ApiRecord>(`/settings/${section}`, {
        method: "PUT",
        body: JSON.stringify({ payload }),
      }),
  },
  system: {
    export: () => request<Record<string, unknown>>("/system/export"),
    reset: () =>
      request<{ ok: boolean }>("/system/reset", {
        method: "POST",
        body: JSON.stringify({ confirmation: "RESET" }),
      }),
  },
  inventory: {
    create: (item: InventoryItem, categories: Category[]) =>
      request<ApiRecord>("/inventory", {
        method: "POST",
        body: JSON.stringify(itemPayload(item, categories)),
      }),
    update: (item: InventoryItem, categories: Category[]) =>
      request<ApiRecord>(`/inventory/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(itemPayload(item, categories)),
      }),
    delete: (id: string) => request<{ ok: boolean }>(`/inventory/${id}`, { method: "DELETE" }),
    assign: (itemId: string, warehouseId: string, zoneId: string | null) =>
      request<ApiRecord>(`/inventory/${itemId}/assign`, {
        method: "POST",
        body: JSON.stringify({ warehouseId: Number(warehouseId), zone: zoneId }),
      }),
  },
  warehouses: {
    create: (warehouse: Warehouse) =>
      request<ApiRecord>("/warehouses", {
        method: "POST",
        body: JSON.stringify(warehouse),
      }),
    update: (warehouse: Warehouse) =>
      request<ApiRecord>(`/warehouses/${warehouse.id}`, {
        method: "PUT",
        body: JSON.stringify(warehouse),
      }),
    delete: (id: string) => request<{ ok: boolean }>(`/warehouses/${id}`, { method: "DELETE" }),
  },
  transactions: {
    create: (transaction: StockTransaction, warehouseId: string) =>
      request<ApiRecord>("/transactions", {
        method: "POST",
        body: JSON.stringify({
          itemId: Number(transaction.itemId),
          warehouseId: Number(warehouseId),
          transactionType: transaction.type === "stock-in" ? "stock_in" : "stock_out",
          quantity: transaction.quantity,
          expirationDate: transaction.expirationDate,
          supplierId: transaction.supplierId,
          purpose: transaction.purpose,
          referenceNumber: transaction.referenceNumber,
          processedBy: transaction.processedBy,
          unitCost: transaction.unitCost,
          notes: transaction.notes,
        }),
      }),
  },
  transfers: {
    create: (transfer: Transfer) =>
      request<ApiRecord>("/transfers", {
        method: "POST",
        body: JSON.stringify({
          sourceWarehouse: Number(transfer.fromWarehouseId),
          destinationWarehouse: Number(transfer.toWarehouseId),
          itemId: Number(transfer.itemId),
          quantity: transfer.quantity,
          status: "pending",
          requestedBy: transfer.requestedBy,
          notes: transfer.notes,
          fromZone: transfer.fromZoneId,
          toZone: transfer.toZoneId,
        }),
      }),
    update: (transfer: Transfer) =>
      request<ApiRecord>(`/transfers/${transfer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: transfer.status === "in-transit" ? "in_transit" : transfer.status,
          approvedBy: transfer.approvedBy,
          notes: transfer.notes,
        }),
      }),
  },
};
