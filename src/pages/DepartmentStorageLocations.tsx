import { useState, type FormEvent } from "react";
import { Building2, Edit2, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Warehouse } from "../types";
import { storageLocationLabel } from "../lib/api";
import { DEFAULT_TIMEZONE, todayDate } from "../lib/datetime";
import { Button, Card, ConfirmDialog, Input, Modal, PageHeader, Select } from "../components/ui";

type LocationForm = Pick<Warehouse, "department" | "name" | "location" | "address" | "capacity" | "manager">;

const emptyForm = (): LocationForm => ({
  department: "",
  name: "",
  location: "",
  address: "",
  capacity: 0,
  manager: "",
});

export default function DepartmentStorageLocations() {
  const {
    state,
    showToast,
    generateId,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    assignItem,
  } = useApp();
  const isAdmin = state.currentUser.role === "admin";
  const timezone = String(state.settings.general?.timezone ?? DEFAULT_TIMEZONE);
  const canAssign = state.currentUser.permission !== "view" && state.currentUser.role !== "viewer" && state.currentUser.role !== "visitor";
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (location: Warehouse) => {
    setEditing(location);
    setForm({
      department: location.department,
      name: location.name,
      location: location.location,
      address: location.address,
      capacity: location.capacity,
      manager: location.manager,
    });
    setShowForm(true);
  };

  const saveLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await updateWarehouse({ ...editing, ...form });
        showToast("Department storage location updated", "success");
      } else {
        await createWarehouse({
          ...form,
          id: generateId("location"),
          used: 0,
          zones: [],
          createdAt: todayDate(timezone),
        });
        showToast("Department storage location created", "success");
      }
      setShowForm(false);
      setEditing(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to save storage location", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (location: Warehouse) => {
    const itemId = assignments[location.id];
    if (!itemId) return;
    setBusy(true);
    try {
      await assignItem(itemId, location.id, null);
      setAssignments((current) => ({ ...current, [location.id]: "" }));
      showToast(`Product assigned to ${storageLocationLabel(location)}`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to assign product", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeLocation = async (id: string) => {
    try {
      await deleteWarehouse(id);
      showToast("Storage location removed", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to remove storage location", "error");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Departments & Storage Locations"
        subtitle="Set where each department stores products and assign unlocated inventory."
        actions={isAdmin ? <Button onClick={openCreate}><Plus size={15} /> Add location</Button> : undefined}
      />

      {state.warehouses.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="mx-auto mb-3 text-slate-500" size={28} />
          <p className="text-sm font-semibold text-slate-200">No storage locations yet</p>
          <p className="mt-1 text-xs text-slate-500">Create a department location, then assign products to it.</p>
          {isAdmin && <Button className="mt-4" onClick={openCreate}><Plus size={14} /> Add location</Button>}
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {state.warehouses.map((location) => {
            const items = state.items.filter((item) => item.warehouseId === location.id);
            const assignableItems = state.assignableItems;
            const capacity = location.capacity > 0 ? `${location.used} / ${location.capacity} units` : `${location.used} units · no capacity limit`;

            return (
              <Card key={location.id} className="overflow-hidden">
                <div className="flex items-start gap-3 border-b border-border-subtle p-4">
                  <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Building2 size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{location.department}</p>
                    <h2 className="mt-0.5 truncate text-sm font-semibold text-content">{location.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-content-subtle"><MapPin size={12} />{location.location}</p>
                  </div>
                  {isAdmin && <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(location)} aria-label={`Edit ${location.name}`}><Edit2 size={13} /></Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(location.id)} aria-label={`Remove ${location.name}`}><Trash2 size={13} /></Button>
                  </div>}
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 text-xs">
                  <div><p className="text-content-subtle">Assigned products</p><p className="mt-1 font-semibold text-content">{items.length}</p></div>
                  <div><p className="text-content-subtle">Capacity used</p><p className="mt-1 font-semibold text-content">{capacity}</p></div>
                  <div><p className="text-content-subtle">Manager</p><p className="mt-1 font-semibold text-content">{location.manager || "Not assigned"}</p></div>
                  <div><p className="text-content-subtle">Address</p><p className="mt-1 truncate font-semibold text-content">{location.address || "Not provided"}</p></div>
                </div>

                {canAssign && <div className="flex flex-col gap-2 border-t border-border-subtle p-4 sm:flex-row sm:items-end">
                  <Select
                    label="Assign unassigned product"
                    value={assignments[location.id] ?? ""}
                    onChange={(event) => setAssignments((current) => ({ ...current, [location.id]: event.target.value }))}
                    className="min-w-0 flex-1"
                  >
                    <option value="">Select a product</option>
                    {assignableItems.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} {item.unit}</option>)}
                  </Select>
                  <Button disabled={busy || !assignments[location.id]} onClick={() => void handleAssign(location)}><Package size={14} /> Assign</Button>
                </div>}

                <div className="border-t border-border-subtle px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-content-subtle">Products here</p>
                  {items.length ? <div className="flex flex-wrap gap-2">
                    {items.slice(0, 8).map((item) => <span key={item.id} className="rounded-lg bg-surface-raised px-2 py-1 text-[11px] text-content">{item.name} · {item.quantity}</span>)}
                    {items.length > 8 && <span className="px-2 py-1 text-[11px] text-content-subtle">+{items.length - 8} more</span>}
                  </div> : <p className="text-xs text-content-subtle">No products assigned yet.</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit Department Storage Location" : "Add Department Storage Location"} size="md">
        <form onSubmit={(event) => void saveLocation(event)} className="space-y-4 p-5">
          <Input label="Department *" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Science Department" required maxLength={100} />
          <Input label="Storage location *" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Science storeroom" required maxLength={255} />
          <Input label="Building / room *" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="North Building, Room 204" required maxLength={255} />
          <Input label="Address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Optional address or campus details" maxLength={500} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Capacity (0 = no limit)" type="number" min={0} value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: Number(event.target.value) || 0 }))} />
            <Input label="Location manager" value={form.manager} onChange={(event) => setForm((current) => ({ ...current, manager: event.target.value }))} placeholder="Optional" maxLength={255} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create location"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) void removeLocation(id);
        }}
        title="Remove storage location"
        message={`Remove "${state.warehouses.find((location) => location.id === deleteId)?.name ?? "this location"}"? Products without transaction history will become unassigned.`}
        confirmLabel="Remove location"
        variant="danger"
      />
    </div>
  );
}
