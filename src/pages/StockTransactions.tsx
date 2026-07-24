import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Filter, Calendar, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { StockTransaction } from "../types";
import {
  Button, Input, Select, Textarea, Modal,
  Card, Table, Th, Td, SearchBar, PageHeader, StatusBadge, EmptyState, StatCard,
} from "../components/ui";

const PURPOSES = ["sales", "production", "warehouse transfer", "damaged", "expired", "other"];

export default function StockTransactions() {
  const { state, showToast, generateId, createTransaction } = useApp();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "stock-in" | "stock-out">("");
  const [activeTab, setActiveTab] = useState<"all" | "stock-in" | "stock-out" | "expiration">("all");
  const [showInModal, setShowInModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [inForm, setInForm] = useState({ itemId: "", quantity: 0, supplierId: "", referenceNumber: "", notes: "", unitCost: 0, expirationDate: "" });
  const [outForm, setOutForm] = useState({ itemId: "", quantity: 0, purpose: "sales", referenceNumber: "", notes: "" });
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
    if (!inForm.referenceNumber.trim()) errors.referenceNumber = "Reference number required";
    return errors;
  };

  const validateOut = () => {
    const errors: Record<string, string> = {};
    if (!outForm.itemId) errors.itemId = "Select an item";
    if (outForm.quantity <= 0) errors.quantity = "Quantity must be positive";
    const item = state.items.find((i) => i.id === outForm.itemId);
    if (item && outForm.quantity > item.quantity) errors.quantity = `Only ${item.quantity} units available (prevents negative stock)`;
    if (!outForm.referenceNumber.trim()) errors.referenceNumber = "Reference number required";
    return errors;
  };

  const handleStockIn = async () => {
    const errors = validateIn();
    if (Object.keys(errors).length) { setInErrors(errors); return; }
    const item = state.items.find((i) => i.id === inForm.itemId);
    const txn: StockTransaction = {
      id: generateId("txn"),
      itemId: inForm.itemId,
      type: "stock-in",
      quantity: inForm.quantity,
      date: new Date().toISOString().split("T")[0],
      supplierId: inForm.supplierId || undefined,
      referenceNumber: inForm.referenceNumber,
      notes: inForm.notes,
      processedBy: state.currentUser.name,
      unitCost: inForm.unitCost || item?.unitCost || 0,
      expirationDate: inForm.expirationDate || undefined,
    };
    try {
      await createTransaction(txn);
      showToast(`Stock-In recorded: +${inForm.quantity} units of ${item?.name}`, "success");
      setShowInModal(false);
      setInForm({ itemId: "", quantity: 0, supplierId: "", referenceNumber: "", notes: "", unitCost: 0, expirationDate: "" });
      setInErrors({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to record stock-in", "error");
    }
  };

  const handleStockOut = async () => {
    const errors = validateOut();
    if (Object.keys(errors).length) { setOutErrors(errors); return; }
    const item = state.items.find((i) => i.id === outForm.itemId);
    const txn: StockTransaction = {
      id: generateId("txn"),
      itemId: outForm.itemId,
      type: "stock-out",
      quantity: outForm.quantity,
      date: new Date().toISOString().split("T")[0],
      purpose: outForm.purpose,
      referenceNumber: outForm.referenceNumber,
      notes: outForm.notes,
      processedBy: state.currentUser.name,
      unitCost: item?.unitCost || 0,
    };
    try {
      await createTransaction(txn);
      showToast(`Stock-Out recorded: -${outForm.quantity} units of ${item?.name}`, "warning");
      setShowOutModal(false);
      setOutForm({ itemId: "", quantity: 0, purpose: "sales", referenceNumber: "", notes: "" });
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
            <Button variant="success" onClick={() => { setInForm({ itemId: "", quantity: 0, supplierId: "", referenceNumber: `PO-${Date.now().toString().slice(-6)}`, notes: "", unitCost: 0, expirationDate: "" }); setInErrors({}); setShowInModal(true); }}>
              <TrendingUp size={15} /> Stock In
            </Button>
            <Button variant="danger" onClick={() => { setOutForm({ itemId: "", quantity: 0, purpose: "sales", referenceNumber: `SO-${Date.now().toString().slice(-6)}`, notes: "" }); setOutErrors({}); setShowOutModal(true); }}>
              <TrendingDown size={15} /> Stock Out
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Stock In" value={stats.totalIn.toLocaleString()} icon={<TrendingUp size={18} />} color="green" />
        <StatCard title="Total Stock Out" value={stats.totalOut.toLocaleString()} icon={<TrendingDown size={18} />} color="red" />
        <StatCard title="Today's Activity" value={stats.todayCount} icon={<Calendar size={18} />} color="blue" subtitle="transactions" />
        <StatCard title="Expiring ≤90 Days" value={stats.expiringCount} icon={<AlertCircle size={18} />} color="amber" subtitle="items require attention" />
      </div>

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
                  <tr><td colSpan={10}><EmptyState icon={<TrendingUp size={40} />} title="No transactions found" description="Record a stock-in or stock-out to get started" /></td></tr>
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
                        <Td><span className="text-xs">${txn.unitCost.toFixed(2)}</span></Td>
                        <Td><span className="text-xs font-medium text-slate-200">${(txn.quantity * txn.unitCost).toLocaleString()}</span></Td>
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
            <TrendingUp size={14} />
            Recording supplier delivery — stock will be added to the selected item
          </div>
          <Select label="Item *" value={inForm.itemId} onChange={(e) => { const item = state.items.find(i => i.id === e.target.value); setInForm({ ...inForm, itemId: e.target.value, unitCost: item?.unitCost ?? 0 }); }} error={inErrors.itemId}>
            <option value="">Select inventory item...</option>
            {state.items.filter((i) => Boolean(i.warehouseId)).map((i) => <option key={i.id} value={i.id}>{i.sku} — {i.name} (current: {i.quantity})</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Quantity *</label>
              <input type="number" min={1} value={inForm.quantity} onChange={(e) => setInForm({ ...inForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              {inErrors.quantity && <span className="text-xs text-red-400">{inErrors.quantity}</span>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Unit Cost ($)</label>
              <input type="number" min={0} step="0.01" value={inForm.unitCost} onChange={(e) => setInForm({ ...inForm, unitCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Supplier" value={inForm.supplierId} onChange={(e) => setInForm({ ...inForm, supplierId: e.target.value })}>
              <option value="">No supplier</option>
              {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Reference Number *" value={inForm.referenceNumber} onChange={(e) => setInForm({ ...inForm, referenceNumber: e.target.value })} placeholder="PO-2024-001" error={inErrors.referenceNumber} />
          </div>
          <Input label="Expiration Date (if applicable)" type="date" value={inForm.expirationDate} onChange={(e) => setInForm({ ...inForm, expirationDate: e.target.value })} />
          <Textarea label="Notes" value={inForm.notes} onChange={(e) => setInForm({ ...inForm, notes: e.target.value })} placeholder="Delivery notes, batch number, etc." />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowInModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleStockIn}><TrendingUp size={14} /> Record Stock In</Button>
        </div>
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={showOutModal} onClose={() => setShowOutModal(false)} title="Record Stock Out" size="md">
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <TrendingDown size={14} />
            Recording stock release — available quantity will be deducted. Negative stock is prevented.
          </div>
          <Select label="Item *" value={outForm.itemId} onChange={(e) => setOutForm({ ...outForm, itemId: e.target.value })} error={outErrors.itemId}>
            <option value="">Select inventory item...</option>
            {state.items.filter((i) => Boolean(i.warehouseId) && i.quantity > 0).map((i) => <option key={i.id} value={i.id}>{i.sku} — {i.name} (available: {i.quantity})</option>)}
          </Select>
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
          <Input label="Reference Number *" value={outForm.referenceNumber} onChange={(e) => setOutForm({ ...outForm, referenceNumber: e.target.value })} placeholder="SO-2024-001" error={outErrors.referenceNumber} />
          <Textarea label="Notes" value={outForm.notes} onChange={(e) => setOutForm({ ...outForm, notes: e.target.value })} placeholder="Release notes, destination, order reference..." />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowOutModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleStockOut}><TrendingDown size={14} /> Record Stock Out</Button>
        </div>
      </Modal>
    </div>
  );
}
