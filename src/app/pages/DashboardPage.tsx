import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, BarChart, CheckCircle, Package, Warehouse, TrendingUp } from "lucide-react";
import type { DashboardStats } from "../../lib/api";
import { DeveloperCard, KpiCard, StatusBadge } from "../components/ui";
import { TeamMemberCard } from "../components/TeamMemberCard";
import { developmentTeam } from "../components/development-team-data";

const CHART_DATA = [
  { month: "Jan", inbound: 1800, outbound: 1200 },
  { month: "Feb", inbound: 2100, outbound: 1600 },
  { month: "Mar", inbound: 2400, outbound: 1900 },
  { month: "Apr", inbound: 1600, outbound: 2200 },
  { month: "May", inbound: 3100, outbound: 2100 },
  { month: "Jun", inbound: 2700, outbound: 1800 },
  { month: "Jul", inbound: 3400, outbound: 2600 },
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

export function DashboardPage({ stats, onNavigate }: { stats: DashboardStats | null; onNavigate: (page: "dashboard" | "inventory" | "warehouses" | "transfers" | "reports") => void; }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full border border-current border-t-transparent w-5 h-5" />
          <span className="text-xs">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const catData = [
    { name: "Electronics", value: 34 },
    { name: "Hardware", value: 22 },
    { name: "Chemicals", value: 18 },
    { name: "Packaging", value: 15 },
    { name: "Raw Materials", value: 11 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard icon={Package} label="Total SKUs" value={stats.totalSkus} sub="Active items" color="bg-blue-500/15 text-blue-400" />
        <KpiCard icon={Warehouse} label="Warehouses" value={stats.warehouseCount} sub="All operational" color="bg-purple-500/15 text-purple-400" />
        <KpiCard icon={AlertTriangle} label="Stock Alerts" value={stats.lowStock + stats.outOfStock} sub={`${stats.outOfStock} out • ${stats.lowStock} low`} color="bg-amber-500/15 text-amber-400" />
        <KpiCard icon={CheckCircle} label="Unassigned Items" value={stats.unassigned} sub="Needs warehouse" color="bg-slate-500/15 text-slate-400" />
        <KpiCard icon={TrendingUp} label="Total Value" value={`$${(stats.totalValue / 1000).toFixed(0)}k`} sub="Inventory value" color="bg-emerald-500/15 text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Stock Movement</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Inbound vs outbound — last 7 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Inbound</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Outbound</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1c2230", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} fill="url(#inG)" name="Inbound" />
              <Area type="monotone" dataKey="outbound" stroke="#10b981" strokeWidth={2} fill="url(#outG)" name="Outbound" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">By Category</h3>
          <p className="text-xs text-muted-foreground mb-3">Distribution</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1c2230", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {catData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="text-foreground font-medium" style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.alerts.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" /> Stock Alerts</h3>
            <button onClick={() => onNavigate("inventory")} className="text-xs text-primary hover:underline">View all →</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {stats.alerts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${a.alertType === "out_of_stock" ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                <div>
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "JetBrains Mono, monospace" }}>{a.sku} • {a.warehouseId}</p>
                </div>
                <StatusBadge status={a.alertType} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Developer Section</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Build and handoff summary</p>
          </div>
          <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2.5 py-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>ERP v2.4</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <DeveloperCard title="React + TypeScript" subtitle="Frontend" description="Dashboard shell, filters, and analytics views." badge="Active" icon={Package} tone="bg-blue-500/15 text-blue-400" />
          <DeveloperCard title="Laravel API" subtitle="Backend" description="Inventory, warehouse, and transfer service endpoints." badge="Online" icon={Warehouse} tone="bg-emerald-500/15 text-emerald-400" />
          <DeveloperCard title="Alerts & Analytics" subtitle="Reports" description="Operational summaries, stock thresholds, and sign-off views." badge="Review" icon={BarChart} tone="bg-amber-500/15 text-amber-400" />
          <DeveloperCard title="Developer Handoff" subtitle="Support" description="UI components, extension points, and release notes ready." badge="Ready" icon={TrendingUp} tone="bg-purple-500/15 text-purple-400" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Development Team</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">The engineers and designers building and maintaining StockOS</p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>Team</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {developmentTeam.map((person) => (
            <TeamMemberCard key={person.name} member={person} />
          ))}
        </div>
      </div>
    </div>
  );
}
