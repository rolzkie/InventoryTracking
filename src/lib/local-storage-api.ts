import type { InventoryItem, Warehouse, Transfer, StockTransaction, DashboardStats, ReportSummary, LowStockSummaryItem } from "./api";

const STORAGE_KEYS = {
  warehouses: "inventory_warehouses",
  inventory: "inventory_items",
  transfers: "inventory_transfers",
  transactions: "inventory_transactions",
};

function genId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function itemStatus(
  quantity: number,
  reorderPoint: number
): "out_of_stock" | "low_stock" | "in_stock" {
  if (quantity === 0) return "out_of_stock";
  if (quantity < reorderPoint) return "low_stock";
  return "in_stock";
}

function getList<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to get ${key} from localStorage:`, error);
    return [];
  }
}

function saveList<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

export const localStorageAPI = {
  dashboard: async (): Promise<DashboardStats> => {
    const inventory = getList<InventoryItem>(STORAGE_KEYS.inventory);
    const warehouses = getList<Warehouse>(STORAGE_KEYS.warehouses);
    const transfers = getList<Transfer>(STORAGE_KEYS.transfers);

    const totalSkus = inventory.length;
    const outOfStock = inventory.filter((i) => i.quantity === 0).length;
    const lowStock = inventory.filter(
      (i) => i.quantity > 0 && i.quantity < i.reorderPoint
    ).length;
    const totalValue = inventory.reduce(
      (sum, i) => sum + (i.quantity * i.unitPrice || 0),
      0
    );

    const today = new Date().toISOString().slice(0, 10);
    const todayTransfers = transfers.filter(
      (t) => t.createdAt.slice(0, 10) === today
    ).length;

    const alerts = inventory
      .filter((i) => i.quantity === 0 || i.quantity < i.reorderPoint)
      .map((i) => ({
        ...i,
        alertType:
          i.quantity === 0
            ? ("out_of_stock" as const)
            : ("low_stock" as const),
      }));

    return {
      totalSkus,
      unassigned: inventory.filter((i) => !i.warehouseId || i.warehouseId === "").length,
      outOfStock,
      lowStock,
      totalValue,
      warehouseCount: warehouses.length,
      todayTransfers,
      alerts,
    };
  },

  reports: {
    summary: async (): Promise<ReportSummary> => {
      const inventory = getList<InventoryItem>(STORAGE_KEYS.inventory);
      const warehouses = getList<Warehouse>(STORAGE_KEYS.warehouses);
      const transfers = getList<Transfer>(STORAGE_KEYS.transfers);

      const alerts = inventory
        .filter((i) => i.quantity === 0 || i.quantity < i.reorderPoint)
        .map((item) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          reorderPoint: item.reorderPoint,
          status: itemStatus(item.quantity, item.reorderPoint),
          warehouseName: item.warehouseName ?? "",
        }));

      return {
        warehouseCount: warehouses.length,
        inventoryCount: inventory.length,
        lowStockCount: inventory.filter((i) => i.quantity > 0 && i.quantity < i.reorderPoint).length,
        outOfStockCount: inventory.filter((i) => i.quantity === 0).length,
        transferCount: transfers.length,
        unassignedCount: inventory.filter((i) => !i.warehouseId || i.warehouseId === "").length,
        totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unitPrice || 0), 0),
        alerts,
        generatedAt: new Date().toISOString(),
      };
    },
    lowStock: async (): Promise<LowStockSummaryItem[]> => {
      const inventory = getList<InventoryItem>(STORAGE_KEYS.inventory);
      return inventory
        .filter((i) => i.quantity === 0 || i.quantity < i.reorderPoint)
        .map((item) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          reorderPoint: item.reorderPoint,
          warehouseName: item.warehouseName ?? "",
          status: itemStatus(item.quantity, item.reorderPoint),
        }));
    },
  },

  warehouses: {
    list: async () => getList<Warehouse>(STORAGE_KEYS.warehouses),
    create: async (data: Partial<Warehouse>) => {
      const list = getList<Warehouse>(STORAGE_KEYS.warehouses);
      const wh: Warehouse = {
        id: genId("WH"),
        name: data.name ?? "",
        location: data.location ?? "",
        capacity: Number(data.capacity) || 0,
        used: 0,
        manager: data.manager ?? "",
        status: "active",
        createdAt: new Date().toISOString(),
      };
      list.push(wh);
      saveList(STORAGE_KEYS.warehouses, list);
      return wh;
    },
    update: async (id: string, data: Partial<Warehouse>) => {
      const list = getList<Warehouse>(STORAGE_KEYS.warehouses);
      const idx = list.findIndex((w) => w.id === id);
      if (idx === -1) throw new Error("Not found");
      list[idx] = { ...list[idx], ...data, id };
      saveList(STORAGE_KEYS.warehouses, list);
      return list[idx];
    },
    delete: async (id: string) => {
      let list = getList<Warehouse>(STORAGE_KEYS.warehouses);
      const idx = list.findIndex((w) => w.id === id);
      if (idx === -1) throw new Error("Not found");
      list = list.filter((w) => w.id !== id);
      saveList(STORAGE_KEYS.warehouses, list);
      return { ok: true };
    },
  },

  inventory: {
    list: async () => {
      const list = getList<InventoryItem>(STORAGE_KEYS.inventory);
      return list.map((item) => ({
        ...item,
        status: itemStatus(item.quantity, item.reorderPoint),
      }));
    },
    create: async (data: Partial<InventoryItem>) => {
      const list = getList<InventoryItem>(STORAGE_KEYS.inventory);

      if (list.some((i) => i.sku === data.sku)) {
        throw new Error("SKU already exists");
      }

      const item: InventoryItem = {
        id: genId("INV"),
        sku: data.sku ?? "",
        name: data.name ?? "",
        description: data.description ?? "",
        category: data.category ?? "",
        quantity: Number(data.quantity) || 0,
        reorderPoint: Number(data.reorderPoint) || 0,
        warehouseId: data.warehouseId ?? "",
        storageLocation: data.storageLocation ?? "",
        unitPrice: Number(data.unitPrice) || 0,
        lastRestocked: new Date().toISOString().slice(0, 10),
        status: itemStatus(
          Number(data.quantity) || 0,
          Number(data.reorderPoint) || 0
        ),
        qty: Number(data.quantity) || 0,
        cost: Number(data.unitPrice) || 0,
        unit: data.unit ?? "pcs",
        notes: data.description ?? "",
        createdAt: new Date().toISOString(),
        warehouseName: "",
      };
      list.push(item);
      saveList(STORAGE_KEYS.inventory, list);
      return item;
    },
    update: async (id: string, data: Partial<InventoryItem>) => {
      const list = getList<InventoryItem>(STORAGE_KEYS.inventory);
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Not found");
      list[idx] = { ...list[idx], ...data, id };
      saveList(STORAGE_KEYS.inventory, list);
      return list[idx];
    },
    delete: async (id: string) => {
      let list = getList<InventoryItem>(STORAGE_KEYS.inventory);
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Not found");
      list = list.filter((i) => i.id !== id);
      saveList(STORAGE_KEYS.inventory, list);
      return { ok: true };
    },
    adjust: async (id: string, delta: number) => {
      const list = getList<InventoryItem>(STORAGE_KEYS.inventory);
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Not found");
      list[idx].quantity = Math.max(0, list[idx].quantity + delta);
      list[idx].status = itemStatus(list[idx].quantity, list[idx].reorderPoint);
      saveList(STORAGE_KEYS.inventory, list);
      return list[idx];
    },
  },

  transfers: {
    list: async () => {
      const list = getList<Transfer>(STORAGE_KEYS.transfers);
      return [...list].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    },
    create: async (data: Partial<Transfer>) => {
      const inventory = getList<InventoryItem>(STORAGE_KEYS.inventory);
      const itemIdx = inventory.findIndex((i) => i.id === data.itemId);
      if (itemIdx === -1) throw new Error("Inventory item not found");

      const item = inventory[itemIdx];
      const sourceWarehouse = data.sourceWarehouse ?? data.fromWarehouseId ?? "";
      const destinationWarehouse = data.destinationWarehouse ?? data.toWarehouseId ?? "";
      const quantity = Number(data.quantity ?? data.qty ?? 0) || 0;
      const status = data.status ?? "pending";

      if (item.warehouseId !== sourceWarehouse) {
        throw new Error("Item is not stored in the source warehouse");
      }

      if (item.quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${item.quantity}`);
      }

      const transfers = getList<Transfer>(STORAGE_KEYS.transfers);
      const trf: Transfer = {
        id: genId("TRN"),
        sourceWarehouse,
        destinationWarehouse,
        fromWarehouseId: sourceWarehouse,
        toWarehouseId: destinationWarehouse,
        itemId: data.itemId ?? "",
        itemName: item.name,
        quantity,
        qty: quantity,
        status,
        createdAt: data.createdAt ?? new Date().toISOString(),
        date: data.date ?? new Date().toISOString().slice(0, 10),
        completedAt: data.completedAt,
        notes: data.notes ?? "",
        initiator: data.initiator ?? "Sarah Chen",
      };

      if (status === "in_transit" || status === "completed") {
        inventory[itemIdx].quantity -= quantity;
        inventory[itemIdx].status = itemStatus(
          inventory[itemIdx].quantity,
          inventory[itemIdx].reorderPoint
        );
      }

      transfers.push(trf);
      saveList(STORAGE_KEYS.transfers, transfers);
      saveList(STORAGE_KEYS.inventory, inventory);
      return trf;
    },
    update: async (id: string, data: Partial<Transfer>) => {
      const transfers = getList<Transfer>(STORAGE_KEYS.transfers);
      const idx = transfers.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("Not found");

      const oldTransfer = transfers[idx];
      const nextStatus = data.status ?? oldTransfer.status;
      const quantity = Number(data.quantity ?? data.qty ?? oldTransfer.quantity) || 0;
      const sourceWarehouse = data.sourceWarehouse ?? data.fromWarehouseId ?? oldTransfer.sourceWarehouse;
      const destinationWarehouse = data.destinationWarehouse ?? data.toWarehouseId ?? oldTransfer.destinationWarehouse;

      transfers[idx] = {
        ...transfers[idx],
        ...data,
        sourceWarehouse,
        destinationWarehouse,
        fromWarehouseId: sourceWarehouse,
        toWarehouseId: destinationWarehouse,
        quantity,
        qty: quantity,
        status: nextStatus,
      };

      const inventory = getList<InventoryItem>(STORAGE_KEYS.inventory);
      const itemIdx = inventory.findIndex((i) => i.id === oldTransfer.itemId);

      if (itemIdx !== -1) {
        const item = inventory[itemIdx];
        if (oldTransfer.status === "in_transit" && nextStatus === "cancelled") {
          item.quantity += oldTransfer.quantity;
          item.status = itemStatus(item.quantity, item.reorderPoint);
        } else if (oldTransfer.status === "in_transit" && nextStatus === "completed") {
          item.quantity += oldTransfer.quantity;
          item.warehouseId = destinationWarehouse;
          item.status = itemStatus(item.quantity, item.reorderPoint);
        } else if (oldTransfer.status !== "completed" && nextStatus === "completed") {
          item.quantity += quantity;
          item.warehouseId = destinationWarehouse;
          item.status = itemStatus(item.quantity, item.reorderPoint);
        } else if (oldTransfer.status === "pending" && nextStatus === "in_transit") {
          item.quantity -= quantity;
          item.status = itemStatus(item.quantity, item.reorderPoint);
        } else if (oldTransfer.status === "in_transit" && nextStatus === "pending") {
          item.quantity += oldTransfer.quantity;
          item.status = itemStatus(item.quantity, item.reorderPoint);
        }

        saveList(STORAGE_KEYS.inventory, inventory);
      }

      saveList(STORAGE_KEYS.transfers, transfers);
      return transfers[idx];
    },
    delete: async (id: string) => {
      let transfers = getList<Transfer>(STORAGE_KEYS.transfers);
      const idx = transfers.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("Not found");

      const transfer = transfers[idx];
      if (transfer.status === "in_transit" || transfer.status === "completed") {
        const inventory = getList<InventoryItem>(STORAGE_KEYS.inventory);
        const itemIdx = inventory.findIndex((i) => i.id === transfer.itemId);
        if (itemIdx !== -1) {
          inventory[itemIdx].quantity += transfer.quantity;
          inventory[itemIdx].status = itemStatus(
            inventory[itemIdx].quantity,
            inventory[itemIdx].reorderPoint
          );
          saveList(STORAGE_KEYS.inventory, inventory);
        }
      }

      transfers = transfers.filter((t) => t.id !== id);
      saveList(STORAGE_KEYS.transfers, transfers);
      return { ok: true };
    },
  },

  transactions: {
    list: async () => {
      const list = getList<StockTransaction>(STORAGE_KEYS.transactions);
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    create: async (data: Partial<StockTransaction>) => {
      const list = getList<StockTransaction>(STORAGE_KEYS.transactions);
      const transaction: StockTransaction = {
        id: genId("TX"),
        itemId: data.itemId ?? "",
        warehouseId: data.warehouseId ?? "",
        transactionType: data.transactionType ?? "stock_in",
        quantity: Number(data.quantity ?? 0),
        expirationDate: data.expirationDate,
        notes: data.notes ?? "",
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt,
        itemName: data.itemName ?? "",
        warehouseName: data.warehouseName ?? "",
      };
      list.push(transaction);
      saveList(STORAGE_KEYS.transactions, list);
      return transaction;
    },
    update: async (id: string, data: Partial<StockTransaction>) => {
      const list = getList<StockTransaction>(STORAGE_KEYS.transactions);
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("Not found");
      list[idx] = {
        ...list[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      saveList(STORAGE_KEYS.transactions, list);
      return list[idx];
    },
    delete: async (id: string) => {
      let list = getList<StockTransaction>(STORAGE_KEYS.transactions);
      if (!list.some((t) => t.id === id)) throw new Error("Not found");
      list = list.filter((t) => t.id !== id);
      saveList(STORAGE_KEYS.transactions, list);
      return { ok: true };
    },
  },
};
