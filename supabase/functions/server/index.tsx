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
// Seed functionality removed - users should add data via API

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
  const list = await getList("warehouses");
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
  const list = await getList("inventory");
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
  const list = await getList("transfers");
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
