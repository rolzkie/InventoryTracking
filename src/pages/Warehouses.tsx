import { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Package, Users, BarChart2, ChevronRight, ArrowLeftRight, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Warehouse, WarehouseZone } from "../types";
import {
  Button, Input, Select, Textarea, Modal, ConfirmDialog, SearchableSelect,
  Card, Table, Th, Td, SearchBar, PageHeader, ProgressBar, Badge, EmptyState,
  formatPHP,
} from "../components/ui";
const ZONE_TYPES = ["storage", "receiving", "shipping", "cold", "hazmat"] as const;

function emptyWarehouse(): Omit<Warehouse, "id" | "zones" | "createdAt"> {
  return { name: "", location: "", address: "", capacity: 10000, used: 0, manager: "" };
}

function emptyZone(warehouseId: string): Omit<WarehouseZone, "id"> {
  return { warehouseId, name: "", type: "storage", capacity: 1000, used: 0 };
}

export default function Warehouses() {
  const {
    state,
    navigate,
    showToast,
    generateId,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    assignItem,
  } = useApp();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "assign" | "zones">("overview");
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [whForm, setWhForm] = useState(emptyWarehouse());
  const [zoneForm, setZoneForm] = useState<Omit<WarehouseZone, "id">>({ warehouseId: "", name: "", type: "storage", capacity: 1000, used: 0 });
  const [assignItemId, setAssignItemId] = useState("");
  const [assignZoneId, setAssignZoneId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return state.warehouses.filter((w) => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q));
  }, [state.warehouses, search]);

  const validateWarehouse = (f: typeof whForm) => {
    const errors: Record<string, string> = {};
    if (!f.name.trim()) errors.name = "Name is required";
    if (!f.location.trim()) errors.location = "Location is required";
    if (f.capacity <= 0) errors.capacity = "Capacity must be positive";
    return errors;
  };

  const handleAddWarehouse = async () => {
    const errors = validateWarehouse(whForm);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    const wh: Warehouse = {
      ...whForm,
      id: generateId("wh"),
      zones: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await createWarehouse(wh);
      showToast(`Warehouse "${whForm.name}" created`, "success");
      setShowAddModal(false);
      setWhForm(emptyWarehouse());
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to create warehouse", "error");
    }
  };

  const handleEditWarehouse = async () => {
    if (!selectedWarehouse) return;
    const errors = validateWarehouse(whForm);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    try {
      await updateWarehouse({ ...selectedWarehouse, ...whForm });
      showToast(`Warehouse "${whForm.name}" updated`, "success");
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update warehouse", "error");
    }
  };

  const handleAddZone = async () => {
    if (!zoneForm.name.trim()) { setFormErrors({ name: "Zone name is required" }); return; }
    if (!selectedWarehouse) return;
    const zone: WarehouseZone = { ...zoneForm, id: generateId("zone") };
    const updated = { ...selectedWarehouse, zones: [...selectedWarehouse.zones, zone] };
    try {
      await updateWarehouse(updated);
      setSelectedWarehouse(updated);
      showToast("Zone added successfully", "success");
      setShowZoneModal(false);
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to add zone", "error");
    }
  };

  const handleAssign = async () => {
    if (!assignItemId || !selectedWarehouse) { showToast("Select an item", "error"); return; }
    const item = state.items.find((i) => i.id === assignItemId);
    if (!item) return;
    try {
      await assignItem(item.id, selectedWarehouse.id, assignZoneId || null);
      showToast(`"${item.name}" assigned to ${selectedWarehouse.name}`, "success");
      setShowAssignModal(false);
      setAssignItemId("");
      setAssignZoneId("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to assign item", "error");
    }
  };

  const unassignedItems = state.assignableItems;
  const warehouseItems = (whId: string) => state.items.filter((i) => i.warehouseId === whId);
  const warehouseToDelete = deleteId ? state.warehouses.find((w) => w.id === deleteId) : null;
  const warehouseToDeleteItems = deleteId ? warehouseItems(deleteId) : [];

  const handleDeleteWarehouse = async () => {
    if (!deleteId) return;
    const warehouse = state.warehouses.find((w) => w.id === deleteId);
    if (warehouseToDeleteItems.length > 0) {
      showToast("Move or remove inventory before deleting this warehouse", "error");
      return;
    }

    try {
      await deleteWarehouse(deleteId);
      showToast(`Warehouse "${warehouse?.name ?? "selected"}" deleted`, "success");
      setDeleteId(null);
      if (selectedWarehouse?.id === deleteId) {
        setSelectedWarehouse(null);
        setShowDetailModal(false);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete warehouse", "error");
    }
  };

  const zoneTypeColor: Record<string, string> = {
    storage: "text-blue-400 bg-blue-500/10",
    receiving: "text-purple-400 bg-purple-500/10",
    shipping: "text-green-400 bg-green-500/10",
    cold: "text-cyan-400 bg-cyan-500/10",
    hazmat: "text-red-400 bg-red-500/10",
  };

  const whFormFields = (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Warehouse Name *" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} placeholder="Alpha Warehouse" error={formErrors.name} />
        <Input label="Location *" value={whForm.location} onChange={(e) => setWhForm({ ...whForm, location: e.target.value })} placeholder="New York, NY" error={formErrors.location} />
      </div>
      <Input label="Full Address" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} placeholder="123 Industrial Blvd, New York, NY 10001" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Capacity (units) *" type="number" min={1} value={whForm.capacity} onChange={(e) => setWhForm({ ...whForm, capacity: parseInt(e.target.value) || 0 })} error={formErrors.capacity} />
        <Input label="Manager" value={whForm.manager} onChange={(e) => setWhForm({ ...whForm, manager: e.target.value })} placeholder="Manager name" />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Warehouse Management"
        subtitle={`${state.warehouses.length} warehouses · ${unassignedItems.length} unassigned items`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(true)}>
              <Package size={15} /> Assign Item
            </Button>
            <Button variant="primary" onClick={() => { setWhForm(emptyWarehouse()); setFormErrors({}); setShowAddModal(true); }}>
              <Plus size={15} /> Add Warehouse
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#111827] rounded-xl mb-4 w-fit">
        {(["overview", "assign", "zones"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${activeTab === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            {tab === "assign" ? "Item Assignment" : tab}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search warehouses..." className="mb-4" />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((wh) => {
            const items = warehouseItems(wh.id);
            const value = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
            const pct = Math.round((wh.used / wh.capacity) * 100);
            return (
              <Card key={wh.id} className="p-5 hover:border-[#334155] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{wh.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                      <MapPin size={11} />
                      <span>{wh.location}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setSelectedWarehouse(wh); setShowDetailModal(true); }}
                      className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-[0_0_14px_rgba(59,130,246,0.28)] focus-visible:shadow-[0_0_14px_rgba(59,130,246,0.28)]"
                    >
                      <BarChart2 size={13} />
                    </button>
                    <button
                      onClick={() => { setSelectedWarehouse(wh); setWhForm({ name: wh.name, location: wh.location, address: wh.address, capacity: wh.capacity, used: wh.used, manager: wh.manager }); setFormErrors({}); setShowEditModal(true); }}
                      className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300 hover:shadow-[0_0_14px_rgba(245,158,11,0.28)] focus-visible:shadow-[0_0_14px_rgba(245,158,11,0.28)]"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteId(wh.id)} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_14px_rgba(239,68,68,0.28)] focus-visible:shadow-[0_0_14px_rgba(239,68,68,0.28)]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Capacity utilization</span>
                    <span className={`font-semibold ${pct > 85 ? "text-red-400" : pct > 60 ? "text-amber-400" : "text-emerald-400"}`}>{pct}%</span>
                  </div>
                  <ProgressBar value={wh.used} max={wh.capacity} />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>{wh.used.toLocaleString()} / {wh.capacity.toLocaleString()} units</span>
                    <span>{wh.capacity - wh.used} available</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "SKUs", value: items.length, color: "text-blue-400" },
                    { label: "Value", value: formatPHP(value), color: "text-emerald-400" },
                    { label: "Zones", value: wh.zones.length, color: "text-purple-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#0B1220]/50 rounded-xl p-2.5 text-center">
                      <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users size={11} />
                    <span>{wh.manager || "No manager"}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedWarehouse(wh); setShowAssignModal(true); }}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    Assign Items <ChevronRight size={12} />
                  </button>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-2">
              <EmptyState icon={<Package size={40} />} title="No warehouses found" description="Add a warehouse to get started" action={<Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Add Warehouse</Button>} />
            </div>
          )}
        </div>
      )}

      {activeTab === "assign" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445]">
            <h3 className="text-sm font-semibold text-slate-200">Inventory Assignment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage which items are assigned to which warehouses</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Item Name</Th>
                <Th>Category</Th>
                <Th>Quantity</Th>
                <Th>Current Warehouse</Th>
                <Th>Zone</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => {
                const cat = state.categories.find((c) => c.id === item.categoryId);
                const wh = state.warehouses.find((w) => w.id === item.warehouseId);
                const zone = wh?.zones.find((z) => z.id === item.zoneId);
                return (
                  <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors group">
                    <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                    <Td><span className="text-xs text-slate-200">{item.name}</span></Td>
                    <Td>{cat && <span className="text-xs px-2 py-0.5 rounded" style={{ color: cat.color, background: cat.color + "22" }}>{cat.name}</span>}</Td>
                    <Td><span className="text-xs">{item.quantity}</span></Td>
                    <Td>
                      {wh ? (
                        <span className="text-xs text-slate-300">{wh.name}</span>
                      ) : (
                        <span className="text-xs text-amber-400 italic">Unassigned</span>
                      )}
                    </Td>
                    <Td><span className="text-xs text-slate-500">{zone?.name ?? "—"}</span></Td>
                    <Td>
                      <button
                        onClick={() => {
                          if (item.warehouseId) {
                            navigate("transfers");
                            return;
                          }
                          setSelectedWarehouse(null);
                          setAssignItemId(item.id);
                          setShowAssignModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 transition-all hover:border-blue-400/70 hover:bg-blue-500/20 hover:text-blue-200 hover:shadow-[0_0_14px_rgba(59,130,246,0.28)] focus-visible:shadow-[0_0_14px_rgba(59,130,246,0.28)]"
                      >
                        <ArrowLeftRight size={11} /> {item.warehouseId ? "Use Transfer" : "Assign"}
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {activeTab === "zones" && (
        <div className="space-y-4">
          {state.warehouses.map((wh) => (
            <Card key={wh.id} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{wh.name}</h3>
                  <p className="text-xs text-slate-500">{wh.location}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setSelectedWarehouse(wh); setZoneForm(emptyZone(wh.id)); setFormErrors({}); setShowZoneModal(true); }}>
                  <Plus size={13} /> Add Zone
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {wh.zones.map((zone) => {
                  const pct = Math.round((zone.used / zone.capacity) * 100);
                  return (
                    <div key={zone.id} className="p-3 bg-[#0B1220]/50 rounded-xl border border-[#2A3445]/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${zoneTypeColor[zone.type]}`}>{zone.type}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 mb-1">{zone.name}</p>
                      <ProgressBar value={zone.used} max={zone.capacity} />
                      <p className="text-[10px] text-slate-600 mt-1">{zone.used} / {zone.capacity} units</p>
                    </div>
                  );
                })}
                {wh.zones.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-slate-600">No zones defined for this warehouse</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Warehouse Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Warehouse" size="md">
        {whFormFields}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddWarehouse}><Plus size={14} /> Create Warehouse</Button>
        </div>
      </Modal>

      {/* Edit Warehouse Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Warehouse" size="md">
        {whFormFields}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditWarehouse}><Edit2 size={14} /> Save Changes</Button>
        </div>
      </Modal>

      {/* Assign Item Modal */}
      <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setAssignItemId(""); setAssignZoneId(""); }} title="Assign Item to Warehouse" size="md">
        <div className="p-6 space-y-4">
          <SearchableSelect
            label="Select Item *"
            value={assignItemId}
            onChange={setAssignItemId}
            items={unassignedItems}
            placeholder="Search by item name, SKU, or product code..."
            emptyMessage="No matching unassigned items"
            getSecondary={(item) => `${item.sku} · ${item.quantity} ${item.unit}`}
          />
          <Select label="Target Warehouse *" value={selectedWarehouse?.id ?? ""} onChange={(e) => { const wh = state.warehouses.find((w) => w.id === e.target.value); setSelectedWarehouse(wh ?? null); setAssignZoneId(""); }}>
            <option value="">Choose warehouse...</option>
            {state.warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} — {w.location}</option>
            ))}
          </Select>
          {selectedWarehouse && selectedWarehouse.zones.length > 0 && (
            <Select label="Zone (optional)" value={assignZoneId} onChange={(e) => setAssignZoneId(e.target.value)}>
              <option value="">No specific zone</option>
              {selectedWarehouse.zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </Select>
          )}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            Only unassigned items can be assigned here. Use Warehouse Transfers to move an assigned item.
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssign}><Package size={14} /> Assign Item</Button>
        </div>
      </Modal>

      {/* Add Zone Modal */}
      <Modal isOpen={showZoneModal} onClose={() => setShowZoneModal(false)} title={`Add Zone — ${selectedWarehouse?.name}`} size="sm">
        <div className="p-6 space-y-4">
          <Input label="Zone Name *" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Zone A - Electronics" error={formErrors.name} />
          <Select label="Zone Type" value={zoneForm.type} onChange={(e) => setZoneForm({ ...zoneForm, type: e.target.value as WarehouseZone["type"] })}>
            {ZONE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </Select>
          <Input label="Capacity (units)" type="number" min={1} value={zoneForm.capacity} onChange={(e) => setZoneForm({ ...zoneForm, capacity: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowZoneModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddZone}><Plus size={14} /> Add Zone</Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedWarehouse && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedWarehouse.name} size="lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Location", value: selectedWarehouse.location },
                { label: "Manager", value: selectedWarehouse.manager || "—" },
                { label: "Capacity", value: `${selectedWarehouse.capacity.toLocaleString()} units` },
                { label: "Zones", value: selectedWarehouse.zones.length },
              ].map((r) => (
                <div key={r.label} className="p-3 bg-[#0B1220]/50 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">{r.label}</p>
                  <p className="text-sm font-medium text-slate-200">{r.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase mb-3">Assigned Items</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {warehouseItems(selectedWarehouse.id).map((item) => {
                  const cat = state.categories.find((c) => c.id === item.categoryId);
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 bg-[#0B1220]/50 rounded-xl">
                      <span className="font-mono text-xs text-blue-400 w-20 flex-shrink-0">{item.sku}</span>
                      <span className="text-xs text-slate-200 flex-1">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.quantity} {item.unit}</span>
                      {cat && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: cat.color, background: cat.color + "22" }}>{cat.name}</span>}
                    </div>
                  );
                })}
                {warehouseItems(selectedWarehouse.id).length === 0 && (
                  <p className="text-xs text-slate-600 py-4 text-center">No items assigned</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDeleteWarehouse()}
        title="Delete Warehouse"
        message={
          warehouseToDeleteItems.length > 0
            ? `"${warehouseToDelete?.name ?? "This warehouse"}" contains ${warehouseToDeleteItems.length} inventory item${warehouseToDeleteItems.length === 1 ? "" : "s"} and cannot be deleted. Move or remove the inventory first.`
            : `Are you sure you want to delete "${warehouseToDelete?.name ?? "this warehouse"}"? This action cannot be undone.`
        }
        confirmLabel="Delete Warehouse"
        variant="danger"
      />
    </div>
  );
}
