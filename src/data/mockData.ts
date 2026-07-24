import type {
  Category,
  Supplier,
  Warehouse,
  InventoryItem,
  StockTransaction,
  Transfer,
  Alert,
  ReorderRequest,
  User,
  Notification,
} from "../types";

export const initialCategories: Category[] = [
  { id: "cat-1", name: "Electronics", color: "#3B82F6" },
  { id: "cat-2", name: "Furniture", color: "#8B5CF6" },
  { id: "cat-3", name: "Medical Supplies", color: "#10B981" },
  { id: "cat-4", name: "Office Supplies", color: "#F59E0B" },
  { id: "cat-5", name: "Food & Beverage", color: "#EF4444" },
  { id: "cat-6", name: "Automotive Parts", color: "#06B6D4" },
];

export const initialSuppliers: Supplier[] = [
  { id: "sup-1", name: "TechCorp Industries", contact: "John Smith", email: "john@techcorp.com", phone: "+1-555-0101" },
  { id: "sup-2", name: "Global Furniture Co.", contact: "Sarah Lee", email: "sarah@globalfurniture.com", phone: "+1-555-0102" },
  { id: "sup-3", name: "MediSupply Inc.", contact: "Dr. Robert Chen", email: "rchen@medisupply.com", phone: "+1-555-0103" },
  { id: "sup-4", name: "Office Depot Pro", contact: "Emily Davis", email: "emily@odepot.com", phone: "+1-555-0104" },
  { id: "sup-5", name: "FreshFoods Ltd.", contact: "Carlos Martinez", email: "carlos@freshfoods.com", phone: "+1-555-0105" },
];

export const initialWarehouses: Warehouse[] = [
  {
    id: "wh-1",
    name: "Alpha Warehouse",
    location: "New York, NY",
    address: "123 Industrial Blvd, New York, NY 10001",
    capacity: 10000,
    used: 7250,
    manager: "Michael Torres",
    zones: [
      { id: "zone-1a", warehouseId: "wh-1", name: "Zone A - Electronics", type: "storage", capacity: 3000, used: 2100 },
      { id: "zone-1b", warehouseId: "wh-1", name: "Zone B - Receiving", type: "receiving", capacity: 2000, used: 1500 },
      { id: "zone-1c", warehouseId: "wh-1", name: "Zone C - Cold Storage", type: "cold", capacity: 2000, used: 1800 },
      { id: "zone-1d", warehouseId: "wh-1", name: "Zone D - Shipping", type: "shipping", capacity: 3000, used: 1850 },
    ],
    createdAt: "2023-01-15",
  },
  {
    id: "wh-2",
    name: "Beta Distribution Center",
    location: "Los Angeles, CA",
    address: "456 Logistics Ave, Los Angeles, CA 90001",
    capacity: 15000,
    used: 9800,
    manager: "Jessica Wong",
    zones: [
      { id: "zone-2a", warehouseId: "wh-2", name: "Zone A - General Storage", type: "storage", capacity: 6000, used: 4200 },
      { id: "zone-2b", warehouseId: "wh-2", name: "Zone B - Receiving", type: "receiving", capacity: 3000, used: 2100 },
      { id: "zone-2c", warehouseId: "wh-2", name: "Zone C - Hazmat", type: "hazmat", capacity: 2000, used: 1500 },
      { id: "zone-2d", warehouseId: "wh-2", name: "Zone D - Shipping", type: "shipping", capacity: 4000, used: 2000 },
    ],
    createdAt: "2023-03-20",
  },
  {
    id: "wh-3",
    name: "Gamma Storage Facility",
    location: "Chicago, IL",
    address: "789 Commerce Dr, Chicago, IL 60601",
    capacity: 8000,
    used: 3200,
    manager: "David Kim",
    zones: [
      { id: "zone-3a", warehouseId: "wh-3", name: "Zone A - Furniture", type: "storage", capacity: 4000, used: 2000 },
      { id: "zone-3b", warehouseId: "wh-3", name: "Zone B - Receiving", type: "receiving", capacity: 2000, used: 800 },
      { id: "zone-3c", warehouseId: "wh-3", name: "Zone C - Shipping", type: "shipping", capacity: 2000, used: 400 },
    ],
    createdAt: "2023-06-10",
  },
  {
    id: "wh-4",
    name: "Delta Fulfillment Hub",
    location: "Houston, TX",
    address: "321 Supply Chain Rd, Houston, TX 77001",
    capacity: 12000,
    used: 5500,
    manager: "Amanda Rodriguez",
    zones: [
      { id: "zone-4a", warehouseId: "wh-4", name: "Zone A - General", type: "storage", capacity: 5000, used: 2500 },
      { id: "zone-4b", warehouseId: "wh-4", name: "Zone B - Medical", type: "storage", capacity: 3000, used: 1800 },
      { id: "zone-4c", warehouseId: "wh-4", name: "Zone C - Receiving", type: "receiving", capacity: 2000, used: 700 },
      { id: "zone-4d", warehouseId: "wh-4", name: "Zone D - Cold Chain", type: "cold", capacity: 2000, used: 500 },
    ],
    createdAt: "2023-09-05",
  },
];

export const initialItems: InventoryItem[] = [
  { id: "item-1", sku: "SKU-0001", name: "Dell XPS 15 Laptop", categoryId: "cat-1", warehouseId: "wh-1", zoneId: "zone-1a", quantity: 45, reorderPoint: 10, maxStock: 100, expirationDate: null, unitCost: 1299.99, supplierId: "sup-1", status: "in-stock", description: "High-performance laptop", unit: "units", createdAt: "2024-01-10", updatedAt: "2024-06-15" },
  { id: "item-2", sku: "SKU-0002", name: "Standing Desk Pro", categoryId: "cat-2", warehouseId: "wh-3", zoneId: "zone-3a", quantity: 8, reorderPoint: 5, maxStock: 50, expirationDate: null, unitCost: 899.99, supplierId: "sup-2", status: "low-stock", description: "Ergonomic height-adjustable desk", unit: "units", createdAt: "2024-01-15", updatedAt: "2024-06-10" },
  { id: "item-3", sku: "SKU-0003", name: "N95 Respirator Masks", categoryId: "cat-3", warehouseId: "wh-4", zoneId: "zone-4b", quantity: 0, reorderPoint: 500, maxStock: 5000, expirationDate: "2025-12-31", unitCost: 2.50, supplierId: "sup-3", status: "out-of-stock", description: "Medical grade respirator", unit: "boxes", createdAt: "2024-02-01", updatedAt: "2024-06-20" },
  { id: "item-4", sku: "SKU-0004", name: "HP LaserJet Toner", categoryId: "cat-4", warehouseId: "wh-1", zoneId: "zone-1b", quantity: 120, reorderPoint: 20, maxStock: 200, expirationDate: null, unitCost: 45.00, supplierId: "sup-4", status: "in-stock", description: "Black toner cartridge", unit: "units", createdAt: "2024-02-10", updatedAt: "2024-06-18" },
  { id: "item-5", sku: "SKU-0005", name: "Organic Apple Juice", categoryId: "cat-5", warehouseId: "wh-1", zoneId: "zone-1c", quantity: 350, reorderPoint: 100, maxStock: 500, expirationDate: "2024-09-30", unitCost: 3.25, supplierId: "sup-5", status: "in-stock", description: "100% organic cold-pressed", unit: "cases", createdAt: "2024-03-01", updatedAt: "2024-06-22" },
  { id: "item-6", sku: "SKU-0006", name: "Samsung 4K Monitor", categoryId: "cat-1", warehouseId: "wh-2", zoneId: "zone-2a", quantity: 28, reorderPoint: 8, maxStock: 80, expirationDate: null, unitCost: 499.99, supplierId: "sup-1", status: "in-stock", description: "32-inch UHD display", unit: "units", createdAt: "2024-03-10", updatedAt: "2024-06-19" },
  { id: "item-7", sku: "SKU-0007", name: "Ergonomic Chair Model X", categoryId: "cat-2", warehouseId: "wh-3", zoneId: "zone-3a", quantity: 3, reorderPoint: 5, maxStock: 40, expirationDate: null, unitCost: 599.99, supplierId: "sup-2", status: "low-stock", description: "Lumbar support office chair", unit: "units", createdAt: "2024-03-15", updatedAt: "2024-06-21" },
  { id: "item-8", sku: "SKU-0008", name: "Surgical Gloves Latex", categoryId: "cat-3", warehouseId: "wh-4", zoneId: "zone-4b", quantity: 2000, reorderPoint: 500, maxStock: 10000, expirationDate: "2025-06-30", unitCost: 0.15, supplierId: "sup-3", status: "in-stock", description: "Sterile disposable gloves", unit: "pairs", createdAt: "2024-04-01", updatedAt: "2024-06-17" },
  { id: "item-9", sku: "SKU-0009", name: "A4 Copy Paper", categoryId: "cat-4", warehouseId: "wh-2", zoneId: "zone-2a", quantity: 85, reorderPoint: 50, maxStock: 300, expirationDate: null, unitCost: 12.99, supplierId: "sup-4", status: "in-stock", description: "80gsm white copy paper", unit: "reams", createdAt: "2024-04-10", updatedAt: "2024-06-20" },
  { id: "item-10", sku: "SKU-0010", name: "Energy Drink 24-pack", categoryId: "cat-5", warehouseId: "wh-1", zoneId: "zone-1c", quantity: 12, reorderPoint: 50, maxStock: 300, expirationDate: "2024-08-15", unitCost: 28.99, supplierId: "sup-5", status: "low-stock", description: "Mixed flavor variety pack", unit: "cases", createdAt: "2024-04-15", updatedAt: "2024-06-23" },
  { id: "item-11", sku: "SKU-0011", name: "MacBook Air M3", categoryId: "cat-1", warehouseId: "wh-2", zoneId: "zone-2a", quantity: 15, reorderPoint: 5, maxStock: 50, expirationDate: null, unitCost: 1099.99, supplierId: "sup-1", status: "in-stock", description: "Apple silicon laptop", unit: "units", createdAt: "2024-05-01", updatedAt: "2024-06-22" },
  { id: "item-12", sku: "SKU-0012", name: "Brake Pads Set", categoryId: "cat-6", warehouseId: "wh-4", zoneId: "zone-4a", quantity: 65, reorderPoint: 20, maxStock: 200, expirationDate: null, unitCost: 49.99, supplierId: "sup-4", status: "in-stock", description: "Universal fit ceramic brake pads", unit: "sets", createdAt: "2024-05-10", updatedAt: "2024-06-18" },
  { id: "item-13", sku: "SKU-0013", name: "Wireless Keyboard Combo", categoryId: "cat-1", warehouseId: null, zoneId: null, quantity: 0, reorderPoint: 15, maxStock: 100, expirationDate: null, unitCost: 79.99, supplierId: "sup-1", status: "out-of-stock", description: "Bluetooth keyboard and mouse set", unit: "units", createdAt: "2024-05-15", updatedAt: "2024-06-24" },
  { id: "item-14", sku: "SKU-0014", name: "Frozen Vegetables Mix", categoryId: "cat-5", warehouseId: "wh-1", zoneId: "zone-1c", quantity: 180, reorderPoint: 50, maxStock: 300, expirationDate: "2025-03-15", unitCost: 4.50, supplierId: "sup-5", status: "in-stock", description: "Premium mixed frozen vegetables", unit: "cases", createdAt: "2024-05-20", updatedAt: "2024-06-23" },
  { id: "item-15", sku: "SKU-0015", name: "Medical Oxygen Concentrator", categoryId: "cat-3", warehouseId: "wh-4", zoneId: "zone-4b", quantity: 4, reorderPoint: 2, maxStock: 20, expirationDate: null, unitCost: 1850.00, supplierId: "sup-3", status: "low-stock", description: "5L/min home oxygen concentrator", unit: "units", createdAt: "2024-06-01", updatedAt: "2024-06-20" },
];

export const initialTransactions: StockTransaction[] = [
  { id: "txn-1", itemId: "item-1", type: "stock-in", quantity: 50, date: "2024-06-01", supplierId: "sup-1", referenceNumber: "PO-2024-001", notes: "Monthly restock", processedBy: "Michael Torres", unitCost: 1299.99 },
  { id: "txn-2", itemId: "item-1", type: "stock-out", quantity: 5, date: "2024-06-05", purpose: "sales", referenceNumber: "SO-2024-042", notes: "Client order #4892", processedBy: "Jessica Wong", unitCost: 1299.99 },
  { id: "txn-3", itemId: "item-4", type: "stock-in", quantity: 80, date: "2024-06-03", supplierId: "sup-4", referenceNumber: "PO-2024-002", notes: "Quarterly supply", processedBy: "David Kim", unitCost: 45.00 },
  { id: "txn-4", itemId: "item-5", type: "stock-in", quantity: 200, date: "2024-06-07", supplierId: "sup-5", referenceNumber: "PO-2024-003", notes: "Summer stock", processedBy: "Amanda Rodriguez", unitCost: 3.25, expirationDate: "2024-09-30" },
  { id: "txn-5", itemId: "item-8", type: "stock-in", quantity: 2000, date: "2024-06-10", supplierId: "sup-3", referenceNumber: "PO-2024-004", notes: "Medical supply restock", processedBy: "Michael Torres", unitCost: 0.15, expirationDate: "2025-06-30" },
  { id: "txn-6", itemId: "item-3", type: "stock-out", quantity: 100, date: "2024-06-12", purpose: "production", referenceNumber: "SO-2024-055", notes: "Emergency supply distribution", processedBy: "Jessica Wong", unitCost: 2.50 },
  { id: "txn-7", itemId: "item-6", type: "stock-in", quantity: 30, date: "2024-06-15", supplierId: "sup-1", referenceNumber: "PO-2024-005", notes: "Display upgrade project", processedBy: "David Kim", unitCost: 499.99 },
  { id: "txn-8", itemId: "item-9", type: "stock-out", quantity: 40, date: "2024-06-18", purpose: "sales", referenceNumber: "SO-2024-067", notes: "Office supply order", processedBy: "Amanda Rodriguez", unitCost: 12.99 },
  { id: "txn-9", itemId: "item-11", type: "stock-in", quantity: 20, date: "2024-06-20", supplierId: "sup-1", referenceNumber: "PO-2024-006", notes: "New model arrival", processedBy: "Michael Torres", unitCost: 1099.99 },
  { id: "txn-10", itemId: "item-12", type: "stock-in", quantity: 100, date: "2024-06-22", supplierId: "sup-4", referenceNumber: "PO-2024-007", notes: "Automotive parts restock", processedBy: "Jessica Wong", unitCost: 49.99 },
];

export const initialTransfers: Transfer[] = [
  { id: "tr-1", itemId: "item-2", fromWarehouseId: "wh-1", toWarehouseId: "wh-3", fromZoneId: "zone-1b", toZoneId: "zone-3a", quantity: 10, status: "completed", requestedBy: "Michael Torres", approvedBy: "Jessica Wong", date: "2024-06-05", completedAt: "2024-06-07", notes: "Furniture redistribution" },
  { id: "tr-2", itemId: "item-6", fromWarehouseId: "wh-1", toWarehouseId: "wh-2", fromZoneId: "zone-1a", toZoneId: "zone-2a", quantity: 5, status: "in-transit", requestedBy: "David Kim", approvedBy: "Amanda Rodriguez", date: "2024-06-20", notes: "West coast demand" },
  { id: "tr-3", itemId: "item-4", fromWarehouseId: "wh-2", toWarehouseId: "wh-4", fromZoneId: "zone-2a", toZoneId: "zone-4a", quantity: 30, status: "pending", requestedBy: "Amanda Rodriguez", date: "2024-06-23", notes: "Supply balancing" },
  { id: "tr-4", itemId: "item-9", fromWarehouseId: "wh-1", toWarehouseId: "wh-3", fromZoneId: "zone-1b", toZoneId: "zone-3b", quantity: 20, status: "completed", requestedBy: "Jessica Wong", approvedBy: "Michael Torres", date: "2024-06-10", completedAt: "2024-06-12", notes: "Office supply distribution" },
];

export const initialAlerts: Alert[] = [
  { id: "alert-1", type: "low-stock", itemId: "item-2", message: "Standing Desk Pro quantity (8) is below reorder point (5)", severity: "warning", createdAt: "2024-06-24", acknowledged: false },
  { id: "alert-2", type: "out-of-stock", itemId: "item-3", message: "N95 Respirator Masks is out of stock - immediate reorder required", severity: "critical", createdAt: "2024-06-23", acknowledged: false },
  { id: "alert-3", type: "out-of-stock", itemId: "item-13", message: "Wireless Keyboard Combo is out of stock", severity: "critical", createdAt: "2024-06-22", acknowledged: false },
  { id: "alert-4", type: "low-stock", itemId: "item-7", message: "Ergonomic Chair Model X is critically low (3 units)", severity: "critical", createdAt: "2024-06-24", acknowledged: false },
  { id: "alert-5", type: "expiring", itemId: "item-10", message: "Energy Drink 24-pack expires on 2024-08-15 (< 60 days)", severity: "warning", createdAt: "2024-06-24", acknowledged: false },
  { id: "alert-6", type: "low-stock", itemId: "item-15", message: "Medical Oxygen Concentrator is low (4 units near reorder point)", severity: "warning", createdAt: "2024-06-23", acknowledged: true },
  { id: "alert-7", type: "expiring", itemId: "item-5", message: "Organic Apple Juice expires on 2024-09-30 (< 90 days)", severity: "info", createdAt: "2024-06-22", acknowledged: true },
];

export const initialReorderRequests: ReorderRequest[] = [
  { id: "ro-1", itemId: "item-3", supplierId: "sup-3", quantity: 1000, status: "pending", createdAt: "2024-06-23", estimatedDelivery: "2024-07-05", notes: "Urgent - out of stock" },
  { id: "ro-2", itemId: "item-7", supplierId: "sup-2", quantity: 20, status: "approved", createdAt: "2024-06-24", estimatedDelivery: "2024-07-10", notes: "Low stock alert triggered" },
  { id: "ro-3", itemId: "item-13", supplierId: "sup-1", quantity: 50, status: "ordered", createdAt: "2024-06-22", estimatedDelivery: "2024-07-03", notes: "Auto-generated PO" },
];

export const initialUsers: User[] = [
  { id: "user-1", name: "Michael Torres", email: "m.torres@erp.com", role: "admin", avatar: "MT", department: "Operations", lastLogin: "2024-06-24 09:15", active: true, createdAt: "2023-01-01" },
  { id: "user-2", name: "Jessica Wong", email: "j.wong@erp.com", role: "manager", avatar: "JW", department: "Logistics", lastLogin: "2024-06-24 08:30", active: true, createdAt: "2023-02-15" },
  { id: "user-3", name: "David Kim", email: "d.kim@erp.com", role: "manager", avatar: "DK", department: "Warehouse", lastLogin: "2024-06-23 17:45", active: true, createdAt: "2023-03-20" },
  { id: "user-4", name: "Amanda Rodriguez", email: "a.rodriguez@erp.com", role: "staff", avatar: "AR", department: "Inventory", lastLogin: "2024-06-24 10:00", active: true, createdAt: "2023-06-01" },
  { id: "user-5", name: "Brian Chen", email: "b.chen@erp.com", role: "staff", avatar: "BC", department: "Receiving", lastLogin: "2024-06-22 14:30", active: true, createdAt: "2023-09-10" },
  { id: "user-6", name: "Sarah Johnson", email: "s.johnson@erp.com", role: "viewer", avatar: "SJ", department: "Finance", lastLogin: "2024-06-20 11:15", active: false, createdAt: "2024-01-05" },
];

export const initialNotifications: Notification[] = [
  { id: "notif-1", title: "Critical Stock Alert", message: "N95 Masks are out of stock", type: "error", read: false, createdAt: "2024-06-24 10:30" },
  { id: "notif-2", title: "Transfer Completed", message: "10 units of Standing Desk transferred to Gamma", type: "success", read: false, createdAt: "2024-06-24 09:15" },
  { id: "notif-3", title: "Low Stock Warning", message: "Ergonomic Chair Model X is critically low", type: "warning", read: false, createdAt: "2024-06-24 08:45" },
  { id: "notif-4", title: "Reorder Approved", message: "PO for 20 Ergonomic Chairs approved", type: "info", read: true, createdAt: "2024-06-23 16:00" },
  { id: "notif-5", title: "Stock-In Processed", message: "200 units of Apple Juice received", type: "success", read: true, createdAt: "2024-06-23 14:30" },
];
