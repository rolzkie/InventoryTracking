import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const PREFIX = "/make-server-3c7e7389";

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

const SEED_WAREHOUSES = [
  { id: "WH-ALPHA", name: "Alpha Distribution Center", location: "Portland, OR", capacity: 12000, used: 8734, manager: "Sarah Chen", status: "active", createdAt: new Date().toISOString() },
  { id: "WH-BETA",  name: "Beta Fulfillment Hub",       location: "Chicago, IL",  capacity: 8500,  used: 5210, manager: "Marcus Webb", status: "active", createdAt: new Date().toISOString() },
  { id: "WH-GAMMA", name: "Gamma Cold Storage",          location: "Dallas, TX",   capacity: 5000,  used: 4780, manager: "Priya Nair",  status: "near_full", createdAt: new Date().toISOString() },
  { id: "WH-DELTA", name: "Delta Overflow Unit",         location: "Newark, NJ",   capacity: 3000,  used: 420,  manager: "Tom Russo",   status: "active", createdAt: new Date().toISOString() },
];

const SEED_INVENTORY = [
  { id: "INV-001", name: "Circuit Board v3.2",    sku: "CB-3200",  category: "Electronics",  warehouseId: "WH-ALPHA", qty: 2847, reorderPoint: 500, unit: "pcs",    cost: 42.50, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-002", name: "Hydraulic Pump 12V",    sku: "HP-012V",  category: "Hardware",     warehouseId: "WH-BETA",  qty: 134,  reorderPoint: 200, unit: "units",  cost: 189.00, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-003", name: "Isopropyl Alcohol 99%", sku: "IPA-99",   category: "Chemicals",    warehouseId: "WH-ALPHA", qty: 0,    reorderPoint: 100, unit: "liters", cost: 8.75, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-004", name: "Bubble Wrap Roll 50m",  sku: "BW-050",   category: "Packaging",    warehouseId: "WH-GAMMA", qty: 892,  reorderPoint: 150, unit: "rolls",  cost: 14.20, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-005", name: "Steel Rod 6mm × 3m",    sku: "SR-6300",  category: "Raw Materials", warehouseId: "WH-BETA", qty: 312,  reorderPoint: 100, unit: "rods",   cost: 6.90, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-006", name: "LED Strip 5050 RGB",    sku: "LED-5050", category: "Electronics",  warehouseId: "WH-ALPHA", qty: 67,   reorderPoint: 200, unit: "meters", cost: 3.40, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-007", name: "Epoxy Resin 2-Part",    sku: "ER-2PT",   category: "Chemicals",    warehouseId: "WH-GAMMA", qty: 441,  reorderPoint: 80,  unit: "kg",     cost: 22.00, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-008", name: "Servo Motor MG996R",    sku: "SM-MG996", category: "Electronics",  warehouseId: "WH-ALPHA", qty: 0,    reorderPoint: 50,  unit: "pcs",    cost: 11.50, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-009", name: "Aluminum Sheet 1mm",    sku: "AS-01MM",  category: "Raw Materials", warehouseId: "WH-BETA", qty: 650,  reorderPoint: 100, unit: "sheets", cost: 18.00, notes: "", createdAt: new Date().toISOString() },
  { id: "INV-010", name: "Power Supply 24V 10A",  sku: "PS-24V10", category: "Electronics",  warehouseId: "WH-ALPHA", qty: 203,  reorderPoint: 50,  unit: "units",  cost: 55.00, notes: "", createdAt: new Date().toISOString() },
];

const SEED_TRANSFERS = [
  { id: "TRF-2847", itemId: "INV-001", itemName: "Circuit Board v3.2",    fromWarehouseId: "WH-BETA",  toWarehouseId: "WH-ALPHA", qty: 200, date: "2026-07-09", status: "completed", initiator: "S. Chen",  notes: "", createdAt: new Date().toISOString() },
  { id: "TRF-2846", itemId: "INV-004", itemName: "Bubble Wrap Roll 50m",  fromWarehouseId: "WH-ALPHA", toWarehouseId: "WH-GAMMA", qty: 50,  date: "2026-07-09", status: "in_transit", initiator: "M. Webb", notes: "", createdAt: new Date().toISOString() },
  { id: "TRF-2845", itemId: "INV-005", itemName: "Steel Rod 6mm × 3m",    fromWarehouseId: "WH-GAMMA", toWarehouseId: "WH-BETA",  qty: 100, date: "2026-07-08", status: "in_transit", initiator: "P. Nair", notes: "", createdAt: new Date().toISOString() },
  { id: "TRF-2844", itemId: "INV-006", itemName: "LED Strip 5050 RGB",    fromWarehouseId: "WH-ALPHA", toWarehouseId: "WH-DELTA", qty: 30,  date: "2026-07-08", status: "pending",    initiator: "T. Russo", notes: "", createdAt: new Date().toISOString() },
  { id: "TRF-2843", itemId: "INV-007", itemName: "Epoxy Resin 2-Part",    fromWarehouseId: "WH-BETA",  toWarehouseId: "WH-GAMMA", qty: 75,  date: "2026-07-07", status: "completed",  initiator: "S. Chen", notes: "", createdAt: new Date().toISOString() },
  { id: "TRF-2842", itemId: "INV-002", itemName: "Hydraulic Pump 12V",    fromWarehouseId: "WH-ALPHA", toWarehouseId: "WH-BETA",  qty: 20,  date: "2026-07-07", status: "cancelled",  initiator: "M. Webb", notes: "", createdAt: new Date().toISOString() },
];

async function getList(key: string): Promise<any[]> {
  const data = await kv.get(key);
  return Array.isArray(data) ? data : [];
}

async function saveList(key: string, items: any[]): Promise<void> {
  await kv.set(key, items);
}

function itemStatus(qty: number, reorderPoint: number): string {
  if (qty === 0) return "out_of_stock";
  if (qty < reorderPoint) return "low_stock";
  return "in_stock";
}

// ── Seed ─────────────────────────────────────────────────────────────────────

app.post(`${PREFIX}/seed`, async (c) => {
  await kv.set("warehouses", SEED_WAREHOUSES);
  await kv.set("inventory", SEED_INVENTORY);
  await kv.set("transfers", SEED_TRANSFERS);
  return c.json({ ok: true, message: "Database seeded successfully" });
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// ── Dashboard ─────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/dashboard`, async (c) => {
  const inventory = await getList("inventory");
  const warehouses = await getList("warehouses");
  const transfers = await getList("transfers");

  const totalSkus = inventory.length;
  const outOfStock = inventory.filter(i => i.qty === 0).length;
  const lowStock = inventory.filter(i => i.qty > 0 && i.qty < i.reorderPoint).length;
  const totalValue = inventory.reduce((sum, i) => sum + i.qty * i.cost, 0);

  const today = new Date().toISOString().slice(0, 10);
  const todayTransfers = transfers.filter(t => t.date === today).length;

  const alerts = inventory
    .filter(i => i.qty === 0 || i.qty < i.reorderPoint)
    .map(i => ({ ...i, alertType: i.qty === 0 ? "out_of_stock" : "low_stock" }));

  return c.json({ totalSkus, outOfStock, lowStock, totalValue, warehouseCount: warehouses.length, todayTransfers, alerts });
});

// ── Warehouses ────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/warehouses`, async (c) => {
  let list = await getList("warehouses");
  if (list.length === 0) {
    list = SEED_WAREHOUSES;
    await saveList("warehouses", list);
  }
  return c.json(list);
});

app.post(`${PREFIX}/warehouses`, async (c) => {
  const body = await c.req.json();
  const list = await getList("warehouses");
  const wh = {
    id: genId("WH"),
    name: body.name,
    location: body.location,
    capacity: Number(body.capacity) || 0,
    used: 0,
    manager: body.manager,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  list.push(wh);
  await saveList("warehouses", list);
  return c.json(wh, 201);
});

app.put(`${PREFIX}/warehouses/:id`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const list = await getList("warehouses");
  const idx = list.findIndex(w => w.id === id);
  if (idx === -1) return c.json({ error: "Not found" }, 404);
  list[idx] = { ...list[idx], ...body, id };
  await saveList("warehouses", list);
  return c.json(list[idx]);
});

app.delete(`${PREFIX}/warehouses/:id`, async (c) => {
  const id = c.req.param("id");
  let list = await getList("warehouses");
  const idx = list.findIndex(w => w.id === id);
  if (idx === -1) return c.json({ error: "Not found" }, 404);
  list = list.filter(w => w.id !== id);
  await saveList("warehouses", list);
  return c.json({ ok: true });
});

// ── Inventory ─────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/inventory`, async (c) => {
  let list = await getList("inventory");
  if (list.length === 0) {
    list = SEED_INVENTORY;
    await saveList("inventory", list);
  }
  const warehouses = await getList("warehouses");
  const whMap: Record<string, any> = {};
  warehouses.forEach(w => { whMap[w.id] = w; });
  return c.json(list.map(item => ({
    ...item,
    status: itemStatus(item.qty, item.reorderPoint),
    warehouseName: whMap[item.warehouseId]?.name ?? item.warehouseId,
  })));
});

app.post(`${PREFIX}/inventory`, async (c) => {
  const body = await c.req.json();
  const list = await getList("inventory");

  // Check SKU uniqueness
  if (list.some(i => i.sku === body.sku)) {
    return c.json({ error: "SKU already exists" }, 409);
  }

  const item = {
    id: genId("INV"),
    name: body.name,
    sku: body.sku,
    category: body.category,
    warehouseId: body.warehouseId,
    qty: Number(body.qty) || 0,
    reorderPoint: Number(body.reorderPoint) || 0,
    unit: body.unit,
    cost: parseFloat(body.cost) || 0,
    notes: body.notes ?? "",
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  await saveList("inventory", list);
  return c.json({ ...item, status: itemStatus(item.qty, item.reorderPoint) }, 201);
});

app.put(`${PREFIX}/inventory/:id`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const list = await getList("inventory");
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return c.json({ error: "Not found" }, 404);

  // Check SKU uniqueness (exclude self)
  if (body.sku && list.some(i => i.sku === body.sku && i.id !== id)) {
    return c.json({ error: "SKU already exists" }, 409);
  }

  list[idx] = {
    ...list[idx],
    name: body.name ?? list[idx].name,
    sku: body.sku ?? list[idx].sku,
    category: body.category ?? list[idx].category,
    warehouseId: body.warehouseId ?? list[idx].warehouseId,
    qty: body.qty !== undefined ? Number(body.qty) : list[idx].qty,
    reorderPoint: body.reorderPoint !== undefined ? Number(body.reorderPoint) : list[idx].reorderPoint,
    unit: body.unit ?? list[idx].unit,
    cost: body.cost !== undefined ? parseFloat(body.cost) : list[idx].cost,
    notes: body.notes ?? list[idx].notes,
    updatedAt: new Date().toISOString(),
  };
  await saveList("inventory", list);
  return c.json({ ...list[idx], status: itemStatus(list[idx].qty, list[idx].reorderPoint) });
});

app.delete(`${PREFIX}/inventory/:id`, async (c) => {
  const id = c.req.param("id");
  let list = await getList("inventory");
  if (!list.some(i => i.id === id)) return c.json({ error: "Not found" }, 404);
  list = list.filter(i => i.id !== id);
  await saveList("inventory", list);
  return c.json({ ok: true });
});

// Adjust qty (stock in/out)
app.post(`${PREFIX}/inventory/:id/adjust`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const list = await getList("inventory");
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return c.json({ error: "Not found" }, 404);
  const delta = Number(body.delta) || 0;
  list[idx].qty = Math.max(0, list[idx].qty + delta);
  list[idx].updatedAt = new Date().toISOString();
  await saveList("inventory", list);
  return c.json({ ...list[idx], status: itemStatus(list[idx].qty, list[idx].reorderPoint) });
});

// ── Transfers ─────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/transfers`, async (c) => {
  let list = await getList("transfers");
  if (list.length === 0) {
    list = SEED_TRANSFERS;
    await saveList("transfers", list);
  }
  return c.json([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.post(`${PREFIX}/transfers`, async (c) => {
  const body = await c.req.json();

  // Validate inventory qty
  const inventory = await getList("inventory");
  const itemIdx = inventory.findIndex(i => i.id === body.itemId);
  if (itemIdx === -1) return c.json({ error: "Inventory item not found" }, 404);
  if (inventory[itemIdx].warehouseId !== body.fromWarehouseId) {
    return c.json({ error: "Item is not stored in the source warehouse" }, 400);
  }
  if (inventory[itemIdx].qty < Number(body.qty)) {
    return c.json({ error: `Insufficient stock. Available: ${inventory[itemIdx].qty}` }, 400);
  }

  const transfers = await getList("transfers");
  const trf = {
    id: genId("TRF"),
    itemId: body.itemId,
    itemName: inventory[itemIdx].name,
    fromWarehouseId: body.fromWarehouseId,
    toWarehouseId: body.toWarehouseId,
    qty: Number(body.qty),
    date: new Date().toISOString().slice(0, 10),
    status: "pending",
    initiator: body.initiator ?? "System",
    notes: body.notes ?? "",
    createdAt: new Date().toISOString(),
  };

  // Deduct from source immediately (in_transit approach)
  inventory[itemIdx].qty -= trf.qty;
  inventory[itemIdx].updatedAt = new Date().toISOString();

  transfers.push(trf);
  await saveList("transfers", transfers);
  await saveList("inventory", inventory);
  return c.json(trf, 201);
});

app.put(`${PREFIX}/transfers/:id`, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const transfers = await getList("transfers");
  const idx = transfers.findIndex(t => t.id === id);
  if (idx === -1) return c.json({ error: "Not found" }, 404);

  const prev = transfers[idx];
  const newStatus = body.status;

  // Handle inventory changes on status transition
  if (newStatus && newStatus !== prev.status) {
    const inventory = await getList("inventory");

    if (newStatus === "completed" && prev.status === "in_transit") {
      // Add qty to destination warehouse item (or create new record)
      const destIdx = inventory.findIndex(i => i.id === prev.itemId && i.warehouseId === prev.toWarehouseId);
      if (destIdx >= 0) {
        inventory[destIdx].qty += prev.qty;
        inventory[destIdx].updatedAt = new Date().toISOString();
      } else {
        // Create a new inventory entry in the destination warehouse
        const srcItem = inventory.find(i => i.id === prev.itemId);
        if (srcItem) {
          inventory.push({
            ...srcItem,
            id: genId("INV"),
            warehouseId: prev.toWarehouseId,
            qty: prev.qty,
            createdAt: new Date().toISOString(),
          });
        }
      }
      await saveList("inventory", inventory);
    } else if (newStatus === "cancelled" && (prev.status === "pending" || prev.status === "in_transit")) {
      // Restore qty to source
      const srcIdx = inventory.findIndex(i => i.id === prev.itemId && i.warehouseId === prev.fromWarehouseId);
      if (srcIdx >= 0) {
        inventory[srcIdx].qty += prev.qty;
        inventory[srcIdx].updatedAt = new Date().toISOString();
      }
      await saveList("inventory", inventory);
    } else if (newStatus === "in_transit" && prev.status === "pending") {
      // Already deducted on creation — no change needed
    }
  }

  transfers[idx] = { ...transfers[idx], ...body, id, updatedAt: new Date().toISOString() };
  await saveList("transfers", transfers);
  return c.json(transfers[idx]);
});

app.delete(`${PREFIX}/transfers/:id`, async (c) => {
  const id = c.req.param("id");
  let transfers = await getList("transfers");
  const trf = transfers.find(t => t.id === id);
  if (!trf) return c.json({ error: "Not found" }, 404);

  // Restore qty if not completed/cancelled
  if (trf.status !== "completed" && trf.status !== "cancelled") {
    const inventory = await getList("inventory");
    const srcIdx = inventory.findIndex(i => i.id === trf.itemId && i.warehouseId === trf.fromWarehouseId);
    if (srcIdx >= 0) {
      inventory[srcIdx].qty += trf.qty;
      await saveList("inventory", inventory);
    }
  }

  transfers = transfers.filter(t => t.id !== id);
  await saveList("transfers", transfers);
  return c.json({ ok: true });
});

Deno.serve(app.fetch);
