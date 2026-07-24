import { useMemo } from "react";
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
  Warehouse,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  GitBranch as GithubIcon,
  Cpu,
  Database,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { StatCard, Card, Badge, StatusBadge } from "../components/ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

export default function Dashboard() {
  const { state, navigate } = useApp();

  const stats = useMemo(() => {
    const totalSKUs = state.items.length;
    const totalWarehouses = state.warehouses.length;
    const activeAlerts = state.alerts.filter((a) => !a.acknowledged).length;
    const unassigned = state.items.filter((i) => !i.warehouseId).length;
    const totalValue = state.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const lowStock = state.items.filter((i) => i.status === "low-stock").length;
    const outOfStock = state.items.filter((i) => i.status === "out-of-stock").length;
    const pendingTransfers = state.transfers.filter((t) => t.status === "pending").length;
    return { totalSKUs, totalWarehouses, activeAlerts, unassigned, totalValue, lowStock, outOfStock, pendingTransfers };
  }, [state.items, state.warehouses, state.alerts, state.transfers]);

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
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3B82F6",
        pointRadius: 4,
        borderWidth: 2,
      },
      {
        label: "Stock Out",
        data: movement.outbound,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139,92,246,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#8B5CF6",
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
      backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"],
      borderColor: "#1A2232",
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
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total SKUs"
          value={stats.totalSKUs}
          subtitle={`${stats.lowStock} low stock`}
          icon={<Package size={18} />}
          color="blue"
        />
        <StatCard
          title="Warehouses"
          value={stats.totalWarehouses}
          subtitle="All operational"
          icon={<Warehouse size={18} />}
          color="purple"
        />
        <StatCard
          title="Stock Alerts"
          value={stats.activeAlerts}
          subtitle={`${stats.outOfStock} out of stock`}
          icon={<AlertTriangle size={18} />}
          color="red"
        />
        <StatCard
          title="Unassigned"
          value={stats.unassigned}
          subtitle="Pending warehouse"
          icon={<Package size={18} />}
          color="amber"
        />
        <StatCard
          title="Total Value"
          value={`$${(stats.totalValue / 1000).toFixed(0)}K`}
          subtitle={`${state.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} units`}
          icon={<DollarSign size={18} />}
          color="green"
        />
      </div>

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

        {/* Recent Transactions */}
        <Card className="p-5">
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
                    <TrendingUp size={12} className={txn.type === "stock-in" ? "text-emerald-400" : "text-red-400 rotate-180"} />
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

      {/* Warehouse Overview + Dev Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Warehouse Overview */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Warehouse Capacity</h3>
            <button onClick={() => navigate("warehouses")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Manage</button>
          </div>
          <div className="space-y-3">
            {state.warehouses.map((wh) => {
              const pct = Math.round((wh.used / wh.capacity) * 100);
              const itemCount = state.items.filter((i) => i.warehouseId === wh.id).length;
              return (
                <div key={wh.id} className="p-3 rounded-xl bg-[#0B1220]/50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-slate-200">{wh.name}</p>
                      <p className="text-[10px] text-slate-500">{wh.location} · {itemCount} SKUs · Mgr: {wh.manager}</p>
                    </div>
                    <span className={`text-xs font-bold ${pct > 85 ? "text-red-400" : pct > 60 ? "text-amber-400" : "text-emerald-400"}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-[#2A3445] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                    <span>{wh.used.toLocaleString()} used</span>
                    <span>{wh.capacity.toLocaleString()} capacity</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Developer Info */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">System Info</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Framework", value: "React 19 + Vite 8", icon: <Globe size={12} /> },
                { label: "Styling", value: "Tailwind CSS v4", icon: <Cpu size={12} /> },
                { label: "Charts", value: "Chart.js + react-chartjs-2", icon: <TrendingUp size={12} /> },
                { label: "Icons", value: "Lucide React", icon: <Package size={12} /> },
                { label: "Backend", value: "Laravel 12 API", icon: <Database size={12} /> },
                { label: "Database", value: "SQLite / MySQL", icon: <Database size={12} /> },
                { label: "Version", value: "WarehouseIQ v2.4.0", icon: <GithubIcon size={12} /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">Team</h3>
            </div>
            <div className="space-y-2">
              {state.users.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role} · {user.department}</p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${user.active ? "bg-emerald-400" : "bg-slate-600"}`} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
