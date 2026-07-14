import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Loader2, CalendarDays, FileText, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { StockTransaction, InventoryItem, Warehouse as WH } from "../../lib/api";
import { api } from "../../lib/api";
import { ConfirmDialog, FormField, inputCls, LoadingRow, Modal, EmptyRow, selectCls, toast } from "../components/ui";

const TRANSACTION_TYPES = [
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
];

export function TransactionsPage({ inventory, warehouses }: { inventory: InventoryItem[]; warehouses: WH[] }) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [confirm, setConfirm] = useState<StockTransaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTransactions(await api.transactions.list());
    } catch (err: any) {
      toast("error", err.message ?? "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return transactions.filter((transaction) => {
      const itemMatch = transaction.itemName.toLowerCase().includes(query);
      const warehouseMatch = transaction.warehouseName.toLowerCase().includes(query);
      const typeMatch = filterType === "all" || transaction.transactionType === filterType;
      const warehouseFilter = filterWarehouse === "all" || transaction.warehouseId === filterWarehouse;
      return (itemMatch || warehouseMatch) && typeMatch && warehouseFilter;
    });
  }, [search, filterType, filterWarehouse, transactions]);

  const warehouseOptions = useMemo(
    () => warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [warehouses]
  );

  function openCreateModal() {
    setShowModal(true);
  }

  function handleAdded(transaction: StockTransaction) {
    setTransactions((prev) => [transaction, ...prev]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:flex-1 sm:min-w-[12rem] sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className={`${inputCls} pl-9`} />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`${selectCls} w-auto`}>
          <option value="all">All Types</option>
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
        </select>
        <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className={`${selectCls} w-auto`}>
          <option value="all">All Warehouses</option>
          {warehouseOptions.map((warehouse) => (
            <option key={warehouse.value} value={warehouse.value}>{warehouse.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button onClick={openCreateModal} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={13} /> New Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{transactions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Last 24h</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{transactions.filter((transaction) => new Date(transaction.createdAt) >= new Date(Date.now() - 86400000)).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expiration Alerts</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{transactions.filter((transaction) => transaction.expirationDate && new Date(transaction.expirationDate) <= new Date(Date.now() + 7 * 86400000)).length}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                { ["Date", "Item", "Warehouse", "Type", "Qty", "Expires", "Notes"].map((header) => (
                  <th key={header} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">{header}</th>
                )) }
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRow cols={7} />
              ) : filtered.length === 0 ? (
                <EmptyRow cols={7} message="No transactions found" />
              ) : (
                filtered.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{transaction.itemName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{transaction.warehouseName}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{transaction.transactionType === "stock_in" ? "Stock In" : "Stock Out"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{transaction.quantity}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{transaction.expirationDate || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{transaction.notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TransactionModal
          inventory={inventory}
          warehouses={warehouses}
          onClose={() => setShowModal(false)}
          onSaved={(transaction) => {
            handleAdded(transaction);
            setShowModal(false);
          }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete Transaction"
          message={`Delete transaction ${confirm.id}? This cannot be restored.`}
          onConfirm={async () => {
            try {
              await api.transactions.delete(confirm.id);
              setTransactions((prev) => prev.filter((item) => item.id !== confirm.id));
              toast("success", "Transaction removed");
            } catch (err: any) {
              toast("error", err.message ?? "Delete failed");
            } finally {
              setConfirm(null);
            }
          }}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}
    </div>
  );
}

function TransactionModal({ warehouses, inventory, onClose, onSaved }: { warehouses: WH[]; inventory: InventoryItem[]; onClose: () => void; onSaved: (t: StockTransaction) => void }) {
  const assignedItems = inventory.filter((item) => item.warehouseId);
  const firstAssigned = assignedItems[0];
  const [form, setForm] = useState({
    transactionType: "stock_in",
    itemId: firstAssigned?.id ?? "",
    warehouseId: firstAssigned?.warehouseId ?? warehouses[0]?.id ?? "",
    quantity: "",
    expirationDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedItem = inventory.find((item) => item.id === form.itemId);

  useEffect(() => {
    if (!selectedItem && assignedItems.length > 0) {
      setForm((prev) => ({ ...prev, itemId: assignedItems[0].id, warehouseId: assignedItems[0].warehouseId }));
    }
  }, [assignedItems, selectedItem]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.itemId) errs.itemId = "Required";
    if (!form.warehouseId) errs.warehouseId = "Required";
    const qty = Number(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) errs.quantity = "Enter a positive quantity";
    if (form.transactionType === "stock_out" && selectedItem && qty > selectedItem.quantity) {
      errs.quantity = `Max available ${selectedItem.quantity}`;
    }
    if (selectedItem && selectedItem.warehouseId !== form.warehouseId) {
      errs.warehouseId = "Warehouse must match item location";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = await api.transactions.create({
        transactionType: form.transactionType as StockTransaction["transactionType"],
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        quantity: Number(form.quantity),
        expirationDate: form.expirationDate || undefined,
        notes: form.notes,
      });
      toast("success", "Transaction recorded successfully");
      onSaved(saved);
    } catch (err: any) {
      toast("error", err.message ?? "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  const currentWarehouse = warehouses.find((w) => w.id === form.warehouseId);

  return (
    <Modal title="New Stock Transaction" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Transaction Type" required>
            <select className={selectCls} value={form.transactionType} onChange={(e) => setForm((f) => ({ ...f, transactionType: e.target.value }))}>
              {TRANSACTION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Item" required error={errors.itemId}>
            <select className={selectCls} value={form.itemId} onChange={(e) => {
              const item = assignedItems.find((i) => i.id === e.target.value);
              setForm((f) => ({ ...f, itemId: e.target.value, warehouseId: item?.warehouseId ?? f.warehouseId }));
            }}>
              <option value="">Select item</option>
              {assignedItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Warehouse" required error={errors.warehouseId}>
            <select className={selectCls} value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}>
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantity" required error={errors.quantity}>
            <input className={inputCls} type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} style={{ fontFamily: "JetBrains Mono, monospace" }} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Expiration Date">
            <input className={inputCls} type="date" value={form.expirationDate} onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value }))} />
          </FormField>
          <FormField label="Notes">
            <input className={inputCls} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </FormField>
        </div>

        {selectedItem && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>{selectedItem.name} stock</span>
              <span className="font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{selectedItem.quantity} {selectedItem.unit}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <CalendarDays size={12} />
              <span>Warehouse: {currentWarehouse?.name ?? selectedItem.warehouseName ?? "Unassigned"}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
            {saving ? "Recording..." : "Save Transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
