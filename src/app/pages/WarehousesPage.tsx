import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import type { InventoryItem, Warehouse as WH } from "../../lib/api";
import { api } from "../../lib/api";
import { ConfirmDialog, FormField, inputCls, Modal, StatusBadge, toast } from "../components/ui";

type WarehouseModalProps = { wh?: WH; onClose: () => void; onSaved: (w: WH) => void };

type AssignmentModalProps = { itemId?: string; warehouses: WH[]; inventory: InventoryItem[]; onClose: () => void; onAssigned: () => void };

function AssignmentModal({ itemId, warehouses, inventory, onClose, onAssigned }: AssignmentModalProps) {
  const [selectedItemId, setSelectedItemId] = useState(itemId ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [storageLocation, setStorageLocation] = useState("");
  const [zone, setZone] = useState("");
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [errors, setErrors] = useState<{ warehouseId?: string; storageLocation?: string; itemId?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (itemId) {
      setSelectedItemId(itemId);
    }
  }, [itemId]);

  const availableItems = inventory.sort((a, b) => a.name.localeCompare(b.name));

  function validate() {
    const e: typeof errors = {};
    if (!selectedItemId) e.itemId = "Item is required";
    if (!warehouseId) e.warehouseId = "Warehouse is required";
    if (storageLocation.length > 255) e.storageLocation = "Location must be 255 characters or fewer";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      await api.inventory.assign(selectedItemId, { warehouseId, storageLocation, zone, rack, shelf });
      toast("success", "Inventory item assigned successfully.");
      onAssigned();
      onClose();
    } catch (err: any) {
      toast("error", err.message ?? "Assignment failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Assign Inventory to Warehouse" onClose={onClose} wide>
      <form onSubmit={handleAssign} className="p-5 flex flex-col gap-4">
        <FormField label="Inventory Item" required error={errors.itemId}>
          <select className={inputCls} value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
            <option value="">Select an inventory item</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>{item.sku} — {item.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Warehouse" required error={errors.warehouseId}>
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">Select warehouse</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name} — {wh.location}</option>
            ))}
          </select>
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="Zone" error={errors.storageLocation}>
            <input className={inputCls} value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. A" />
          </FormField>
          <FormField label="Rack" error={errors.storageLocation}>
            <input className={inputCls} value={rack} onChange={(e) => setRack(e.target.value)} placeholder="e.g. R12" />
          </FormField>
          <FormField label="Shelf" error={errors.storageLocation}>
            <input className={inputCls} value={shelf} onChange={(e) => setShelf(e.target.value)} placeholder="e.g. S5" />
          </FormField>
        </div>
        <FormField label="Storage Location" error={errors.storageLocation}>
          <input className={inputCls} value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="e.g. Dock 2 / Bay 4" />
        </FormField>
        <div className="text-xs text-muted-foreground">Assigning this item to a warehouse is required before you can record stock transactions.</div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            {saving ? "Assigning..." : "Assign Warehouse"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WarehouseModal({ wh, onClose, onSaved }: WarehouseModalProps) {
  const editing = !!wh;
  const [form, setForm] = useState({
    name: wh?.name ?? "",
    location: wh?.location ?? "",
    capacity: String(wh?.capacity ?? ""),
    manager: wh?.manager ?? "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function validate() {
    const e: Partial<typeof form> = {};
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
    <Modal title={editing ? "Edit Warehouse" : "Add Warehouse"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <FormField label="Warehouse Name" required error={errors.name}>
          <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Portland Distribution" />
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
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Warehouse"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function WarehousesPage({ warehouses, setWarehouses, inventory = [], assignItemId, onClearAssign, onAssigned }: { warehouses: WH[]; setWarehouses: (w: WH[]) => void; inventory?: InventoryItem[]; assignItemId?: string | null; onClearAssign?: () => void; onAssigned?: () => void; }) {
  const [modal, setModal] = useState<{ type: "add" } | { type: "edit"; wh: WH } | { type: "delete"; wh: WH } | { type: "assign"; itemId?: string } | null>(null);
  const [search, setSearch] = useState("");

  const [assignmentPending, setAssignmentPending] = useState(false);

  useEffect(() => {
    if (assignItemId) {
      setModal({ type: "assign", itemId: assignItemId });
      setAssignmentPending(true);
    }
  }, [assignItemId]);

  const filteredWarehouses = warehouses.filter((wh) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [wh.name, wh.location, wh.manager].some((value) => value?.toLowerCase().includes(q));
  });

  async function handleDelete(wh: WH) {
    try {
      await api.warehouses.delete(wh.id);
      setWarehouses(warehouses.filter((w) => w.id !== wh.id));
      toast("success", "Warehouse deleted");
    } catch (err: any) {
      toast("error", err.message ?? "Delete failed");
    }
    setModal(null);
  }

  function handleSaved(saved: WH) {
    const idx = warehouses.findIndex((w) => w.id === saved.id);
    setWarehouses(idx >= 0 ? warehouses.map((w) => (w.id === saved.id ? saved : w)) : [...warehouses, saved]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{warehouses.length} warehouses registered</p>
        <div className="flex items-center gap-2">
          <label className="relative text-xs text-muted-foreground">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search warehouses" className="pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs" />
          </label>
          <button onClick={() => setModal({ type: "assign" })} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={13} /> Assign Item
          </button>
          <button onClick={() => setModal({ type: "add" })} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={13} /> Add Warehouse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredWarehouses.map((wh) => {
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
                  <button onClick={() => setModal({ type: "edit", wh })} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Edit size={13} /></button>
                  <button onClick={() => setModal({ type: "delete", wh })} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Capacity used</span>
                  <span className={`font-medium ${pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-emerald-400"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{pct}%</span>
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

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-foreground">Assigned items</p>
                  <p className="text-[11px] text-muted-foreground">{inventory.filter((item) => item.warehouseId === wh.id).length} items</p>
                </div>
                <div className="space-y-2">
                  {inventory.filter((item) => item.warehouseId === wh.id).length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No assigned items yet.</p>
                  ) : inventory.filter((item) => item.warehouseId === wh.id).map((item) => (
                    <div key={item.id} className="rounded-md border border-border bg-background/70 px-2.5 py-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-[10px] uppercase tracking-wide">Qty {item.quantity}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span>SKU {item.sku}</span>
                        <span>Zone {item.zone || "—"}</span>
                        <span>Rack {item.rack || "—"}</span>
                        <span>Shelf {item.shelf || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal?.type === "add" && <WarehouseModal onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "edit" && <WarehouseModal wh={modal.wh} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === "assign" && (
        <AssignmentModal itemId={modal.itemId} warehouses={warehouses} inventory={inventory} onClose={() => { setModal(null); onClearAssign?.(); setAssignmentPending(false); }} onAssigned={() => { onAssigned?.(); setModal(null); setAssignmentPending(false); }} />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog title="Delete Warehouse" danger message={`Delete "${modal.wh.name}"? All inventory records linked to this warehouse will lose their warehouse reference.`} onConfirm={() => handleDelete(modal.wh)} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}
