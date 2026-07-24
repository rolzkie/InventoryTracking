import { useState, useMemo } from "react";
import { Plus, ArrowRight, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Transfer } from "../types";
import {
  Button, Select, Textarea, Modal, ConfirmDialog,
  Card, Table, Th, Td, SearchBar, PageHeader, StatusBadge, Badge, EmptyState,
} from "../components/ui";

export default function Transfers() {
  const { state, showToast, generateId, createTransfer, updateTransfer } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [form, setForm] = useState({
    itemId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    fromZoneId: "",
    toZoneId: "",
    quantity: 1,
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let transfers = state.transfers;
    if (search) {
      const q = search.toLowerCase();
      transfers = transfers.filter((t) => {
        const item = state.items.find((i) => i.id === t.itemId);
        const from = state.warehouses.find((w) => w.id === t.fromWarehouseId);
        const to = state.warehouses.find((w) => w.id === t.toWarehouseId);
        return (
          item?.name.toLowerCase().includes(q) ||
          from?.name.toLowerCase().includes(q) ||
          to?.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      });
    }
    if (filterStatus) transfers = transfers.filter((t) => t.status === filterStatus);
    return transfers;
  }, [state.transfers, state.items, state.warehouses, search, filterStatus]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.itemId) errors.itemId = "Select an item";
    if (!form.fromWarehouseId) errors.fromWarehouseId = "Select source warehouse";
    if (!form.toWarehouseId) errors.toWarehouseId = "Select destination warehouse";
    if (form.fromWarehouseId === form.toWarehouseId) errors.toWarehouseId = "Cannot transfer to same warehouse";
    if (form.quantity <= 0) errors.quantity = "Quantity must be positive";
    const item = state.items.find((i) => i.id === form.itemId);
    if (item && !item.warehouseId) errors.itemId = "Assign this item to a warehouse first";
    if (item?.warehouseId && form.fromWarehouseId !== item.warehouseId) {
      errors.fromWarehouseId = "Source must match the item's current warehouse";
    }
    if (item && form.quantity > item.quantity) errors.quantity = `Only ${item.quantity} units available`;
    return errors;
  };

  const handleCreate = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    const transfer: Transfer = {
      id: generateId("tr"),
      itemId: form.itemId,
      fromWarehouseId: form.fromWarehouseId,
      toWarehouseId: form.toWarehouseId,
      fromZoneId: form.fromZoneId || undefined,
      toZoneId: form.toZoneId || undefined,
      quantity: form.quantity,
      status: "pending",
      requestedBy: state.currentUser.name,
      date: new Date().toISOString().split("T")[0],
      notes: form.notes,
    };
    try {
      await createTransfer(transfer);
      showToast("Transfer request created", "success");
      setShowAddModal(false);
      setForm({ itemId: "", fromWarehouseId: "", toWarehouseId: "", fromZoneId: "", toZoneId: "", quantity: 1, notes: "" });
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to create transfer", "error");
    }
  };

  const handleApprove = async (transfer: Transfer) => {
    try {
      await updateTransfer({
        ...transfer,
        status: "in-transit",
        approvedBy: state.currentUser.name,
      });
      showToast("Transfer approved and marked in-transit", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to approve transfer", "error");
    }
  };

  const handleComplete = async (transfer: Transfer) => {
    try {
      await updateTransfer({
        ...transfer,
        status: "completed",
        completedAt: new Date().toISOString().split("T")[0],
      });
      showToast("Transfer completed successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to complete transfer", "error");
    }
  };

  const handleCancel = async (id: string) => {
    const transfer = state.transfers.find((t) => t.id === id);
    if (!transfer) return;
    try {
      await updateTransfer({ ...transfer, status: "cancelled" });
      showToast("Transfer cancelled", "warning");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to cancel transfer", "error");
    }
  };

  const selectedItem = state.items.find((i) => i.id === form.itemId);
  const fromWarehouse = state.warehouses.find((w) => w.id === form.fromWarehouseId);
  const toWarehouse = state.warehouses.find((w) => w.id === form.toWarehouseId);

  const statusCounts = {
    pending: state.transfers.filter((t) => t.status === "pending").length,
    "in-transit": state.transfers.filter((t) => t.status === "in-transit").length,
    completed: state.transfers.filter((t) => t.status === "completed").length,
    cancelled: state.transfers.filter((t) => t.status === "cancelled").length,
  };

  return (
    <div>
      <PageHeader
        title="Warehouse Transfers"
        subtitle="Manage inter-warehouse item movements"
        actions={
          <Button variant="primary" onClick={() => { setForm({ itemId: "", fromWarehouseId: "", toWarehouseId: "", fromZoneId: "", toZoneId: "", quantity: 1, notes: "" }); setFormErrors({}); setShowAddModal(true); }}>
            <Plus size={15} /> New Transfer
          </Button>
        }
      />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending", count: statusCounts.pending, icon: <Clock size={16} />, color: "amber" },
          { label: "In Transit", count: statusCounts["in-transit"], icon: <Truck size={16} />, color: "blue" },
          { label: "Completed", count: statusCounts.completed, icon: <CheckCircle size={16} />, color: "green" },
          { label: "Cancelled", count: statusCounts.cancelled, icon: <XCircle size={16} />, color: "red" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color === "amber" ? "bg-amber-500/10 text-amber-400" : s.color === "blue" ? "bg-blue-500/10 text-blue-400" : s.color === "green" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100">{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search transfers..." />
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-36">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {/* Transfer Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Transfer ID</Th>
              <Th>Item</Th>
              <Th>From</Th>
              <Th></Th>
              <Th>To</Th>
              <Th>Qty</Th>
              <Th>Date</Th>
              <Th>Requested By</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    icon={<ArrowRight size={40} />}
                    title="No transfers found"
                    description="Create a new transfer request to move items between warehouses"
                    action={<Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> New Transfer</Button>}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((transfer) => {
                const item = state.items.find((i) => i.id === transfer.itemId);
                const from = state.warehouses.find((w) => w.id === transfer.fromWarehouseId);
                const to = state.warehouses.find((w) => w.id === transfer.toWarehouseId);
                return (
                  <tr key={transfer.id} className="hover:bg-[#1E2A3A]/50 transition-colors group">
                    <Td><span className="font-mono text-xs text-blue-400">{transfer.id.slice(0, 10)}</span></Td>
                    <Td>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{item?.name ?? "Unknown"}</p>
                        <p className="text-[10px] text-slate-500">{item?.sku}</p>
                      </div>
                    </Td>
                    <Td><span className="text-xs text-slate-300">{from?.name ?? "—"}</span></Td>
                    <Td><ArrowRight size={13} className="text-slate-600" /></Td>
                    <Td><span className="text-xs text-slate-300">{to?.name ?? "—"}</span></Td>
                    <Td><span className="text-xs font-semibold text-slate-200">{transfer.quantity}</span></Td>
                    <Td><span className="text-xs text-slate-500">{transfer.date}</span></Td>
                    <Td><span className="text-xs text-slate-400">{transfer.requestedBy}</span></Td>
                    <Td><StatusBadge status={transfer.status} /></Td>
                    <Td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {transfer.status === "pending" && (
                          <>
                            <Button variant="success" size="sm" onClick={() => handleApprove(transfer)}>Approve</Button>
                            <Button variant="danger" size="sm" onClick={() => setCancelId(transfer.id)}>Cancel</Button>
                          </>
                        )}
                        {transfer.status === "in-transit" && (
                          <Button variant="success" size="sm" onClick={() => handleComplete(transfer)}>
                            <CheckCircle size={12} /> Complete
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>

      {/* Create Transfer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Transfer Request" size="md">
        <div className="p-6 space-y-4">
          <Select label="Item to Transfer *" value={form.itemId} onChange={(e) => { setForm({ ...form, itemId: e.target.value, fromWarehouseId: state.items.find(i => i.id === e.target.value)?.warehouseId ?? "" }); }} error={formErrors.itemId}>
            <option value="">Select inventory item...</option>
            {state.items.filter((i) => Boolean(i.warehouseId) && i.quantity > 0).map((i) => (
              <option key={i.id} value={i.id}>{i.sku} — {i.name} ({i.quantity} available)</option>
            ))}
          </Select>

          {selectedItem && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
              <span>Current location: <strong>{state.warehouses.find(w => w.id === selectedItem.warehouseId)?.name ?? "Unassigned"}</strong> · Available: <strong>{selectedItem.quantity} {selectedItem.unit}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select label="From Warehouse *" value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })} error={formErrors.fromWarehouseId}>
              <option value="">Source warehouse...</option>
              {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
            <Select label="To Warehouse *" value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })} error={formErrors.toWarehouseId}>
              <option value="">Destination warehouse...</option>
              {state.warehouses.filter((w) => w.id !== form.fromWarehouseId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>

          {fromWarehouse?.zones.length ? (
            <Select label="From Zone (optional)" value={form.fromZoneId} onChange={(e) => setForm({ ...form, fromZoneId: e.target.value })}>
              <option value="">Any zone</option>
              {fromWarehouse.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
          ) : null}

          {toWarehouse?.zones.length ? (
            <Select label="To Zone (optional)" value={form.toZoneId} onChange={(e) => setForm({ ...form, toZoneId: e.target.value })}>
              <option value="">Any zone</option>
              {toWarehouse.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
          ) : null}

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Quantity *</label>
            <input
              type="number"
              min={1}
              max={selectedItem?.quantity ?? 999}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.quantity && <span className="text-xs text-red-400">{formErrors.quantity}</span>}
          </div>

          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Transfer reason or special instructions..." />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}><Plus size={14} /> Create Transfer</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => void handleCancel(cancelId!)}
        title="Cancel Transfer"
        message="Are you sure you want to cancel this transfer request?"
        confirmLabel="Cancel Transfer"
        variant="danger"
      />
    </div>
  );
}
