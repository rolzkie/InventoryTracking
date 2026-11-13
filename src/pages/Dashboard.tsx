import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Package,
  PackageMinus,
  PackagePlus,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import type { BorrowRecord } from "../types";
import { StatCard, Card, Badge, StatusBadge, Table, Th, Td, formatPHP } from "../components/ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

export default function Dashboard() {
  const { state, navigate } = useApp();
  const [borrowedRecords, setBorrowedRecords] = useState<BorrowRecord[]>([]);
  const [activityRows, setActivityRows] = useState<{ id: number; action: string; created_at: string; user?: { name: string } | null }[]>([]);

  useEffect(() => {
    let active = true;
    void api.borrowRecords.list().then((records) => {
      if (active) setBorrowedRecords(records);
    }).catch(() => undefined);
    if (state.currentUser.role === "admin") {
      void api.activityLogs.list().then((rows) => {
        if (active) setActivityRows(rows.slice(0, 4) as typeof activityRows);
      }).catch(() => undefined);
    } else {
      setActivityRows([]);
    }
    return () => { active = false; };
  }, [state.currentUser.role]);

  const stats = useMemo(() => {
    const totalSKUs = state.items.length;
    const activeAlerts = state.alerts.filter((a) => !a.acknowledged).length;
    const unassigned = state.assignableItems.length;
    const totalValue = state.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const lowStock = state.items.filter((i) => i.status === "low-stock").length;
    const outOfStock = state.items.filter((i) => i.status === "out-of-stock").length;
    const totalUnits = state.items.reduce((sum, item) => sum + item.quantity, 0);
    return { totalSKUs, activeAlerts, unassigned, totalValue, totalUnits, lowStock, outOfStock };
  }, [state.items, state.alerts, state.assignableItems]);

  const itemsBorrowed = borrowedRecords
    .filter((record) => record.status === "borrowed" || record.status === "overdue")
    .reduce((total, record) => total + record.outstandingQuantity, 0);
  const lowStockItems = [...state.items]
    .filter((item) => item.status === "low-stock" || item.status === "out-of-stock")
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 4);

  const movement = useMemo(() => {
    const current = new Date();
    const months = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(current.getFullYear(), current.getMonth() - 6 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleString("en", { month: "short" }),
      };
    });
    const totals = new Map(months.map((month) => [month.key, { inbound: 0, outbound: 0 }]));
    state.transactions.forEach((transaction) => {
      const month = totals.get(transaction.date.slice(0, 7));
      if (!month) return;
      if (transaction.type === "stock-in") month.inbound += transaction.quantity;
      else month.outbound += transaction.quantity;
    });
    const inbound = months.map((month) => totals.get(month.key)?.inbound ?? 0);
    const outbound = months.map((month) => totals.get(month.key)?.outbound ?? 0);
    return {
      labels: months.map((month) => month.label),
      inbound,
      outbound,
      net: inbound.reduce((sum, value) => sum + value, 0) - outbound.reduce((sum, value) => sum + value, 0),
    };
  }, [state.transactions]);

  const lineData = {
    labels: movement.labels,
    datasets: [
      {
        label: "Stock In",
        data: movement.inbound,
        borderColor: "#1B5E20",
        backgroundColor: "rgba(27,94,32,0.10)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#1B5E20",
        pointRadius: 4,
        borderWidth: 2,
      },
      {
        label: "Stock Out",
        data: movement.outbound,
        borderColor: "#F9A825",
        backgroundColor: "rgba(249,168,37,0.10)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#F9A825",
        pointRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    ...chartDefaults,
    plugins: {
      legend: {
        display: true,
        labels: { color: "#94A3B8", font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
    },
    scales: {
      x: { grid: { color: "rgba(42,52,69,0.5)" }, ticks: { color: "#64748B", font: { size: 11 } } },
      y: { grid: { color: "rgba(42,52,69,0.5)" }, ticks: { color: "#64748B", font: { size: 11 } } },
    },
  };

  // Category distribution
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    state.items.forEach((item) => {
      const cat = state.categories.find((c) => c.id === item.categoryId);
      if (cat) map[cat.name] = (map[cat.name] ?? 0) + item.quantity * item.unitCost;
    });
    return map;
  }, [state.items, state.categories]);

  const doughnutData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: ["#1B5E20", "#2E7D32", "#F9A825", "#EF6C00", "#757575", "#81C784"],
      borderColor: "#FAFAF5",
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    ...chartDefaults,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: { color: "#94A3B8", font: { size: 10 }, boxWidth: 10, padding: 12 },
      },
    },
    cutout: "65%",
  };

  const recentTransactions = state.transactions.slice(0, 5);
  const criticalAlerts = state.alerts.filter((a) => !a.acknowledged && a.severity === "critical");
  const warningAlerts = state.alerts.filter((a) => !a.acknowledged && a.severity === "warning");

  const alertIcon = { critical: <AlertCircle size={14} className="text-red-400" />, warning: <AlertTriangle size={14} className="text-amber-400" />, info: <Clock size={14} className="text-blue-400" /> };

  return (
    <div className="dashboard-page space-y-4">
      {/* Priority metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalSKUs.toLocaleString()}
          subtitle="Registered inventory items"
          icon={<Package size={18} />}
          color="green"
          className="dashboard-stat"
        />
        <StatCard
          title="Available Stocks"
          value={stats.totalUnits.toLocaleString()}
          subtitle="Units currently available"
          icon={<PackagePlus size={18} />}
          color="green"
          className="dashboard-stat"
        />
        <StatCard
          title="Low-Stock Items"
          value={stats.lowStock}
          subtitle={`${stats.outOfStock} out of stock`}
          icon={<AlertTriangle size={18} />}
          color="amber"
          className="dashboard-stat dashboard-stat-warning"
        />
        <StatCard
          title="Items Borrowed"
          value={itemsBorrowed.toLocaleString()}
          subtitle="Outstanding equipment loans"
          icon={<BookOpen size={18} />}
          color="blue"
          className="dashboard-stat"
        />
      </div>

      {/* Fast operational scan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Inventory Value", value: formatPHP(stats.totalValue), tone: "text-emerald-300" },
          { label: "Active Alerts", value: stats.activeAlerts, tone: "text-amber-300" },
          { label: "Out of Stock", value: stats.outOfStock, tone: "text-red-300" },
          { label: "Unassigned", value: stats.unassigned, tone: "text-slate-200" },
        ].map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-3.5 py-3 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</span>
            <span className={`text-sm font-bold tabular-nums ${metric.tone}`}>{metric.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="p-5 xl:col-span-7">
          <div className="dashboard-section-heading mb-4"><h3>Low-Stock List</h3></div>
          <Table>
            <thead><tr><Th>Item</Th><Th>SKU</Th><Th>Qty</Th><Th>Status</Th></tr></thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.id}>
                  <Td className="font-medium text-content">{item.name}</Td>
                  <Td className="font-mono text-xs">{item.sku}</Td>
                  <Td className="font-mono">{item.quantity} / {item.reorderPoint}</Td>
                  <Td><StatusBadge status={item.status} /></Td>
                </tr>
              ))}
              {lowStockItems.length === 0 && <tr><Td colSpan={4}>No low-stock products.</Td></tr>}
            </tbody>
          </Table>
        </Card>

        {state.currentUser.role === "admin" && <Card className="p-5 xl:col-span-5">
          <div className="dashboard-section-heading mb-4"><h3>Recent Activity</h3></div>
          <div className="divide-y divide-border-subtle">
            {activityRows.map((row) => (
              <div key={row.id} className="py-3 first:pt-0 last:pb-0">
                <time className="block font-mono text-xs text-content-subtle">{new Date(row.created_at).toLocaleString()}</time>
                <p className="mt-1 text-sm"><strong>{row.user?.name ?? "System"}</strong> {row.action}</p>
              </div>
            ))}
            {activityRows.length === 0 && <p className="py-4 text-sm text-content-muted">No recent activity.</p>}
          </div>
        </Card>}
      </div>

      <Card className="dashboard-recent-transactions p-5">
        <div className="dashboard-section-heading mb-4 flex items-center justify-between">
          <h3>Recent Transactions</h3>
          <button onClick={() => navigate("stock-transactions")} className="text-xs font-semibold uppercase text-content-muted hover:text-content">View all</button>
        </div>
        <Table>
          <thead><tr><Th>Date</Th><Th>Type</Th><Th>Product</Th><Th>Qty</Th><Th>User</Th></tr></thead>
          <tbody>
            {recentTransactions.map((txn) => {
              const item = state.items.find((i) => i.id === txn.itemId);
              return <tr key={txn.id}>
                <Td className="font-mono text-xs">{txn.date}</Td>
                <Td><StatusBadge status={txn.type} /></Td>
                <Td className="font-medium text-content">{item?.name ?? "Unknown"}</Td>
                <Td className="font-mono">{txn.type === "stock-in" ? "+" : "−"}{txn.quantity}</Td>
                <Td>{txn.processedBy || "—"}</Td>
              </tr>;
            })}
            {recentTransactions.length === 0 && <tr><Td colSpan={5}>No recent transactions.</Td></tr>}
          </tbody>
        </Table>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock Movement Line Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Stock Movement</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly In / Out trends</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp size={12} className="text-emerald-400" />
              <span className={movement.net >= 0 ? "text-emerald-400" : "text-red-400"}>
                {movement.net >= 0 ? "+" : ""}{movement.net.toLocaleString()} units net
              </span>
            </div>
          </div>
          <div className="h-48">
            <Line data={lineData} options={lineOptions} />
          </div>
        </Card>

        {/* Category Doughnut */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Category Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">By inventory value</p>
          </div>
          <div className="h-48">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </Card>
      </div>

      {/* Alerts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Alerts */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Active Alerts</h3>
            <button onClick={() => navigate("reports")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all</button>
          </div>
          <div className="space-y-2">
            {[...criticalAlerts, ...warningAlerts].slice(0, 5).map((alert) => {
              const item = state.items.find((i) => i.id === alert.itemId);
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${alert.severity === "critical" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                  {alertIcon[alert.severity]}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{item?.name ?? "Unknown Item"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{alert.message}</p>
                  </div>
                  <Badge variant={alert.severity === "critical" ? "red" : "amber"}>{alert.severity}</Badge>
                </div>
              );
            })}
            {criticalAlerts.length === 0 && warningAlerts.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 py-4">
                <CheckCircle size={16} />
                All clear — no active alerts
              </div>
            )}
          </div>
        </Card>

        {/* Existing transaction list remains on the page; the table above is its redesigned view. */}
        <Card className="dashboard-legacy-recent-transactions p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Recent Transactions</h3>
            <button onClick={() => navigate("stock-transactions")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all</button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((txn) => {
              const item = state.items.find((i) => i.id === txn.itemId);
              return (
                <div key={txn.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B1220]/50 hover:bg-[#0B1220] transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${txn.type === "stock-in" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                    {txn.type === "stock-in" ? (
                      <PackagePlus size={12} className="text-emerald-400" />
                    ) : (
                      <PackageMinus size={12} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{item?.name ?? "Unknown"}</p>
                    <p className="text-[10px] text-slate-500">{txn.referenceNumber} · {txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${txn.type === "stock-in" ? "text-emerald-400" : "text-red-400"}`}>
                      {txn.type === "stock-in" ? "+" : "-"}{txn.quantity}
                    </p>
                    <StatusBadge status={txn.type} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

    </div>
  );
}
