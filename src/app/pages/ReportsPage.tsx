import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import type { InventoryItem, Warehouse as WH } from "../../lib/api";
import { toast } from "../components/ui";

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
  const byWarehouse = warehouses.map((w) => ({
    name: w.name.split(" ")[0],
    value: inventory.filter((i) => i.warehouseId === w.id).reduce((s, i) => s + i.qty * i.cost, 0),
  }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue = inventory.reduce((s, i) => s + i.qty * i.cost, 0);

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
    const alerts = inventory.filter((i) => i.status !== "in_stock");
    const rows = [["ID", "Name", "SKU", "Qty", "Reorder Point", "Status", "Warehouse"]];
    alerts.forEach((i) => rows.push([i.id, i.name, i.sku, String(i.qty), String(i.reorderPoint), i.status, i.warehouseName ?? i.warehouseId]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `low-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast("success", "Low stock report exported");
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
        <h3 className="text-sm font-semibold text-foreground mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Inventory Summary", desc: "Full stock snapshot with valuations", action: exportInventory },
            { label: "Low Stock Report", desc: "Items below reorder threshold", action: exportLowStock },
            { label: "Warehouse Overview", desc: "Capacity and usage per facility", action: () => toast("info", "Coming soon") },
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

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Inventory Snapshot</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                { ["Category", "Items", "Total Qty", "Total Value", "Alerts"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                )) }
              </tr>
            </thead>
            <tbody>
              { ["Electronics", "Hardware", "Chemicals", "Packaging", "Raw Materials"].map((cat) => {
                const catItems = inventory.filter((i) => i.category === cat);
                if (!catItems.length) return null;
                return (
                  <tr key={cat} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{cat}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{catItems.length}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{catItems.reduce((s, i) => s + i.qty, 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>${catItems.reduce((s, i) => s + i.qty * i.cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      {catItems.filter((i) => i.status !== "in_stock").length > 0 ? (
                        <span className="text-xs text-amber-400" style={{ fontFamily: "JetBrains Mono, monospace" }}>{catItems.filter((i) => i.status !== "in_stock").length} alert{catItems.filter((i) => i.status !== "in_stock").length > 1 ? "s" : ""}</span>
                      ) : (
                        <span className="text-xs text-emerald-400">OK</span>
                      )}
                    </td>
                  </tr>
                );
              }) }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
