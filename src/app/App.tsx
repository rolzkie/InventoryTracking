import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, Package, Warehouse, ArrowLeftRight, BarChart3,
  Bell, Search, ChevronDown, AlertTriangle, Plus, Download,
  Eye, Edit, Trash2, Menu, CheckCircle, Clock, XCircle, Box,
  Users, Settings, LogOut, ArrowUp, ArrowDown, X, RefreshCw,
  Save, Loader2, TrendingUp, Filter, ChevronLeft, ChevronRight,
  Minus, AlertCircle, Check
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { api, type InventoryItem, type Warehouse as WH, type Transfer, type DashboardStats, CATEGORIES, UNITS } from "../lib/api";
import { initializeSeedData } from "../lib/seed-data";

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Toast = { id: string; type: "success" | "error" | "info"; message: string };
let toastSetter: ((fn: (t: Toast[]) => Toast[]) => void) | null = null;

function toast(type: Toast["type"], message: string) {
  const id = Math.random().toString(36).slice(2);
  toastSetter?.((prev) => [...prev, { id, type, message }]);
  setTimeout(() => toastSetter?.((prev) => prev.filter(t => t.id !== id)), 3500);
}

function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { toastSetter = setToasts; return () => { toastSetter = null; }; }, []);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border pointer-events-auto ${
          t.type === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
          : t.type === "error" ? "bg-red-500/15 border-red-500/30 text-red-300"
          : "bg-blue-500/15 border-blue-500/30 text-blue-300"
        }`}>
          {t.type === "success" ? <Check size={13} /> : t.type === "error" ? <AlertCircle size={13} /> : <AlertCircle size={13} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// â”€â”€ Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-card border border-border rounded-xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30";
const selectCls = `${inputCls} cursor-pointer`;

// â”€â”€ Confirm Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ConfirmDialog({ title, message, onConfirm, onCancel, danger }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-5 flex flex-col gap-5">
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-xs rounded-lg text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}>
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}

// â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_stock:     { label: "In Stock",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    low_stock:    { label: "Low Stock",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    out_of_stock: { label: "Out of Stock",cls: "bg-red-500/15 text-red-400 border-red-500/20" },
    completed:    { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    in_transit:   { label: "In Transit",  cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    pending:      { label: "Pending",     cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    cancelled:    { label: "Cancelled",   cls: "bg-red-500/15 text-red-400 border-red-500/20" },
    active:       { label: "Active",      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    near_full:    { label: "Near Full",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-500/15 text-slate-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}
      style={{ fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
  );
}

// â”€â”€ KPI Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KpiCard({ icon: Icon, label, value, delta, sub, color }: {
  icon: any; label: string; value: string | number; delta?: number; sub?: string; color: string;
}) {
  const pos = (delta ?? 0) >= 0;
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${pos ? "text-emerald-400" : "text-red-400"}`}
            style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {pos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(delta)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
        {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs">Loading dataâ€¦</span>
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Package size={28} className="opacity-30" />
          <span className="text-xs">{message}</span>
        </div>
      </td>
    </tr>
  );
}

// â”€â”€ Inventory Item Modal (Add / Edit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type InvForm = { name: string; sku: string; category: string; warehouseId: string; qty: string; reorderPoint: string; unit: string; cost: string; notes: string };

function InventoryModal({ item, warehouses, onClose, onSaved }: {
  item?: InventoryItem; warehouses: WH[]; onClose: () => void; onSaved: (item: InventoryItem) => void;
}) {
  const editing = !!item;
  const [form, setForm] = useState<InvForm>({
    name: item?.name ?? "",
    sku: item?.sku ?? "",
    category: item?.category ?? CATEGORIES[0],
    warehouseId: item?.warehouseId ?? (warehouses[0]?.id ?? ""),
    qty: String(item?.qty ?? 0),
    reorderPoint: String(item?.reorderPoint ?? 50),
    unit: item?.unit ?? UNITS[0],
    cost: String(item?.cost ?? ""),
    notes: item?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<InvForm>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof InvForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const e: Partial<InvForm> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.sku.trim()) e.sku = "Required";
    if (!form.warehouseId) e.warehouseId = "Required";
    if (isNaN(Number(form.qty)) || Number(form.qty) < 0) e.qty = "Must be â‰¥ 0";
    if (isNaN(Number(form.reorderPoint)) || Number(form.reorderPoint) < 0) e.reorderPoint = "Must be â‰¥ 0";
    if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0) e.cost = "Must be a valid positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, qty: Number(form.qty), reorderPoint: Number(form.reorderPoint), cost: parseFloat(form.cost) };
      const saved = editing
        ? await api.inventory.update(item!.id, payload)
        : await api.inventory.create(payload);
      toast("success", editing ? "Item updated successfully" : "Item added to inventory");
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Item Name" required error={errors.name}>
            <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Circuit Board v3.2" />
          </FormField>
          <FormField label="SKU" required error={errors.sku}>
            <input className={inputCls} value={form.sku} onChange={set("sku")} placeholder="e.g. CB-3200" style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" required>
            <select className={selectCls} value={form.category} onChange={set("category")}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Warehouse" required error={errors.warehouseId}>
            <select className={selectCls} value={form.warehouseId} onChange={set("warehouseId")}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Quantity" required error={errors.qty}>
            <input className={inputCls} type="number" min="0" value={form.qty} onChange={set("qty")} style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
          <FormField label="Reorder Point" required error={errors.reorderPoint}>
            <input className={inputCls} type="number" min="0" value={form.reorderPoint} onChange={set("reorderPoint")} style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
          <FormField label="Unit" required>
            <select className={selectCls} value={form.unit} onChange={set("unit")}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Unit Cost (USD)" required error={errors.cost}>
          <input className={inputCls} type="number" step="0.01" min="0" value={form.cost} onChange={set("cost")} placeholder="0.00" style={{ fontFamily: "JetBrains Mono, monospace" }} />
        </FormField>
        <FormField label="Notes">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional notes..." />
        </FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Savingâ€¦" : editing ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// â”€â”€ Adjust Qty Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AdjustModal({ item, onClose, onAdjusted }: { item: InventoryItem; onClose: () => void; onAdjusted: (item: InventoryItem) => void }) {
  const [delta, setDelta] = useState("");
  const [type, setType] = useState<"add" | "remove">("add");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(delta);
    if (!delta || isNaN(n) || n <= 0) { toast("error", "Enter a valid positive number"); return; }
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

  const preview = type === "add" ? item.qty + Number(delta || 0) : Math.max(0, item.qty - Number(delta || 0));

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
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.qty} <span className="text-xs text-muted-foreground">{item.unit}</span></p>
          </div>
        </div>

        <div className="flex gap-2">
          {(["add", "remove"] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-colors ${type === t ? (t === "add" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-red-500/15 border-red-500/40 text-red-400") : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t === "add" ? <Plus size={12} /> : <Minus size={12} />}
              {t === "add" ? "Stock In" : "Stock Out"}
            </button>
          ))}
        </div>

        <FormField label="Quantity to Adjust">
          <input className={inputCls} type="number" min="1" value={delta} onChange={e => setDelta(e.target.value)} placeholder="Enter amount" style={{ fontFamily: "JetBrains Mono, monospace" }} />
        </FormField>

        {delta && Number(delta) > 0 && (
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${type === "add" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            <span className="text-muted-foreground">New quantity</span>
            <span className={`font-bold ${type === "add" ? "text-emerald-400" : "text-red-400"}`}
              style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {preview} {item.unit}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg text-white disabled:opacity-50 transition-colors ${type === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : (type === "add" ? <Plus size={12} /> : <Minus size={12} />)}
            {saving ? "Savingâ€¦" : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// â”€â”€ View Item Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ViewItemModal({ item, warehouse, onClose, onEdit }: { item: InventoryItem; warehouse?: WH; onClose: () => void; onEdit: () => void }) {
  const fields = [
    ["SKU", item.sku], ["Category", item.category], ["Warehouse", item.warehouseName ?? item.warehouseId],
    ["Quantity", `${item.qty} ${item.unit}`], ["Reorder Point", `${item.reorderPoint} ${item.unit}`],
    ["Unit Cost", `$${item.cost.toFixed(2)}`], ["Total Value", `$${(item.qty * item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ["Created", new Date(item.createdAt).toLocaleDateString()],
  ];
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
              <p className="text-xs font-medium text-foreground mt-0.5" style={k === "SKU" ? { fontFamily: "JetBrains Mono, monospace" } : {}}>
                {v}
              </p>
            </div>
          ))}
        </div>
        {item.notes && (
          <div className="bg-muted/50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-xs text-foreground mt-0.5">{item.notes}</p>
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

// â”€â”€ Warehouse Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type WHForm = { name: string; location: string; capacity: string; manager: string };

function WarehouseModal({ wh, onClose, onSaved }: { wh?: WH; onClose: () => void; onSaved: (w: WH) => void }) {
  const editing = !!wh;
  const [form, setForm] = useState<WHForm>({ name: wh?.name ?? "", location: wh?.location ?? "", capacity: String(wh?.capacity ?? ""), manager: wh?.manager ?? "" });
  const [errors, setErrors] = useState<Partial<WHForm>>({});
  const [saving, setSaving] = useState(false);

  const set = (f: keyof WHForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  function validate() {
    const e: Partial<WHForm> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.location.trim()) e.location = "Required";
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) e.capacity = "Must be > 0";
    if (!form.manager.trim()) e.manager = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      const saved = editing ? await api.warehouses.update(wh!.id, payload) : await api.warehouses.create(payload);
      toast("success", editing ? "Warehouse updated" : "Warehouse added");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast("error", err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? "Edit Warehouse" : "Add Warehouse"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <FormField label="Warehouse Name" required error={errors.name}>
          <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Alpha Distribution Center" />
        </FormField>
        <FormField label="Location" required error={errors.location}>
          <input className={inputCls} value={form.location} onChange={set("location")} placeholder="e.g. Portland, OR" />
        </FormField>
        <FormField label="Total Capacity (units)" required error={errors.capacity}>
          <input className={inputCls} type="number" min="1" value={form.capacity} onChange={set("capacity")} style={{ fontFamily: "JetBrains Mono, monospace" }} />
        </FormField>
        <FormField label="Manager" required error={errors.manager}>
          <input className={inputCls} value={form.manager} onChange={set("manager")} placeholder="e.g. Sarah Chen" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Savingâ€¦" : editing ? "Save Changes" : "Add Warehouse"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// â”€â”€ Transfer Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TransferModal({ warehouses, inventory, onClose, onSaved }: {
  warehouses: WH[]; inventory: InventoryItem[]; onClose: () => void; onSaved: (t: Transfer) => void;
}) {
  const [form, setForm] = useState({ itemId: "", fromWarehouseId: "", toWarehouseId: "", qty: "", notes: "", initiator: "Sarah Chen" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedItem = inventory.find(i => i.id === form.itemId);
  const filteredItems = inventory.filter(i => !form.fromWarehouseId || i.warehouseId === form.fromWarehouseId);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.itemId) e.itemId = "Required";
    if (!form.fromWarehouseId) e.fromWarehouseId = "Required";
    if (!form.toWarehouseId) e.toWarehouseId = "Required";
    if (form.fromWarehouseId === form.toWarehouseId) e.toWarehouseId = "Destination must differ from source";
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) <= 0) e.qty = "Must be > 0";
    if (selectedItem && Number(form.qty) > selectedItem.qty) e.qty = `Max available: ${selectedItem.qty}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = await api.transfers.create({ ...form, qty: Number(form.qty) });
      toast("success", "Transfer created successfully");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast("error", err.message ?? "Failed to create transfer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Transfer" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="From Warehouse" required error={errors.fromWarehouseId}>
            <select className={selectCls} value={form.fromWarehouseId} onChange={e => setForm(f => ({ ...f, fromWarehouseId: e.target.value, itemId: "" }))}>
              <option value="">â€” Select â€”</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </FormField>
          <FormField label="To Warehouse" required error={errors.toWarehouseId}>
            <select className={selectCls} value={form.toWarehouseId} onChange={e => setForm(f => ({ ...f, toWarehouseId: e.target.value }))}>
              <option value="">â€” Select â€”</option>
              {warehouses.filter(w => w.id !== form.fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Item" required error={errors.itemId}>
          <select className={selectCls} value={form.itemId} onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}>
            <option value="">â€” Select item â€”</option>
            {filteredItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.qty} {i.unit} available)</option>)}
          </select>
        </FormField>
        {selectedItem && (
          <div className="bg-muted/50 rounded-lg px-3 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Available stock</span>
            <span className="font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{selectedItem.qty} {selectedItem.unit}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Quantity" required error={errors.qty}>
            <input className={inputCls} type="number" min="1" max={selectedItem?.qty} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
          <FormField label="Initiated By">
            <input className={inputCls} value={form.initiator} onChange={e => setForm(f => ({ ...f, initiator: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notesâ€¦" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <ArrowLeftRight size={12} />}
            {saving ? "Creatingâ€¦" : "Create Transfer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// â”€â”€ Dashboard Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CHART_DATA = [
  { month: "Jan", inbound: 1800, outbound: 1200 },
  { month: "Feb", inbound: 2100, outbound: 1600 },
  { month: "Mar", inbound: 2400, outbound: 1900 },
  { month: "Apr", inbound: 1600, outbound: 2200 },
  { month: "May", inbound: 3100, outbound: 2100 },
  { month: "Jun", inbound: 2700, outbound: 1800 },
  { month: "Jul", inbound: 3400, outbound: 2600 },
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

function Dashboard({ stats, onNavigate }: { stats: DashboardStats | null; onNavigate: (p: Page) => void }) {
  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-xs">Loading dashboardâ€¦</span>
      </div>
    </div>
  );

  const catData = [
    { name: "Electronics", value: 34 },
    { name: "Hardware", value: 22 },
    { name: "Chemicals", value: 18 },
    { name: "Packaging", value: 15 },
    { name: "Raw Materials", value: 11 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total SKUs" value={stats.totalSkus} sub="Active items" color="bg-blue-500/15 text-blue-400" />
        <KpiCard icon={Warehouse} label="Warehouses" value={stats.warehouseCount} sub="All operational" color="bg-purple-500/15 text-purple-400" />
        <KpiCard icon={AlertTriangle} label="Stock Alerts" value={stats.lowStock + stats.outOfStock}
          sub={`${stats.outOfStock} out Â· ${stats.lowStock} low`} color="bg-amber-500/15 text-amber-400" />
        <KpiCard icon={TrendingUp} label="Total Value" value={`$${(stats.totalValue / 1000).toFixed(0)}k`}
          sub="Inventory value" color="bg-emerald-500/15 text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Stock Movement</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Inbound vs outbound â€” last 7 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Inbound</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Outbound</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1c2230", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} fill="url(#inG)" name="Inbound" />
              <Area type="monotone" dataKey="outbound" stroke="#10b981" strokeWidth={2} fill="url(#outG)" name="Outbound" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">By Category</h3>
          <p className="text-xs text-muted-foreground mb-3">Distribution</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1c2230", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {catData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="text-foreground font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.alerts.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" /> Stock Alerts
            </h3>
            <button onClick={() => onNavigate("inventory")} className="text-xs text-primary hover:underline">View all â†’</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {stats.alerts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${a.alertType === "out_of_stock" ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                <div>
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "JetBrains Mono, monospace" }}>{a.sku} Â· {a.warehouseId}</p>
                </div>
                <StatusBadge status={a.alertType} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Inventory Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PAGE_SIZE = 8;
type InvModal = { type: "add" } | { type: "edit"; item: InventoryItem } | { type: "view"; item: InventoryItem } | { type: "adjust"; item: InventoryItem } | { type: "delete"; item: InventoryItem };

function InventoryPage({ warehouses }: { warehouses: WH[] }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<InvModal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await api.inventory.list();
      setItems(data);
    } catch { toast("error", "Failed to load inventory"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    const matchCat = filterCategory === "all" || i.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterStatus, filterCategory]);

  const whMap = Object.fromEntries(warehouses.map(w => [w.id, w]));

  async function handleDelete(item: InventoryItem) {
    try {
      await api.inventory.delete(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast("success", "Item deleted");
    } catch (err: any) { toast("error", err.message ?? "Delete failed"); }
    setModal(null);
  }

  function handleSaved(saved: InventoryItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      return idx >= 0 ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved];
    });
  }

  async function exportCsv() {
    const rows = [["ID", "Name", "SKU", "Category", "Warehouse", "Qty", "Reorder Point", "Unit", "Cost", "Status"]];
    items.forEach(i => rows.push([i.id, i.name, i.sku, i.category, i.warehouseName ?? i.warehouseId, String(i.qty), String(i.reorderPoint), i.unit, String(i.cost), i.status]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "CSV exported");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, SKU, categoryâ€¦"
            className={`${inputCls} pl-9`} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${selectCls} w-auto`}>
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${selectCls} w-auto`}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => load(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <Download size={13} /> Export
        </button>
        <button onClick={() => setModal({ type: "add" })} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={13} /> Add Item
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "Total", value: items.length, cls: "text-foreground" },
          { label: "In Stock", value: items.filter(i => i.status === "in_stock").length, cls: "text-emerald-400" },
          { label: "Low Stock", value: items.filter(i => i.status === "low_stock").length, cls: "text-amber-400" },
          { label: "Out of Stock", value: items.filter(i => i.status === "out_of_stock").length, cls: "text-red-400" },
        ].map(p => (
          <div key={p.label} className="bg-card border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{p.label}</span>
            <span className={`text-xs font-bold ${p.cls}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Item / SKU", "Category", "Warehouse", "Qty on Hand", "Reorder Pt.", "Unit Cost", "Total Value", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow cols={9} /> : pageItems.length === 0 ? <EmptyRow cols={9} message="No items match your filters" /> :
                pageItems.map(item => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {whMap[item.warehouseId]?.name?.split(" ")[0] ?? item.warehouseId}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${item.qty === 0 ? "text-red-400" : item.qty < item.reorderPoint ? "text-amber-400" : "text-foreground"}`}
                        style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {item.qty.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${item.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      ${(item.qty * item.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setModal({ type: "view", item })} title="View"
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => setModal({ type: "adjust", item })} title="Adjust Stock"
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors">
                          <TrendingUp size={13} />
                        </button>
                        <button onClick={() => setModal({ type: "edit", item })} title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => setModal({ type: "delete", item })} title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}â€“{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
        {!loading && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filtered.length} items Â· Total value: <span className="text-foreground font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              ${filtered.reduce((s, i) => s + i.qty * i.cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span></p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "add" && <InventoryModal warehouses={warehouses} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "edit" && <InventoryModal item={modal.item} warehouses={warehouses} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "view" && (
        <ViewItemModal item={modal.item} warehouse={whMap[modal.item.warehouseId]} onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", item: modal.item })} />
      )}
      {modal?.type === "adjust" && <AdjustModal item={modal.item} onClose={() => setModal(null)} onAdjusted={handleSaved} />}
      {modal?.type === "delete" && (
        <ConfirmDialog title="Delete Item" danger
          message={`Are you sure you want to delete "${modal.item.name}" (${modal.item.sku})? This action cannot be undone.`}
          onConfirm={() => handleDelete(modal.item)} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}

// â”€â”€ Warehouses Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WarehousesPage({ warehouses, setWarehouses }: { warehouses: WH[]; setWarehouses: (w: WH[]) => void }) {
  const [modal, setModal] = useState<{ type: "add" } | { type: "edit"; wh: WH } | { type: "delete"; wh: WH } | null>(null);

  async function handleDelete(wh: WH) {
    try {
      await api.warehouses.delete(wh.id);
      setWarehouses(warehouses.filter(w => w.id !== wh.id));
      toast("success", "Warehouse deleted");
    } catch (err: any) { toast("error", err.message ?? "Delete failed"); }
    setModal(null);
  }

  function handleSaved(saved: WH) {
    const idx = warehouses.findIndex(w => w.id === saved.id);
    setWarehouses(idx >= 0 ? warehouses.map(w => w.id === saved.id ? saved : w) : [...warehouses, saved]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{warehouses.length} warehouses registered</p>
        <button onClick={() => setModal({ type: "add" })} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={13} /> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {warehouses.map(wh => {
          const pct = Math.round((wh.used / wh.capacity) * 100);
          return (
            <div key={wh.id} className="bg-card border border-border rounded-lg p-5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-primary font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>{wh.id}</span>
                    <StatusBadge status={wh.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{wh.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{wh.location}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal({ type: "edit", wh })} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => setModal({ type: "delete", wh })} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Capacity used</span>
                  <span className={`font-medium ${pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-emerald-400"}`}
                    style={{ fontFamily: "JetBrains Mono, monospace" }}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-1 text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  <span>{wh.used.toLocaleString()} used</span>
                  <span>{wh.capacity.toLocaleString()} total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{wh.manager}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-xs font-medium text-foreground mt-0.5 capitalize">{wh.status.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal?.type === "add" && <WarehouseModal onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "edit" && <WarehouseModal wh={modal.wh} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "delete" && (
        <ConfirmDialog title="Delete Warehouse" danger
          message={`Delete "${modal.wh.name}"? All inventory records linked to this warehouse will lose their warehouse reference.`}
          onConfirm={() => handleDelete(modal.wh)} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}

// â”€â”€ Transfers Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TransfersPage({ warehouses, inventory }: { warehouses: WH[]; inventory: InventoryItem[] }) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [confirm, setConfirm] = useState<{ transfer: Transfer; newStatus: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTransfers(await api.transfers.list()); }
    catch { toast("error", "Failed to load transfers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const whMap = Object.fromEntries(warehouses.map(w => [w.id, w.name]));

  const filtered = transfers.filter(t => {
    const q = search.toLowerCase();
    const match = !q || t.id.toLowerCase().includes(q) || t.itemName.toLowerCase().includes(q);
    return match && (filterStatus === "all" || t.status === filterStatus);
  });

  async function updateStatus(t: Transfer, status: string) {
    try {
      const updated = await api.transfers.update(t.id, { status });
      setTransfers(prev => prev.map(x => x.id === t.id ? updated : x));
      toast("success", `Transfer marked as ${status.replace("_", " ")}`);
    } catch (err: any) { toast("error", err.message ?? "Update failed"); }
    setConfirm(null);
  }

  async function handleDelete(t: Transfer) {
    try {
      await api.transfers.delete(t.id);
      setTransfers(prev => prev.filter(x => x.id !== t.id));
      toast("success", "Transfer deleted");
    } catch (err: any) { toast("error", err.message ?? "Delete failed"); }
  }

  const statusIcon: Record<string, any> = {
    completed: <CheckCircle size={12} className="text-emerald-400" />,
    in_transit: <Clock size={12} className="text-blue-400" />,
    pending: <Clock size={12} className="text-amber-400" />,
    cancelled: <XCircle size={12} className="text-red-400" />,
  };

  const nextStatuses: Record<string, string[]> = {
    pending: ["in_transit", "cancelled"],
    in_transit: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID or itemâ€¦" className={`${inputCls} pl-9`} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${selectCls} w-auto`}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex-1" />
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={13} />
        </button>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={13} /> New Transfer
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Transfer ID", "Item", "From", "To", "Qty", "Initiator", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow cols={9} /> : filtered.length === 0 ? <EmptyRow cols={9} message="No transfers found" /> :
                filtered.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-primary" style={{ fontFamily: "JetBrains Mono, monospace" }}>{t.id}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[140px] truncate">{t.itemName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {whMap[t.fromWarehouseId]?.split(" ")[0] ?? t.fromWarehouseId}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {whMap[t.toWarehouseId]?.split(" ")[0] ?? t.toWarehouseId}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>Ã—{t.qty}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.initiator}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{t.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">{statusIcon[t.status]}<StatusBadge status={t.status} /></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {nextStatuses[t.status]?.map(s => (
                          <button key={s} onClick={() => setConfirm({ transfer: t, newStatus: s })} title={`Mark ${s.replace("_", " ")}`}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${s === "cancelled" ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : s === "completed" ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"}`}>
                            {s === "in_transit" ? "Ship" : s === "completed" ? "Complete" : "Cancel"}
                          </button>
                        ))}
                        {(t.status === "pending" || t.status === "cancelled") && (
                          <button onClick={() => handleDelete(t)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/10">
            <p className="text-xs text-muted-foreground">{filtered.length} transfers Â· {transfers.filter(t => t.status === "in_transit").length} in transit</p>
          </div>
        )}
      </div>

      {showAdd && <TransferModal warehouses={warehouses} inventory={inventory} onClose={() => setShowAdd(false)}
        onSaved={t => setTransfers(prev => [t, ...prev])} />}

      {confirm && (
        <ConfirmDialog title="Update Transfer Status"
          message={`Mark transfer ${confirm.transfer.id} as "${confirm.newStatus.replace("_", " ")}"? This will update inventory quantities accordingly.`}
          onConfirm={() => updateStatus(confirm.transfer, confirm.newStatus)} onCancel={() => setConfirm(null)}
          danger={confirm.newStatus === "cancelled"} />
      )}
    </div>
  );
}

// â”€â”€ Reports Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ReportsPage({ inventory, warehouses }: { inventory: InventoryItem[]; warehouses: WH[] }) {
  const byWarehouse = warehouses.map(w => ({
    name: w.name.split(" ")[0],
    value: inventory.filter(i => i.warehouseId === w.id).reduce((s, i) => s + i.qty * i.cost, 0),
  })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);

  const totalValue = inventory.reduce((s, i) => s + i.qty * i.cost, 0);

  function exportInventory() {
    const rows = [["ID", "Name", "SKU", "Category", "Warehouse", "Qty", "Unit", "Cost", "Total Value", "Status"]];
    inventory.forEach(i => rows.push([i.id, i.name, i.sku, i.category, i.warehouseName ?? i.warehouseId, String(i.qty), i.unit, String(i.cost), String((i.qty * i.cost).toFixed(2)), i.status]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "Inventory report exported");
  }

  function exportLowStock() {
    const alerts = inventory.filter(i => i.status !== "in_stock");
    const rows = [["ID", "Name", "SKU", "Qty", "Reorder Point", "Status", "Warehouse"]];
    alerts.forEach(i => rows.push([i.id, i.name, i.sku, String(i.qty), String(i.reorderPoint), i.status, i.warehouseName ?? i.warehouseId]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `low-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "Low stock report exported");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Stock Movement (Monthly)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1c2230", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="inbound" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Inbound" />
              <Bar dataKey="outbound" fill="#10b981" radius={[3, 3, 0, 0]} name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Inventory Value by Warehouse</h3>
          <div className="flex flex-col gap-3">
            {byWarehouse.map(r => (
              <div key={r.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground font-medium">{r.name}</span>
                  <span className="text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(r.value / Math.max(...byWarehouse.map(x => x.value))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <span className="text-xs text-muted-foreground">Total inventory value</span>
            <span className="text-xs font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Inventory Summary", desc: "Full stock snapshot with valuations", action: exportInventory },
            { label: "Low Stock Report", desc: "Items below reorder threshold", action: exportLowStock },
            { label: "Warehouse Overview", desc: "Capacity and usage per facility", action: () => toast("info", "Coming soon") },
          ].map(r => (
            <button key={r.label} onClick={r.action}
              className="border border-border rounded-lg p-4 flex items-center justify-between hover:border-white/15 hover:bg-white/[0.02] transition-colors group text-left">
              <div>
                <p className="text-xs font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
              <Download size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Inventory Snapshot</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Category", "Items", "Total Qty", "Total Value", "Alerts"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const catItems = inventory.filter(i => i.category === cat);
                if (!catItems.length) return null;
                return (
                  <tr key={cat} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{cat}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{catItems.length}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{catItems.reduce((s, i) => s + i.qty, 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      ${catItems.reduce((s, i) => s + i.qty * i.cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {catItems.filter(i => i.status !== "in_stock").length > 0 ? (
                        <span className="text-xs text-amber-400" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {catItems.filter(i => i.status !== "in_stock").length} alert{catItems.filter(i => i.status !== "in_stock").length > 1 ? "s" : ""}
                        </span>
                      ) : <span className="text-xs text-emerald-400">OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Root App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Page = "dashboard" | "inventory" | "warehouses" | "transfers" | "reports";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "warehouses", label: "Warehouses", icon: Warehouse },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const initialized = useRef(false);

  const loadGlobal = useCallback(async () => {
    try {
      setGlobalError(null);
      const [whs, inv, st] = await Promise.all([api.warehouses.list(), api.inventory.list(), api.dashboard()]);
      setWarehouses(whs);
      setInventory(inv);
      setStats(st);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to load data";
      setGlobalError(msg);
      toast("error", msg);
    }
  }, []);


  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initializeSeedData();
    loadGlobal();
  }, [loadGlobal]);

  const alertCount = (stats?.lowStock ?? 0) + (stats?.outOfStock ?? 0);

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
      <Toaster />

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <Box size={14} className="text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">StockOS</span>
            <span className="text-xs text-muted-foreground block leading-none" style={{ fontFamily: "JetBrains Mono, monospace" }}>ERP v2.4</span>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground px-3 py-2 mt-1 tracking-wider">MAIN MENU</p>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            const badge = id === "inventory" ? alertCount : 0;
            return (
              <button key={id} onClick={() => { setPage(id as Page); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium transition-all ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}>
                <Icon size={15} className={active ? "text-primary" : ""} />
                {label}
                {badge > 0 && (
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded" style={{ fontFamily: "JetBrains Mono, monospace" }}>{badge}</span>
                )}
              </button>
            );
          })}
          <p className="text-xs font-medium text-muted-foreground px-3 py-2 mt-3 tracking-wider">SYSTEM</p>
          {[{ label: "Users", icon: Users }, { label: "Settings", icon: Settings }].map(({ label, icon: Icon }) => (
            <button key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all">
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/60 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">SC</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Sarah Chen</p>
              <p className="text-xs text-muted-foreground truncate">Warehouse Admin</p>
            </div>
            <LogOut size={13} className="text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-foreground capitalize">{page}</h1>
          <div className="flex-1" />
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Quick searchâ€¦" className={`${inputCls} pl-9 w-48`} />
          </div>
          <button onClick={loadGlobal} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors">
            <RefreshCw size={14} />
          </button>
          <div className="relative">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors">
              <Bell size={15} />
            </button>
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center"
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>{alertCount}</span>
            )}
          </div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">SC</div>
            <ChevronDown size={12} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {globalError ? (
            <div className="flex flex-col gap-3 bg-card border border-red-500/30 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-300">Failed to load data</p>
                  <p className="text-xs text-red-200/80 mt-1">{globalError}</p>
                </div>
                <button
                  onClick={loadGlobal}
                  className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  Retry
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Please check the API connection and database configuration.</p>
            </div>
          ) : (
            <>
              {page === "dashboard" && <Dashboard stats={stats} onNavigate={setPage} />}
              {page === "inventory" && <InventoryPage warehouses={warehouses} />}
              {page === "warehouses" && <WarehousesPage warehouses={warehouses} setWarehouses={setWarehouses} />}
              {page === "transfers" && <TransfersPage warehouses={warehouses} inventory={inventory} />}
              {page === "reports" && <ReportsPage inventory={inventory} warehouses={warehouses} />}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
