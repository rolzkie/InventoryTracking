export type ItemStatus = "in-stock" | "low-stock" | "out-of-stock" | "expired" | "overstock";
export type TransactionType = "stock-in" | "stock-out";
export type TransferStatus = "pending" | "in-transit" | "completed" | "cancelled";
export type AlertType = "low-stock" | "out-of-stock" | "expiring" | "overstock";
export type UserRole = "admin" | "manager" | "staff" | "viewer";
export type UserPermission = "manage" | "view";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
}

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  name: string;
  type: "storage" | "receiving" | "shipping" | "cold" | "hazmat";
  capacity: number;
  used: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  address: string;
  capacity: number;
  used: number;
  manager: string;
  zones: WarehouseZone[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  warehouseId: string | null;
  zoneId: string | null;
  quantity: number;
  reorderPoint: number;
  maxStock: number;
  expirationDate: string | null;
  unitCost: number;
  supplierId: string | null;
  status: ItemStatus;
  description: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  type: TransactionType;
  quantity: number;
  date: string;
  supplierId?: string;
  purpose?: string;
  referenceNumber: string;
  notes: string;
  processedBy: string;
  unitCost: number;
  expirationDate?: string;
}

export interface Transfer {
  id: string;
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromZoneId?: string;
  toZoneId?: string;
  quantity: number;
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string;
  date: string;
  completedAt?: string;
  notes: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  itemId: string;
  message: string;
  severity: "critical" | "warning" | "info";
  createdAt: string;
  acknowledged: boolean;
}

export interface ReorderRequest {
  id: string;
  itemId: string;
  supplierId: string;
  quantity: number;
  status: "pending" | "approved" | "ordered" | "received";
  createdAt: string;
  estimatedDelivery?: string;
  notes: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permission: UserPermission;
  avatar: string;
  department: string;
  lastLogin: string;
  active: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
}

export type Page =
  | "dashboard"
  | "inventory"
  | "warehouses"
  | "transfers"
  | "stock-transactions"
  | "reports"
  | "users"
  | "settings";
