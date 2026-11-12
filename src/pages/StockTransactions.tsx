import { useEffect, useMemo, useRef, useState } from "react";
import { PackageMinus, PackagePlus, Filter, Calendar, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { InventoryItem, StockTransaction } from "../types";
import {
  Button, Input, Select, Textarea, Modal, SearchableSelect,
  Card, Table, Th, Td, SearchBar, PageHeader, StatusBadge, EmptyState, StatCard,
  formatPHP,
} from "../components/ui";

const PURPOSES = ["sales", "production", "warehouse transfer", "damaged", "expired", "other"];

function StockItemCombobox({
  items,
  value,
  onChange,
  label,
  placeholder,
  emptyMessage,
}: {
  items: InventoryItem[];
  value: string;
  onChange: (itemId: string) => void;
  label: string;
  placeholder: string;
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedItem = items.find((item) => item.id === value);

  useEffect(() => {
    if (selectedItem) {
      setQuery(`${selectedItem.sku} — ${selectedItem.name}`);
    }
  }, [selectedItem]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items.slice(0, 25);

    return items.filter((item) => {
      const codedItem = item as InventoryItem & { productCode?: string; product_code?: string };
      const productCode = String(codedItem.productCode ?? codedItem.product_code ?? "");
      return [item.name, item.sku, productCode].some((part) => part.toLowerCase().includes(term));
    }).slice(0, 25);
  }, [items, query]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">{label}</label>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
        role="combobox"
        aria-expanded={open}
        aria-controls="stock-item-options"
      />
      {open && (
        <div id="stock-item-options" className="absolute left-0 right-0 z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[#334155] bg-[#111827] shadow-[0_18px_40px_rgba(15,23,42,0.45)]">
          {filteredItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">{emptyMessage}</div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setQuery(`${item.sku} — ${item.name}`);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-[#1E2A3A] focus:bg-[#1E2A3A]"
              >
                <span className="block text-xs font-medium text-slate-200">{item.name}</span>
                <span className="block text-[10px] text-slate-500">{item.sku} - {item.quantity} {item.unit}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function StockTransactions() {
  const { state, showToast, createTransaction } = useApp();
  const canWrite = state.currentUser.permission !== "view";
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "stock-in" | "stock-out">("");
  const [activeTab, setActiveTab] = useState<"all" | "stock-in" | "stock-out" | "expiration">("all");
  const [showInModal, setShowInModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [inForm, setInForm] = useState({ itemId: "", quantity: 0, supplierId: "", notes: "", unitCost: 0, expirationDate: "" });
  const [outForm, setOutForm] = useState({ itemId: "", quantity: 0, purpose: "sales", notes: "" });
  const [inErrors, setInErrors] = useState<Record<string, string>>({});
  const [outErrors, setOutErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let txns = state.transactions;
    if (activeTab === "stock-in") txns = txns.filter((t) => t.type === "stock-in");
    if (activeTab === "stock-out") txns = txns.filter((t) => t.type === "stock-out");
    if (activeTab === "expiration") {
      const expItems = new Set(state.items.filter((i) => i.expirationDate).map((i) => i.id));
      txns = txns.filter((t) => expItems.has(t.itemId) || t.expirationDate);
    }
    if (filterType) txns = txns.filter((t) => t.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      txns = txns.filter((t) => {
        const item = state.items.find((i) => i.id === t.itemId);
        return item?.name.toLowerCase().includes(q) || item?.sku.toLowerCase().includes(q) || t.referenceNumber.toLowerCase().includes(q);
      });
    }
    return txns;
  }, [state.transactions, state.items, search, filterType, activeTab]);

  const stats = useMemo(() => {
    const totalIn = state.transactions.filter((t) => t.type === "stock-in").reduce((s, t) => s + t.quantity, 0);
    const totalOut = state.transactions.filter((t) => t.type === "stock-out").reduce((s, t) => s + t.quantity, 0);
    const today = state.transactions.filter((t) => t.date === new Date().toISOString().split("T")[0]);
    const expiringItems = state.items.filter((i) => {
      if (!i.expirationDate) return false;
      const exp = new Date(i.expirationDate);
      const now = new Date();
      const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 90 && days > 0;
    });
    return { totalIn, totalOut, todayCount: today.length, expiringCount: expiringItems.length };
  }, [state.transactions, state.items]);

  const validateIn = () => {
    const errors: Record<string, string> = {};
    if (!inForm.itemId) errors.itemId = "Select an item";
    if (inForm.quantity <= 0) errors.quantity = "Quantity must be positive";
    return errors;
  };

  const validateOut = () => {
    const errors: Record<string, string> = {};
    if (!outForm.itemId) errors.itemId = "Select an item";
    if (outForm.quantity <= 0) errors.quantity = "Quantity must be positive";
    const item = state.items.find((i) => i.id === outForm.itemId);
    if (item && outForm.quantity > item.quantity) errors.quantity = `Only ${item.quantity} units available (prevents negative stock)`;
    return errors;
  };

  const handleStockIn = async () => {
    const errors = validateIn();
    if (Object.keys(errors).length) { setInErrors(errors); return; }
    const item = state.items.find((i) => i.id === inForm.itemId);
    const txn = {
      itemId: inForm.itemId,
      type: "stock-in" as const,
      quantity: inForm.quantity,
      date: new Date().toISOString().split("T")[0],
      supplierId: inForm.supplierId || undefined,
      notes: inForm.notes,
      processedBy: state.currentUser.name,
      unitCost: inForm.unitCost || item?.unitCost || 0,
      expirationDate: inForm.expirationDate || undefined,
    };
    try {
      await createTransaction(txn);
      showToast(`Stock-In recorded: +${inForm.quantity} units of ${item?.name}`, "success");
      setShowInModal(false);
      setInForm({ itemId: "", quantity: 0, supplierId: "", notes: "", unitCost: 0, expirationDate: "" });
      setInErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to record stock-in", "error");
    }
  };

  const handleStockOut = async () => {
    const errors = validateOut();
    if (Object.keys(errors).length) { setOutErrors(errors); return; }
    const item = state.items.find((i) => i.id === outForm.itemId);
    const txn = {
      itemId: outForm.itemId,
      type: "stock-out" as const,
      quantity: outForm.quantity,
      date: new Date().toISOString().split("T")[0],
      purpose: outForm.purpose,
      notes: outForm.notes,
      processedBy: state.currentUser.name,
      unitCost: item?.unitCost || 0,
    };
    try {
      await createTransaction(txn);
      showToast(`Stock-Out recorded: -${outForm.quantity} units of ${item?.name}`, "warning");
      setShowOutModal(false);
      setOutForm({ itemId: "", quantity: 0, purpose: "sales", notes: "" });
      setOutErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to record stock-out", "error");
    }
  };

  const expiringItems = state.items.filter((i) => {
    if (!i.expirationDate) return false;
    const exp = new Date(i.expirationDate);
    const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
    return days <= 90;
  }).sort((a, b) => (a.expirationDate ?? "").localeCompare(b.expirationDate ?? ""));

  return (
    <div>
      <PageHeader
        title="Stock Transactions"
        subtitle="Manage stock movements, deliveries, and releases"
        actions={
          <div className="flex gap-2">
            <Button variant="success" disabled={!canWrite} onClick={() => { setInForm({ itemId: "", quantity: 0, supplierId: "", notes: "", unitCost: 0, expirationDate: "" }); setInErrors({}); setShowInModal(true); }}>
              <PackagePlus size={15} /> Stock In
            </Button>
            <Button variant="danger" disabled={!canWrite} onClick={() => { setOutForm({ itemId: "", quantity: 0, purpose: "sales", notes: "" }); setOutErrors({}); setShowOutModal(true); }}>
              <PackageMinus size={15} /> Stock Out
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Stock In" value={stats.totalIn.toLocaleString()} icon={<PackagePlus size={18} />} color="green" />
        <StatCard title="Total Stock Out" value={stats.totalOut.toLocaleString()} icon={<PackageMinus size={18} />} color="red" />
        <StatCard title="Today's Activity" value={stats.todayCount} icon={<Calendar size={18} />} color="blue" subtitle="transactions" />
        <StatCard title="Expiring ≤90 Days" value={stats.expiringCount} icon={<AlertCircle size={18} />} color="amber" subtitle="items require attention" />
      </div>

      {!canWrite && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
          This account has view-only permission. Stock transactions can be reviewed but not created, updated, or deleted.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#111827] rounded-xl mb-4 w-fit">
        {([
          { id: "all", label: "All Transactions" },
          { id: "stock-in", label: "Stock In" },
          { id: "stock-out", label: "Stock Out" },
          { id: "expiration", label: "Expiration Tracking" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "expiration" ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Expiration Tracking</h3>
              <p className="text-xs text-slate-500">Items expiring within 90 days</p>
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Item Name</Th>
                <Th>Warehouse</Th>
                <Th>Quantity</Th>
                <Th>Expiration Date</Th>
                <Th>Days Remaining</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {expiringItems.length === 0 ? (
                <tr><td colSpan={7}><EmptyState title="No expiring items" description="All items are within safe date ranges" /></td></tr>
              ) : (
                expiringItems.map((item) => {
                  const daysLeft = Math.ceil((new Date(item.expirationDate!).getTime() - Date.now()) / 86400000);
                  const wh = state.warehouses.find((w) => w.id === item.warehouseId);
                  return (
                    <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                      <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                      <Td><span className="text-xs text-slate-200">{item.name}</span></Td>
                      <Td><span className="text-xs text-slate-400">{wh?.name ?? "Unassigned"}</span></Td>
                      <Td><span className="text-xs">{item.quantity} {item.unit}</span></Td>
                      <Td><span className="text-xs text-slate-300">{item.expirationDate}</span></Td>
                      <Td>
                        <span className={`text-xs font-semibold ${daysLeft <= 30 ? "text-red-400" : daysLeft <= 60 ? "text-amber-400" : "text-blue-400"}`}>
                          {daysLeft <= 0 ? "Expired" : `${daysLeft} days`}
                        </span>
                      </Td>
                      <Td><StatusBadge status={daysLeft <= 0 ? "expired" : daysLeft <= 30 ? "out-of-stock" : "low-stock"} /></Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by item, SKU, reference..." />
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)} className="w-36">
              <option value="">All Types</option>
              <option value="stock-in">Stock In</option>
              <option value="stock-out">Stock Out</option>
            </Select>
            <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <Filter size={12} />
              <span>{filtered.length} records</span>
            </div>
          </div>

          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Ref. Number</Th>
                  <Th>Type</Th>
                  <Th>Item</Th>
                  <Th>Quantity</Th>
                  <Th>Unit Cost</Th>
                  <Th>Total</Th>
                  <Th>Date</Th>
                  <Th>Supplier / Purpose</Th>
                  <Th>Processed By</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10}><EmptyState icon={<PackagePlus size={40} />} title="No transactions found" description="Record a stock-in or stock-out to get started" /></td></tr>
                ) : (
                  filtered.map((txn) => {
                    const item = state.items.find((i) => i.id === txn.itemId);
                    const supplier = state.suppliers.find((s) => s.id === txn.supplierId);
                    return (
                      <tr key={txn.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                        <Td><span className="font-mono text-xs text-blue-400">{txn.referenceNumber}</span></Td>
                        <Td><StatusBadge status={txn.type} /></Td>
                        <Td>
                          <div>
                            <p className="text-xs font-medium text-slate-200">{item?.name ?? "Unknown"}</p>
                            <p className="text-[10px] text-slate-500">{item?.sku}</p>
                          </div>
                        </Td>
                        <Td>
                          <span className={`text-xs font-semibold ${txn.type === "stock-in" ? "text-emerald-400" : "text-red-400"}`}>
                            {txn.type === "stock-in" ? "+" : "-"}{txn.quantity}
                          </span>
                        </Td>
                        <Td><span className="text-xs">{formatPHP(txn.unitCost)}</span></Td>
                        <Td><span className="text-xs font-medium text-slate-200">{formatPHP(txn.quantity * txn.unitCost)}</span></Td>
                        <Td><span className="text-xs text-slate-400">{txn.date}</span></Td>
                        <Td>
                          <span className="text-xs text-slate-400">
                            {txn.type === "stock-in" ? (supplier?.name ?? "Unknown supplier") : (txn.purpose ?? "—")}
                          </span>
                        </Td>
                        <Td><span className="text-xs text-slate-500">{txn.processedBy}</span></Td>
                        <Td><span className="text-xs text-slate-500 max-w-32 truncate block" title={txn.notes}>{txn.notes || "—"}</span></Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {/* Stock In Modal */}
      <Modal isOpen={showInModal} onClose={() => setShowInModal(false)} title="Record Stock In" size="md">
        <div className="p-6 space-y-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <PackagePlus size={14} />
            Recording supplier delivery — stock will be added to the selected item
          </div>
          <div className="relative">
            <SearchableSelect
              label="Item *"
              value={inForm.itemId}
              onChange={(itemId) => {
                const item = state.items.find((entry) => entry.id === itemId);
                setInForm({ ...inForm, itemId, unitCost: item?.unitCost ?? 0 });
              }}
              items={state.items.filter((item) => Boolean(item.warehouseId))}
              placeholder="Search by item name, SKU, or product code..."
              emptyMessage="No matching items"
              getSecondary={(item) => `${item.sku} · ${item.quantity} ${item.unit}`}
            />
          </div>
          {inErrors.itemId && <span className="text-xs text-red-400">{inErrors.itemId}</span>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Quantity *</label>
              <input type="number" min={1} value={inForm.quantity} onChange={(e) => setInForm({ ...inForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              {inErrors.quantity && <span className="text-xs text-red-400">{inErrors.quantity}</span>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Unit Cost (PHP)</label>
              <input type="number" min={0} step="0.01" value={inForm.unitCost} onChange={(e) => setInForm({ ...inForm, unitCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Select label="Supplier" value={inForm.supplierId} onChange={(e) => setInForm({ ...inForm, supplierId: e.target.value })}>
              <option value="">No supplier</option>
              {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <Input label="Expiration Date (if applicable)" type="date" value={inForm.expirationDate} onChange={(e) => setInForm({ ...inForm, expirationDate: e.target.value })} />
          <Textarea label="Notes" value={inForm.notes} onChange={(e) => setInForm({ ...inForm, notes: e.target.value })} placeholder="Delivery notes, batch number, etc." />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowInModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleStockIn}><PackagePlus size={14} /> Record Stock In</Button>
        </div>
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={showOutModal} onClose={() => setShowOutModal(false)} title="Record Stock Out" size="md">
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <PackageMinus size={14} />
            Recording stock release — available quantity will be deducted. Negative stock is prevented.
          </div>
          <div className="relative">
            <SearchableSelect
              label="Item *"
              value={outForm.itemId}
              onChange={(itemId) => setOutForm({ ...outForm, itemId })}
              items={state.items.filter((item) => Boolean(item.warehouseId) && item.quantity > 0)}
              placeholder="Search by item name, SKU, or product code..."
              emptyMessage="No matching items"
              getSecondary={(item) => `${item.sku} · ${item.quantity} ${item.unit}`}
            />
          </div>
          {outErrors.itemId && <span className="text-xs text-red-400">{outErrors.itemId}</span>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Quantity *</label>
              <input type="number" min={1} value={outForm.quantity} onChange={(e) => setOutForm({ ...outForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              {outErrors.quantity && <span className="text-xs text-red-400">{outErrors.quantity}</span>}
            </div>
            <Select label="Purpose" value={outForm.purpose} onChange={(e) => setOutForm({ ...outForm, purpose: e.target.value })}>
              {PURPOSES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </Select>
          </div>
          <Textarea label="Notes" value={outForm.notes} onChange={(e) => setOutForm({ ...outForm, notes: e.target.value })} placeholder="Release notes, destination, order reference..." />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowOutModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleStockOut}><PackageMinus size={14} /> Record Stock Out</Button>
        </div>
      </Modal>
    </div>
  );
}
