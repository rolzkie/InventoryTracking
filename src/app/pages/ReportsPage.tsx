import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Printer, FileText, ArrowDownSquare } from "lucide-react";
import { api, type InventoryItem, type LowStockSummaryItem, type ReportSummary, type StockTransaction, type Warehouse as WH } from "../../lib/api";
import { inputCls, toast } from "../components/ui";

const CHART_DATA = [
  { month: "Jan", inbound: 1800, outbound: 1200 },
  { month: "Feb", inbound: 2100, outbound: 1600 },
  { month: "Mar", inbound: 2400, outbound: 1900 },
  { month: "Apr", inbound: 1600, outbound: 2200 },
  { month: "May", inbound: 3100, outbound: 2100 },
  { month: "Jun", inbound: 2700, outbound: 1800 },
  { month: "Jul", inbound: 3400, outbound: 2600 },
];

export function ReportsPage({ inventory, warehouses }: { inventory: InventoryItem[]; warehouses: WH[] }) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockSummaryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [minThreshold, setMinThreshold] = useState(50);
  const [maxThreshold, setMaxThreshold] = useState(500);
  const [reorderRequests, setReorderRequests] = useState<Array<{ id: string; sku: string; name: string; warehouse: string; currentQty: number; suggestedQty: number }>>([]);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      try {
        const [summaryData, lowStockData, transactionsData] = await Promise.all([
          api.reports.summary(),
          api.reports.lowStock(),
          api.transactions.list(),
        ]);
        if (!active) return;
        setSummary(summaryData);
        setLowStockItems(lowStockData);
        setTransactions(transactionsData);
      } catch (error: any) {
        toast("error", error?.message ?? "Failed to load report data");
      } finally {
        if (active) setLoading(false);
      }
    }

    const savedMin = Number(window.localStorage.getItem("inventory-min-threshold") ?? 50);
    const savedMax = Number(window.localStorage.getItem("inventory-max-threshold") ?? 500);
    const minValue = savedMin || 50;
    const maxValue = savedMax || 500;
    setMinThreshold(minValue);
    setMaxThreshold(maxValue);

    loadReports().then(() => {
      if (!active) return;
      setReorderRequests(buildReorderRequests());
    });

    return () => {
      active = false;
    };
  }, []);

  const byWarehouse = warehouses
    .map((w) => ({
      name: w.name.split(" ")[0],
      value: inventory.filter((i) => i.warehouseId === w.id).reduce((s, i) => s + i.qty * i.cost, 0),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const maxWarehouseValue = Math.max(1, ...byWarehouse.map((x) => x.value));

  const totalValue = summary?.totalValue ?? inventory.reduce((s, i) => s + i.qty * i.cost, 0);
  const lowStockCount = summary?.lowStockCount ?? inventory.filter((i) => i.status !== "in_stock").length;
  const outOfStockCount = summary?.outOfStockCount ?? inventory.filter((i) => i.quantity === 0).length;
  const warehouseCount = summary?.warehouseCount ?? warehouses.length;
  const inventoryCount = summary?.inventoryCount ?? inventory.length;
  const transferCount = summary?.transferCount ?? 0;
  const unassignedCount = summary?.unassignedCount ?? inventory.filter((i) => !i.warehouseId).length;

  const belowMinCount = inventory.filter((item) => item.quantity <= Math.max(minThreshold, item.reorderPoint)).length;
  const overMaxCount = inventory.filter((item) => maxThreshold > 0 && item.quantity >= maxThreshold).length;

  const expiringSoonCount = transactions.filter((transaction) => transaction.expirationDate && new Date(transaction.expirationDate) <= new Date(Date.now() + 7 * 86400000)).length;

  const expiringItems = useMemo(
    () => transactions.filter((transaction) => transaction.expirationDate && new Date(transaction.expirationDate) <= new Date(Date.now() + 7 * 86400000)),
    [transactions]
  );

  const reportCards = [
    { label: "Warehouses", value: warehouseCount },
    { label: "Inventory Items", value: inventoryCount },
    { label: "Transfers", value: transferCount },
    { label: "Unassigned", value: unassignedCount },
    { label: "Low Stock", value: lowStockCount },
    { label: "Expiring Soon", value: expiringSoonCount },
    { label: "Out of Stock", value: outOfStockCount },
  ];

  function exportInventory() {
    const rows = [["ID", "Name", "SKU", "Category", "Warehouse", "Qty", "Unit", "Cost", "Total Value", "Status"]];
    inventory.forEach((i) => rows.push([i.id, i.name, i.sku, i.category, i.warehouseName ?? i.warehouseId, String(i.qty), i.unit, String(i.cost), String((i.qty * i.cost).toFixed(2)), i.status]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "Inventory report exported");
  }

  function exportLowStock() {
    const alerts = lowStockItems.length ? lowStockItems : inventory.filter((i) => i.status !== "in_stock");
    const rows = [["ID", "Name", "SKU", "Qty", "Reorder Point", "Status", "Warehouse"]];
    alerts.forEach((i) => rows.push([i.id, i.name, i.sku, String(i.quantity), String(i.reorderPoint), i.status ?? "", i.warehouseName ?? ""]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `low-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "Low stock report exported");
  }

  function saveThresholds() {
    window.localStorage.setItem("inventory-min-threshold", String(minThreshold));
    window.localStorage.setItem("inventory-max-threshold", String(maxThreshold));
    toast("success", "Stock threshold settings saved");
  }

  function buildReorderRequests() {
    return inventory
      .filter((item) => item.quantity <= Math.max(minThreshold, item.reorderPoint))
      .map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        warehouse: item.warehouseName ?? item.warehouseId,
        currentQty: item.quantity,
        suggestedQty: Math.max(Math.max(minThreshold, item.reorderPoint) * 2 - item.quantity, Math.max(minThreshold, item.reorderPoint)),
      }));
  }

  function generateReorderRequests() {
    const requests = buildReorderRequests();
    setReorderRequests(requests);
    toast("success", `${requests.length} reorder request${requests.length === 1 ? "" : "s"} generated`);
  }

  function exportPdf() {
    window.print();
  }

  function printReport() {
    window.print();
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
            {byWarehouse.map((r) => (
              <div key={r.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground font-medium">{r.name}</span>
                  <span className="text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(r.value / Math.max(...byWarehouse.map((x) => x.value))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <span className="text-xs text-muted-foreground">Total inventory value</span>
            <span className="text-xs font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Inventory Thresholds</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Minimum Stock Threshold</label>
            <input className={inputCls} type="number" min="0" value={minThreshold} onChange={(e) => setMinThreshold(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Maximum Stock Threshold</label>
            <input className={inputCls} type="number" min="0" value={maxThreshold} onChange={(e) => setMaxThreshold(Number(e.target.value))} />
          </div>
          <div className="flex flex-col justify-between gap-3">
            <button onClick={saveThresholds} className="w-full px-4 py-3 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Save Settings</button>
            <div className="rounded-lg border border-border p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">Below min</p>
              <p className="text-2xl font-semibold text-foreground">{belowMinCount}</p>
              <p className="text-[11px] text-muted-foreground">Items at or below minimum</p>
            </div>
            <div className="rounded-lg border border-border p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">Above max</p>
              <p className="text-2xl font-semibold text-foreground">{overMaxCount}</p>
              <p className="text-[11px] text-muted-foreground">Potential overstock items</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Export Reports</h3>
            <p className="text-xs text-muted-foreground mt-1">Export in Excel, PDF, or print the latest inventory insights.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportInventory} className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-lg hover:border-white/15 hover:bg-white/[0.02] transition-colors">
              <ArrowDownSquare size={14} /> Excel
            </button>
            <button onClick={exportPdf} className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-lg hover:border-white/15 hover:bg-white/[0.02] transition-colors">
              <FileText size={14} /> PDF
            </button>
            <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-lg hover:border-white/15 hover:bg-white/[0.02] transition-colors">
              <Printer size={14} /> Print
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Inventory Summary", desc: "Full stock snapshot with valuations", action: exportInventory },
            { label: "Low Stock Report", desc: "Items below reorder threshold", action: exportLowStock },
            { label: "Reorder Requests", desc: "Generate purchase requisitions for restock", action: generateReorderRequests },
          ].map((r) => (
            <button key={r.label} onClick={r.action} className="border border-border rounded-lg p-4 flex items-center justify-between hover:border-white/15 hover:bg-white/[0.02] transition-colors group text-left">
              <div>
                <p className="text-xs font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
              <Download size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-3" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Low Stock Alerts</h3>
            <p className="text-xs text-muted-foreground">{summary ? `Updated ${new Date(summary.generatedAt).toLocaleString()}` : "Loading latest report data..."}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["SKU", "Name", "Quantity", "Reorder Point", "Warehouse", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(loading ? Array.from({ length: 3 }) : lowStockItems).map((item, idx) => {
                if (loading) {
                  return (
                    <tr key={`loading-${idx}`} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground" colSpan={6}>Loading low stock items…</td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground">{item.sku}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-xs text-amber-400">{item.status}</td>
                  </tr>
                );
              })}
              {!loading && lowStockItems.length === 0 && (
                <tr className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground" colSpan={6}>No low stock alerts at the moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-border bg-slate-950/5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Reorder Requests</h4>
              <p className="text-xs text-muted-foreground mt-1">Automatically generated purchase suggestions for low-stock items.</p>
            </div>
            <button onClick={generateReorderRequests} className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Generate Reorder Requests</button>
          </div>
          {reorderRequests.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["SKU", "Item", "Warehouse", "Current Qty", "Suggested Qty"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reorderRequests.map((request) => (
                    <tr key={request.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-foreground">{request.sku}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{request.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{request.warehouse}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{request.currentQty}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{request.suggestedQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-3">No reorder requests generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
