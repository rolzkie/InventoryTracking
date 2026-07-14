import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Download, Edit, Eye, TrendingUp, Trash2, Loader2, ChevronLeft, ChevronRight, Package, Minus, Save } from "lucide-react";
import type { InventoryItem, Warehouse as WH } from "../../lib/api";
import { api } from "../../lib/api";
import { ConfirmDialog, FormField, inputCls, LoadingRow, Modal, EmptyRow, selectCls, StatusBadge, toast } from "../components/ui";

const PAGE_SIZE = 8;

type InvModal =
  | { type: "add" }
  | { type: "edit"; item: InventoryItem }
  | { type: "view"; item: InventoryItem }
  | { type: "adjust"; item: InventoryItem }
  | { type: "delete"; item: InventoryItem };

type InvForm = {
  name: string;
  sku: string;
  category: string;
  reorderPoint: string;
  unit: string;
  unitPrice: string;
  description: string;
};

function InventoryModal({ item, warehouses, onClose, onSaved }: { item?: InventoryItem; warehouses: WH[]; onClose: () => void; onSaved: (item: InventoryItem) => void }) {
  const editing = !!item;
  const [form, setForm] = useState<InvForm>({
    name: item?.name ?? "",
    sku: item?.sku ?? "",
    category: item?.category ?? "",
    reorderPoint: String(item?.reorderPoint ?? 50),
    unit: item?.unit ?? "pcs",
    unitPrice: String(item?.unitPrice ?? item?.cost ?? ""),
    description: item?.description ?? item?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<InvForm>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof InvForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const e: Partial<InvForm> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.sku.trim()) e.sku = "Required";
    if (isNaN(Number(form.reorderPoint)) || Number(form.reorderPoint) < 0) e.reorderPoint = "Must be ≥ 0";
    if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 0) e.unitPrice = "Must be a valid positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        reorderPoint: Number(form.reorderPoint),
        unit: form.unit,
        unitPrice: Number(form.unitPrice),
        description: form.description.trim(),
      };
      const saved = editing
        ? await api.inventory.update(item!.id, payload)
        : await api.inventory.create(payload);
      toast("success", editing ? "Item updated successfully" : "Item created successfully. Assign this item to a warehouse before recording stock transactions.");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast("error", err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? "Edit Inventory Item" : "Add Inventory Item"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Item Name" required error={errors.name}>
            <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Circuit Board v3.2" />
          </FormField>
          <FormField label="SKU" required error={errors.sku}>
            <input className={inputCls} value={form.sku} onChange={set("sku")} placeholder="e.g. CB-3200" style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Category" required>
            <input className={inputCls} value={form.category} onChange={set("category")} />
          </FormField>
          <FormField label="Unit" required>
            <input className={inputCls} value={form.unit} onChange={set("unit")} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Reorder Point" required error={errors.reorderPoint}>
            <input className={inputCls} type="number" min="0" value={form.reorderPoint} onChange={set("reorderPoint")} style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
          <FormField label="Unit Price (USD)" required error={errors.unitPrice}>
            <input className={inputCls} type="number" step="0.01" min="0" value={form.unitPrice} onChange={set("unitPrice")} placeholder="0.00" style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={set("description")} placeholder="Optional description..." />
        </FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdjustModal({ item, onClose, onAdjusted }: { item: InventoryItem; onClose: () => void; onAdjusted: (item: InventoryItem) => void }) {
  const [delta, setDelta] = useState("");
  const [type, setType] = useState<"add" | "remove">("add");
  const [saving, setSaving] = useState(false);

  const currentQuantity = Number(item.quantity ?? item.qty ?? 0);
  const unitLabel = item.unit ?? "pcs";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(delta);
    if (!delta || isNaN(n) || n <= 0) {
      toast("error", "Enter a valid positive number");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.inventory.adjust(item.id, type === "add" ? n : -n);
      toast("success", `Stock ${type === "add" ? "added" : "removed"} successfully`);
      onAdjusted(updated);
      onClose();
    } catch (err: any) {
      toast("error", err.message ?? "Adjustment failed");
    } finally {
      setSaving(false);
    }
  }

  const preview = type === "add" ? currentQuantity + Number(delta || 0) : Math.max(0, currentQuantity - Number(delta || 0));

  return (
    <Modal title="Adjust Stock Quantity" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{currentQuantity} <span className="text-xs text-muted-foreground">{unitLabel}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["add", "remove"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-colors ${type === t ? (t === "add" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-red-500/15 border-red-500/40 text-red-400") : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t === "add" ? <Plus size={12} /> : <Minus size={12} />}
              {t === "add" ? "Stock In" : "Stock Out"}
            </button>
          ))}
        </div>
        <FormField label="Quantity to Adjust">
          <input className={inputCls} type="number" min="1" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="Enter amount" style={{ fontFamily: "JetBrains Mono, monospace" }} />
        </FormField>
        {delta && Number(delta) > 0 && (
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${type === "add" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            <span className="text-muted-foreground">New quantity</span>
            <span className={`font-bold ${type === "add" ? "text-emerald-400" : "text-red-400"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{preview} {unitLabel}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg text-white disabled:opacity-50 transition-colors ${type === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : type === "add" ? <Plus size={12} /> : <Minus size={12} />}
            {saving ? "Saving..." : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ViewItemModal({ item, warehouse, onClose, onEdit }: { item: InventoryItem; warehouse?: WH; onClose: () => void; onEdit: () => void }) {
  const quantity = Number(item.quantity ?? item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.cost ?? 0);
  const unitLabel = item.unit ?? "pcs";
  const createdDate = item.createdAt ?? item.lastRestocked ?? new Date().toISOString();

  const warehouseLabel = warehouse ? (warehouse.location ? `${warehouse.name} — ${warehouse.location}` : warehouse.name) : (item.warehouseName || "Unassigned");
  const fields = [
    ["SKU", item.sku],
    ["Category", item.category],
    ["Warehouse", warehouseLabel],
    ["Quantity", `${quantity} ${unitLabel}`],
    ["Reorder Point", `${item.reorderPoint} ${unitLabel}`],
    ["Unit Cost", `$${unitPrice.toFixed(2)}`],
    ["Total Value", `$${(quantity * unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ["Created", new Date(createdDate).toLocaleDateString()],
  ] as const;

  return (
    <Modal title="Item Details" onClose={onClose}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.sku}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {fields.map(([k, v]) => (
            <div key={k} className="bg-muted/50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-xs font-medium text-foreground mt-0.5" style={k === "SKU" ? { fontFamily: "JetBrains Mono, monospace" } : {}}>{v}</p>
            </div>
          ))}
        </div>
        {(item.description ?? item.notes) && (
          <div className="bg-muted/50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-xs text-foreground mt-0.5">{item.description ?? item.notes}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Close</button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Edit size={12} /> Edit Item
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InventoryPage({ warehouses, onRequestAssign }: { warehouses: WH[]; onRequestAssign: (id: string) => void; }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<InvModal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.inventory.list();
      setItems(data);
    } catch {
      toast("error", "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    const matchCat = filterCategory === "all" || i.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterCategory]);

  const whMap = Object.fromEntries(warehouses.map((w) => [w.id, w]));

  async function handleDelete(item: InventoryItem) {
    try {
      await api.inventory.delete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast("success", "Item deleted");
    } catch (err: any) {
      toast("error", err.message ?? "Delete failed");
    }
    setModal(null);
  }

  function handleSaved(saved: InventoryItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      return idx >= 0 ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved];
    });
  }

  async function exportCsv() {
    const rows = [["ID", "Name", "SKU", "Category", "Warehouse", "Qty", "Reorder Point", "Unit", "Cost", "Status"]];
    items.forEach((i) => rows.push([i.id, i.name, i.sku, i.category, i.warehouseName ?? i.warehouseId, String(i.qty), String(i.reorderPoint), i.unit, String(i.cost), i.status]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "CSV exported");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:flex-1 sm:min-w-[12rem] sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU, or category..." className={`${inputCls} pl-9`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${selectCls} w-auto`}>
            <option value="all">All Status</option>
            <option value="unassigned">Unassigned</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${selectCls} w-auto`}>
            <option value="all">All Categories</option>
            {Array.from(new Set(items.map((item) => item.category))).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Loader2 size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Download size={13} /> Export
          </button>
          <button onClick={() => setModal({ type: "add" })} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={13} /> Add Item
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "Total", value: items.length, cls: "text-foreground" },
          { label: "In Stock", value: items.filter((i) => i.status === "in_stock").length, cls: "text-emerald-400" },
          { label: "Low Stock", value: items.filter((i) => i.status === "low_stock").length, cls: "text-amber-400" },
          { label: "Out of Stock", value: items.filter((i) => i.status === "out_of_stock").length, cls: "text-red-400" },
        ].map((p) => (
          <div key={p.label} className="bg-card border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{p.label}</span>
            <span className={`text-xs font-bold ${p.cls}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{p.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                { ["Item / SKU", "Category", "Warehouse", "Qty on Hand", "Reorder Pt.", "Unit Cost", "Total Value", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                )) }
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow cols={9} /> : pageItems.length === 0 ? <EmptyRow cols={9} message="No items match your filters" /> :
                pageItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3" title={item.status === "unassigned" ? "Unassigned" : whMap[item.warehouseId] ? `${whMap[item.warehouseId].name} — ${whMap[item.warehouseId].location}` : item.warehouseName ?? item.warehouseId}>
                      <div className="max-w-[180px]">
                        <p className="text-xs font-medium text-foreground truncate" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.status === "unassigned" ? "Unassigned" : whMap[item.warehouseId]?.name ?? item.warehouseName ?? item.warehouseId}</p>
                        {item.status !== "unassigned" && whMap[item.warehouseId]?.location && (
                          <p className="text-[11px] text-muted-foreground truncate" title={whMap[item.warehouseId].location}>{whMap[item.warehouseId].location}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${item.quantity === 0 ? "text-red-400" : item.quantity < item.reorderPoint ? "text-amber-400" : "text-foreground"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.quantity.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setModal({ type: "view", item })} title="View" className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Eye size={13} /></button>
                        {item.status === "unassigned" ? (
                          <button onClick={() => onRequestAssign(item.id)} title="Assign Warehouse" className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-500/10 text-muted-foreground hover:text-slate-400 transition-colors"><Plus size={13} /></button>
                        ) : (
                          <button onClick={() => setModal({ type: "adjust", item })} title="Adjust Stock" className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors"><TrendingUp size={13} /></button>
                        )}
                        <button onClick={() => setModal({ type: "edit", item })} title="Edit" className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Edit size={13} /></button>
                        <button onClick={() => setModal({ type: "delete", item })} title="Delete" className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 transition-colors"><ChevronLeft size={13} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>{n}</button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 transition-colors"><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
        {!loading && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filtered.length} items • Total value: <span className="text-foreground font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>${filtered.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
          </div>
        )}
      </div>

      {modal?.type === "add" && <InventoryModal warehouses={warehouses} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "edit" && <InventoryModal item={modal.item} warehouses={warehouses} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "view" && <ViewItemModal item={modal.item} warehouse={whMap[modal.item.warehouseId]} onClose={() => setModal(null)} onEdit={() => setModal({ type: "edit", item: modal.item })} />}
      {modal?.type === "adjust" && <AdjustModal item={modal.item} onClose={() => setModal(null)} onAdjusted={handleSaved} />}
      {modal?.type === "delete" && (
        <ConfirmDialog title="Delete Item" danger message={`Are you sure you want to delete "${modal.item.name}" (${modal.item.sku})? This action cannot be undone."`} onConfirm={() => handleDelete(modal.item)} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}
