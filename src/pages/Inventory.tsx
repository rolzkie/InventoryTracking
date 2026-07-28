import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, Package, Filter, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { InventoryItem } from "../types";
import {
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  ConfirmDialog,
  StatusBadge,
  Table,
  Th,
  Td,
  SearchBar,
  Pagination,
  PageHeader,
  EmptyState,
  Card,
  formatPHP,
} from "../components/ui";

const PER_PAGE = 10;

type InventoryForm = Omit<InventoryItem, "id" | "status" | "warehouseId" | "zoneId" | "createdAt" | "updatedAt"> & {
  supplierName: string;
};

const emptyForm = (): InventoryForm => ({
  sku: "",
  name: "",
  categoryId: "",
  quantity: 0,
  reorderPoint: 10,
  maxStock: 100,
  expirationDate: null,
  unitCost: 0,
  supplierId: null,
  supplierName: "",
  description: "",
  unit: "units",
});

export default function Inventory() {
  const { state, showToast, generateId, createItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "sku" | "quantity" | "unitCost">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const normalizeSku = (value: string) => value.trim().toLowerCase();

  const filtered = useMemo(() => {
    let items = state.items;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || state.categories.find((c) => c.id === i.categoryId)?.name.toLowerCase().includes(q));
    }
    if (filterCategory) items = items.filter((i) => i.categoryId === filterCategory);
    if (filterWarehouse === "__unassigned__") items = items.filter((i) => !i.warehouseId);
    else if (filterWarehouse) items = items.filter((i) => i.warehouseId === filterWarehouse);
    if (filterStatus) items = items.filter((i) => i.status === filterStatus);
    items = [...items].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "quantity") return (a.quantity - b.quantity) * dir;
      if (sortBy === "unitCost") return (a.unitCost - b.unitCost) * dir;
      return a[sortBy].localeCompare(b[sortBy]) * dir;
    });
    return items;
  }, [state.items, state.categories, search, filterCategory, filterWarehouse, filterStatus, sortBy, sortDir]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const validate = (f: typeof form, mode: "add" | "edit" = "add") => {
    const errors: Record<string, string> = {};
    if (!f.sku.trim()) errors.sku = "SKU is required";
    if (!f.name.trim()) errors.name = "Name is required";
    if (!f.categoryId) errors.categoryId = "Category is required";
    if (f.quantity < 0) errors.quantity = "Quantity cannot be negative";
    if (f.unitCost < 0) errors.unitCost = "Unit cost cannot be negative";
    if (f.reorderPoint < 0) errors.reorderPoint = "Reorder point cannot be negative";
    if (mode === "add") {
      const nextSku = normalizeSku(f.sku);
      if (state.items.some((i) => normalizeSku(i.sku) === nextSku)) errors.sku = "SKU already exists";
    }
    return errors;
  };

  const handleAdd = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    const now = new Date().toISOString().split("T")[0];
    const newItem: InventoryItem = {
      ...form,
      sku: form.sku.trim(),
      id: generateId("item"),
      warehouseId: null,
      zoneId: null,
      status: "out-of-stock",
      createdAt: now,
      updatedAt: now,
      expirationDate: form.expirationDate || null,
      supplierId: form.supplierId || null,
    };
    try {
      await createItem(newItem, form.supplierName?.trim() || undefined);
      showToast(`Item "${form.name}" added successfully`, "success");
      setShowAddModal(false);
      setForm(emptyForm());
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to add item", "error");
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    const errors = validate(form, "edit");
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    try {
      await updateItem(
        {
          ...selectedItem,
          ...form,
          sku: form.sku.trim(),
          updatedAt: new Date().toISOString().split("T")[0],
          expirationDate: form.expirationDate || null,
          supplierId: form.supplierId || null,
        },
        form.supplierName?.trim() || undefined,
      );
      showToast(`Item "${form.name}" updated successfully`, "success");
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update item", "error");
    }
  };

  const openEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setForm({ sku: item.sku, name: item.name, categoryId: item.categoryId, quantity: item.quantity, reorderPoint: item.reorderPoint, maxStock: item.maxStock, expirationDate: item.expirationDate, unitCost: item.unitCost, supplierId: item.supplierId, supplierName: "", description: item.description, unit: item.unit });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    const item = state.items.find((i) => i.id === id);
    try {
      await deleteItem(id);
      showToast(`Item "${item?.name}" deleted`, "warning");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete item", "error");
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => (
    <ChevronDown size={12} className={`inline ml-1 transition-transform ${sortBy === field ? (sortDir === "desc" ? "rotate-180" : "") : "opacity-30"}`} />
  );

  const formSection = (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-0001" error={formErrors.sku} />
        <Input label="Item Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" error={formErrors.name} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Category *" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} error={formErrors.categoryId}>
          <option value="">Select category</option>
          {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Supplier" value={form.supplierId ?? ""} onChange={(e) => setForm({ ...form, supplierId: e.target.value || null, supplierName: "" })}>
          <option value="">No supplier</option>
          {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <Input
        label="Or type a new supplier name"
        value={form.supplierName ?? ""}
        onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
        placeholder="Create a new supplier on save"
      />
      <div className="grid grid-cols-3 gap-4">
        <Input label="Quantity *" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} error={formErrors.quantity} />
        <Input label="Reorder Point *" type="number" min={0} value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: parseInt(e.target.value) || 0 })} error={formErrors.reorderPoint} />
        <Input label="Max Stock" type="number" min={0} value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Unit Cost (PHP) *" type="number" min={0} step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })} error={formErrors.unitCost} />
        <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="units, boxes, kg..." />
        <Input label="Expiration Date" type="date" value={form.expirationDate ?? ""} onChange={(e) => setForm({ ...form, expirationDate: e.target.value || null })} />
      </div>
      <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional item description..." />
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
        <strong>Note:</strong> Warehouse assignment is done in the Warehouses module after item creation.
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        subtitle={`${state.items.length} total SKUs · ${state.items.filter(i => i.status === "low-stock").length} low stock · ${state.items.filter(i => i.status === "out-of-stock").length} out of stock`}
        actions={
          <Button variant="primary" onClick={() => { setForm(emptyForm()); setFormErrors({}); setShowAddModal(true); }}>
            <Plus size={15} /> Add Item
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search SKU, name, category..." />
          <Select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="w-40">
            <option value="" disabled hidden>Warehouse Category</option>
            <option value="">All Categories</option>
            {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={filterWarehouse} onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1); }} className="w-44">
            <option value="" disabled hidden>Warehouse</option>
            <option value="">All Warehouses</option>
            <option value="__unassigned__">Unassigned</option>
            {state.warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </Select>
          <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="w-36">
            <option value="">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="expired">Expired</option>
            <option value="overstock">Overstock</option>
          </Select>
          <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
            <Filter size={12} />
            <span>{filtered.length} results</span>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>
                <button onClick={() => toggleSort("sku")} className="hover:text-slate-200 transition-colors">
                  SKU <SortIcon field="sku" />
                </button>
              </Th>
              <Th>
                <button onClick={() => toggleSort("name")} className="hover:text-slate-200 transition-colors">
                  Item Name <SortIcon field="name" />
                </button>
              </Th>
              <Th>Category</Th>
              <Th>Warehouse</Th>
              <Th>
                <button onClick={() => toggleSort("quantity")} className="hover:text-slate-200 transition-colors">
                  Qty <SortIcon field="quantity" />
                </button>
              </Th>
              <Th>Reorder Pt.</Th>
              <Th>Expiry</Th>
              <Th>
                <button onClick={() => toggleSort("unitCost")} className="hover:text-slate-200 transition-colors">
                  Unit Cost <SortIcon field="unitCost" />
                </button>
              </Th>
              <Th>Total Value</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState
                    icon={<Package size={40} />}
                    title="No items found"
                    description="Try adjusting your search or filters"
                    action={<Button variant="primary" size="sm" onClick={() => { setSearch(""); setFilterCategory(""); setFilterWarehouse(""); setFilterStatus(""); }}>Clear Filters</Button>}
                  />
                </td>
              </tr>
            ) : (
              paginated.map((item) => {
                const cat = state.categories.find((c) => c.id === item.categoryId);
                const wh = state.warehouses.find((w) => w.id === item.warehouseId);
                const totalValue = item.quantity * item.unitCost;
                const isExpiringSoon = item.expirationDate && new Date(item.expirationDate) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors group">
                    <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                    <Td>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{item.name}</p>
                        <p className="text-[10px] text-slate-500">{item.unit}</p>
                      </div>
                    </Td>
                    <Td>
                      {cat && (
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: cat.color + "22", color: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-400">{wh?.name ?? <span className="text-amber-400/70 italic">Unassigned</span>}</span>
                    </Td>
                    <Td>
                      <span className={`text-xs font-semibold ${item.quantity === 0 ? "text-red-400" : item.quantity <= item.reorderPoint ? "text-amber-400" : "text-slate-200"}`}>
                        {item.quantity.toLocaleString()}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{item.reorderPoint}</span></Td>
                    <Td>
                      {item.expirationDate ? (
                        <span className={`text-xs ${isExpiringSoon ? "text-amber-400" : "text-slate-400"}`}>
                          {item.expirationDate}
                          {isExpiringSoon && " ⚠"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </Td>
                    <Td><span className="text-xs">{formatPHP(item.unitCost)}</span></Td>
                    <Td><span className="text-xs font-semibold text-emerald-400">{formatPHP(totalValue)}</span></Td>
                    <Td><StatusBadge status={item.status} /></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedItem(item); setShowViewModal(true); }} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-[0_0_14px_rgba(59,130,246,0.28)] focus-visible:shadow-[0_0_14px_rgba(59,130,246,0.28)]" title="View">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300 hover:shadow-[0_0_14px_rgba(245,158,11,0.28)] focus-visible:shadow-[0_0_14px_rgba(245,158,11,0.28)]" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg border border-[#334155]/70 bg-[#0B1220]/70 text-slate-300 transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_14px_rgba(239,68,68,0.28)] focus-visible:shadow-[0_0_14px_rgba(239,68,68,0.28)]" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
        {filtered.length > PER_PAGE && (
          <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Inventory Item" size="lg">
        {formSection}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}><Plus size={14} /> Add Item</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Inventory Item" size="lg">
        {formSection}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit}><Edit2 size={14} /> Save Changes</Button>
        </div>
      </Modal>

      {/* View Modal */}
      {selectedItem && (
        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Item Details" size="md">
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Package size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">{selectedItem.name}</p>
                <p className="font-mono text-sm text-blue-400">{selectedItem.sku}</p>
                <StatusBadge status={selectedItem.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Category", value: state.categories.find(c => c.id === selectedItem.categoryId)?.name ?? "—" },
                { label: "Warehouse", value: state.warehouses.find(w => w.id === selectedItem.warehouseId)?.name ?? "Unassigned" },
                { label: "Quantity", value: `${selectedItem.quantity} ${selectedItem.unit}` },
                { label: "Reorder Point", value: selectedItem.reorderPoint },
                { label: "Max Stock", value: selectedItem.maxStock },
                { label: "Unit Cost", value: formatPHP(selectedItem.unitCost) },
                { label: "Total Value", value: formatPHP(selectedItem.quantity * selectedItem.unitCost) },
                { label: "Expiry Date", value: selectedItem.expirationDate ?? "N/A" },
                { label: "Supplier", value: state.suppliers.find(s => s.id === selectedItem.supplierId)?.name ?? "—" },
                { label: "Last Updated", value: selectedItem.updatedAt },
              ].map((row) => (
                <div key={row.label} className="p-3 bg-[#0B1220]/50 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{row.label}</p>
                  <p className="text-sm text-slate-200 font-medium">{row.value}</p>
                </div>
              ))}
            </div>
            {selectedItem.description && (
              <div className="p-3 bg-[#0B1220]/50 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-300">{selectedItem.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete(deleteId!)}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${state.items.find(i => i.id === deleteId)?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Item"
        variant="danger"
      />
    </div>
  );
}
