import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  ChevronRight,
  AlertTriangle,
  Box,
  Activity,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Page } from "../../types";

const navItems: { id: Page; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "dashboard", label: "Command center", icon: <LayoutDashboard size={18} /> },
  { id: "inventory", label: "Inventory", icon: <Package size={18} /> },
  { id: "warehouses", label: "Warehouses", icon: <Warehouse size={18} /> },
  { id: "transfers", label: "Transfers", icon: <ArrowLeftRight size={18} /> },
  { id: "stock-transactions", label: "Stock movements", icon: <TrendingUp size={18} /> },
  { id: "reports", label: "Reports & Alerts", icon: <BarChart3 size={18} /> },
  { id: "users", label: "Users", icon: <Users size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, navigate } = useApp();
  const canManageAccounts = state.currentUser.role === "admin" || state.currentUser.role === "manager";
  const unacknowledgedAlerts = state.alerts.filter((a) => !a.acknowledged).length;
  const pendingTransfers = state.transfers.filter((t) => t.status === "pending").length;

  const badges: Partial<Record<Page, number>> = {
    reports: unacknowledgedAlerts,
    transfers: pendingTransfers,
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar fixed top-0 left-0 h-full w-60 bg-surface border-r border-border-subtle z-30 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-950/30">
            <Box size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-slate-100 leading-tight">Inventory System</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Inventory OS</p>
          </div>
        </div>

        <div className="sidebar-status-card mx-3 mt-4 mb-2 rounded-xl border border-border-subtle bg-surface-raised px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Network status</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Live</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <Activity size={12} className="text-cyan-300" />
            <span>{state.warehouses.length} locations online</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-[0.18em]">Workspace</p>
          <ul className="space-y-0.5">
            {navItems.filter((item) => item.id !== "users" || canManageAccounts).map((item) => {
              const isActive = state.currentPage === item.id;
              const badge = badges[item.id];
              return (
                <li key={item.id}>
                  <button
                    onClick={() => { navigate(item.id); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                      isActive
                        ? "bg-cyan-400/10 text-cyan-200 border border-cyan-300/15 shadow-inner shadow-cyan-950/10"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                  >
                    <span className={`${isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={12} className="text-cyan-300" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Alert summary */}
          {unacknowledgedAlerts > 0 && (
            <div className="mt-4 mx-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400">Active Alerts</span>
              </div>
              <p className="text-xs text-slate-400">{unacknowledgedAlerts} unacknowledged alerts require attention</p>
              <button
                onClick={() => { navigate("reports"); onClose(); }}
                className="mt-2 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                View All →
              </button>
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="px-3 py-3 border-t border-border-subtle">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1A2232] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {state.currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{state.currentUser.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{state.currentUser.role}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
