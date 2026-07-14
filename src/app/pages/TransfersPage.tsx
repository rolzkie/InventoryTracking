import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Search, Plus, Loader2, ArrowLeftRight, CheckCircle, Clock, Trash2, XCircle } from "lucide-react";
import type { Transfer, Warehouse as WH, InventoryItem } from "../../lib/api";
import { api } from "../../lib/api";
import { ConfirmDialog, FormField, inputCls, LoadingRow, Modal, EmptyRow, selectCls, StatusBadge, toast } from "../components/ui";

function TransferModal({ warehouses, inventory, onClose, onSaved }: { warehouses: WH[]; inventory: InventoryItem[]; onClose: () => void; onSaved: (t: Transfer) => void }) {
  const [form, setForm] = useState({ itemId: "", fromWarehouseId: "", toWarehouseId: "", qty: "", notes: "", initiator: "Sarah Chen" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedItem = inventory.find((i) => i.id === form.itemId);
  const filteredItems = inventory.filter((i) => !form.fromWarehouseId || i.warehouseId === form.fromWarehouseId);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.itemId) e.itemId = "Required";
    if (!form.fromWarehouseId) e.fromWarehouseId = "Required";
    if (!form.toWarehouseId) e.toWarehouseId = "Required";
    if (form.fromWarehouseId === form.toWarehouseId) e.toWarehouseId = "Destination must differ from source";
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) <= 0) e.qty = "Must be > 0";
    if (selectedItem && Number(form.qty) > selectedItem.quantity) e.qty = `Max available: ${selectedItem.quantity}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="From Warehouse" required error={errors.fromWarehouseId}>
            <select className={selectCls} value={form.fromWarehouseId} onChange={(e) => setForm((f) => ({ ...f, fromWarehouseId: e.target.value, itemId: "" }))}>
              <option value="">Select</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="To Warehouse" required error={errors.toWarehouseId}>
            <select className={selectCls} value={form.toWarehouseId} onChange={(e) => setForm((f) => ({ ...f, toWarehouseId: e.target.value }))}>
              <option value="">Select</option>
              {warehouses.filter((w) => w.id !== form.fromWarehouseId).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Item" required error={errors.itemId}>
          <select className={selectCls} value={form.itemId} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}>
            <option value="">Select item</option>
            {filteredItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.quantity} {i.unit} available)
              </option>
            ))}
          </select>
        </FormField>

        {selectedItem && (
          <div className="bg-muted/50 rounded-lg px-3 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Available stock</span>
            <span className="font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {selectedItem.quantity} {selectedItem.unit}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Quantity" required error={errors.qty}>
            <input
              className={inputCls}
              type="number"
              min="1"
              max={selectedItem?.quantity}
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            />
          </FormField>
          <FormField label="Initiated By">
            <input className={inputCls} value={form.initiator} onChange={(e) => setForm((f) => ({ ...f, initiator: e.target.value }))} />
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
        </FormField>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <ArrowLeftRight size={12} />}
            {saving ? "Creating..." : "Create Transfer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function TransfersPage({ warehouses, inventory }: { warehouses: WH[]; inventory: InventoryItem[] }) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [confirm, setConfirm] = useState<{ transfer: Transfer; newStatus: Transfer["status"] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTransfers(await api.transfers.list());
    } catch {
      toast("error", "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const whMap = useMemo(() => Object.fromEntries(warehouses.map((w) => [w.id, w])), [warehouses]);
  const availableInventory = useMemo(
    () => [...inventory].filter((item) => item.quantity > 0).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)),
    [inventory]
  );

  const filtered = transfers.filter((t) => {
    const q = search.toLowerCase();
    const match = !q || t.id.toLowerCase().includes(q) || t.itemName.toLowerCase().includes(q);
    return match && (filterStatus === "all" || t.status === filterStatus);
  });

  async function updateStatus(t: Transfer, status: Transfer["status"] | "cancelled") {
    try {
      const updated = await api.transfers.update(t.id, { status });
      setTransfers((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      toast("success", `Transfer marked as ${status.replace("_", " ")}`);
    } catch (err: any) {
      toast("error", err.message ?? "Update failed");
    }
    setConfirm(null);
  }

  async function handleDelete(t: Transfer) {
    try {
      await api.transfers.delete(t.id);
      setTransfers((prev) => prev.filter((x) => x.id !== t.id));
      toast("success", "Transfer deleted");
    } catch (err: any) {
      toast("error", err.message ?? "Delete failed");
    }
  }

  const statusIcon: Record<string, JSX.Element> = {
    completed: <CheckCircle size={12} className="text-emerald-400" />,
    in_transit: <Clock size={12} className="text-blue-400" />,
    pending: <Clock size={12} className="text-amber-400" />,
    cancelled: <XCircle size={12} className="text-red-400" />,
  };

  const nextStatuses: Record<Transfer["status"], Transfer["status"][]> = {
    pending: ["in_transit", "cancelled"],
    in_transit: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:flex-1 sm:min-w-[12rem] sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transfer ID or item..." className={`${inputCls} pl-9`} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${selectCls} w-auto`}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Loader2 size={13} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={13} /> New Transfer
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Available to transfer</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Current stock ready for a new transfer request.</p>
          </div>
          <span className="text-[11px] text-muted-foreground">{availableInventory.length} items</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {availableInventory.length === 0 ? (
            <div className="text-xs text-muted-foreground">No stock is currently available for transfer.</div>
          ) : (
            availableInventory.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate" title={whMap[item.warehouseId]?.location ?? ""}>
                      {whMap[item.warehouseId]?.name ?? item.warehouseId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.quantity}</p>
                    <p className="text-[11px] text-muted-foreground">{item.unit}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-[11px] text-muted-foreground">SKU {item.sku}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Transfer ID", "Item", "From", "To", "Qty", "Initiator", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRow cols={9} />
              ) : filtered.length === 0 ? (
                <EmptyRow cols={9} message="No transfers found" />
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-primary" style={{ fontFamily: "JetBrains Mono, monospace" }}>{t.id}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[140px] truncate">{t.itemName}</td>
                    <td className="px-4 py-3" title={whMap[t.fromWarehouseId] ? `${whMap[t.fromWarehouseId].name} — ${whMap[t.fromWarehouseId].location}` : t.fromWarehouseId}>
                      <div className="max-w-[160px]">
                        <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: "JetBrains Mono, monospace" }}>{whMap[t.fromWarehouseId]?.name ?? t.fromWarehouseId}</p>
                        {whMap[t.fromWarehouseId]?.location && <p className="text-[11px] text-muted-foreground truncate">{whMap[t.fromWarehouseId].location}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3" title={whMap[t.toWarehouseId] ? `${whMap[t.toWarehouseId].name} — ${whMap[t.toWarehouseId].location}` : t.toWarehouseId}>
                      <div className="max-w-[160px]">
                        <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: "JetBrains Mono, monospace" }}>{whMap[t.toWarehouseId]?.name ?? t.toWarehouseId}</p>
                        {whMap[t.toWarehouseId]?.location && <p className="text-[11px] text-muted-foreground truncate">{whMap[t.toWarehouseId].location}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>×{t.quantity}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.initiator}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{t.date}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5">{statusIcon[t.status]}<StatusBadge status={t.status} /></div></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {nextStatuses[t.status]?.map((s) => (
                          <button
                            key={s}
                            onClick={() => setConfirm({ transfer: t, newStatus: s })}
                            title={`Mark ${s.replace("_", " ")}`}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              s === "cancelled"
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : s === "completed"
                                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            }`}
                          >
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
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <TransferModal warehouses={warehouses} inventory={inventory} onClose={() => setShowAdd(false)} onSaved={(t) => setTransfers((prev) => [t, ...prev])} />}
      {confirm && (
        <ConfirmDialog
          title="Update Transfer Status"
          message={`Mark transfer ${confirm.transfer.id} as "${confirm.newStatus.replace("_", " ")}"?`}
          onConfirm={() => updateStatus(confirm.transfer, confirm.newStatus)}
          onCancel={() => setConfirm(null)}
          danger={confirm.newStatus === "cancelled"}
        />
      )}
    </div>
  );
}
