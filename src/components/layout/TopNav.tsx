import { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Settings, Package, Warehouse, TrendingUp } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Page } from "../../types";

const pageLabels: Record<Page, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  warehouses: "Warehouses",
  transfers: "Transfers",
  "stock-transactions": "Stock Transactions",
  reports: "Reports & Alerts",
  users: "Users",
  settings: "Settings",
};

export default function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const {
    state,
    dispatch,
    navigate,
    showToast,
    logout,
    acknowledgeAlert,
    markNotificationRead,
    markAllNotificationsRead,
    setDarkMode,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ label: string; type: string; page: Page }[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = state.notifications.filter((n) => !n.read).length;
  const recentNotifications = [...state.notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const alertNotifications = [...state.alerts]
    .filter((alert) => !alert.acknowledged)
    .map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.type.replace("-", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      message: alert.message,
      type: alert.severity === "critical" ? "error" : alert.severity === "warning" ? "warning" : "info",
      read: alert.acknowledged,
      createdAt: alert.createdAt,
      source: "alert",
    }));
  const combinedFeed = [...alertNotifications, ...recentNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const unreadFeedCount = combinedFeed.filter((entry) => !entry.read).length;
  const formatFeedTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };
  const routeForNotification = (title: string) => {
    switch (title) {
      case "Stock In":
      case "Stock Out":
        return "stock-transactions" as const;
      case "Transfer Completed":
        return "transfers" as const;
      case "Reorder Request":
      case "Reorder Updated":
        return "reports" as const;
      case "Inventory Updated":
      case "Low Stock":
      case "Out of Stock":
      case "Overstock":
        return "inventory" as const;
      default:
        return "reports" as const;
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const results: { label: string; type: string; page: Page }[] = [];
    const ql = q.toLowerCase();
    state.items.filter((i) => i.name.toLowerCase().includes(ql) || i.sku.toLowerCase().includes(ql)).slice(0, 3).forEach((i) => {
      results.push({ label: `${i.sku} — ${i.name}`, type: "Inventory", page: "inventory" });
    });
    state.warehouses.filter((w) => w.name.toLowerCase().includes(ql)).slice(0, 2).forEach((w) => {
      results.push({ label: w.name, type: "Warehouse", page: "warehouses" });
    });
    setSearchResults(results);
  };

  const notifColors = { error: "bg-red-500/20 text-red-400", warning: "bg-amber-500/20 text-amber-400", info: "bg-blue-500/20 text-blue-400", success: "bg-emerald-500/20 text-emerald-400" };

  return (
    <header className="sticky top-0 z-20 bg-[#0B1220]/90 backdrop-blur-md border-b border-[#2A3445] h-14 flex items-center px-4 gap-3">
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A2232] transition-colors">
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div className="hidden sm:block">
        <span className="text-sm font-semibold text-slate-200">{pageLabels[state.currentPage]}</span>
      </div>

      <div className="flex-1" />

      {/* Global Search */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSearch(true)}
            placeholder="Quick search..."
            className="pl-9 pr-4 py-1.5 w-48 md:w-64 rounded-lg bg-[#1A2232] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 right-0 w-72 bg-[#1A2232] border border-[#2A3445] rounded-xl shadow-xl overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => { navigate(r.page); setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#2A3445] transition-colors"
              >
                <span className="text-xs text-slate-200">{r.label}</span>
                <span className="text-[10px] text-slate-500 bg-[#2A3445] px-2 py-0.5 rounded">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={() => void setDarkMode(!state.darkMode).catch((error) => showToast(error instanceof Error ? error.message : "Unable to save theme", "error"))}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A2232] transition-colors"
        title="Toggle theme"
      >
        {state.darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => { setShowNotifications((v) => !v); setShowProfile(false); }}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A2232] transition-colors"
        >
          <Bell size={16} />
          {unreadFeedCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadFeedCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute top-full mt-1 right-0 w-80 bg-[#1A2232] border border-[#2A3445] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3445]">
              <span className="text-sm font-semibold text-slate-200">Notifications</span>
              <button
                onClick={() => void markAllNotificationsRead().catch((error) => showToast(error instanceof Error ? error.message : "Unable to update notifications", "error"))}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#2A3445]/50">
              {combinedFeed.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs font-medium text-slate-300">No notifications yet</p>
                  <p className="mt-1 text-[11px] text-slate-500">Alerts and system updates will appear here.</p>
                </div>
              )}
              {combinedFeed.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (String(n.id).startsWith("alert-")) {
                      const alertId = String(n.id).replace(/^alert-/, "");
                      dispatch({
                        type: "ACKNOWLEDGE_ALERT",
                        id: alertId,
                      });
                      void acknowledgeAlert(alertId).catch((error) => showToast(error instanceof Error ? error.message : "Unable to update alert", "error"));
                      navigate("reports");
                      setShowNotifications(false);
                      return;
                    }
                    dispatch({ type: "MARK_NOTIFICATION_READ", id: n.id });
                    navigate(routeForNotification(n.title));
                    setShowNotifications(false);
                    void markNotificationRead(n.id).catch((error) => showToast(error instanceof Error ? error.message : "Unable to update notification", "error"));
                  }}
                  className={`w-full flex gap-3 px-4 py-3 text-left transition-colors hover:bg-[#2A3445]/50 focus:bg-[#2A3445]/50 ${n.read ? "opacity-60" : ""}`}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? "bg-slate-600" : "bg-blue-400"}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{formatFeedTime(n.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => { setShowProfile((v) => !v); setShowNotifications(false); }}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#1A2232] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {state.currentUser.avatar}
          </div>
          <span className="hidden sm:block text-xs font-medium text-slate-300">{state.currentUser.name.split(" ")[0]}</span>
          <ChevronDown size={12} className="text-slate-500" />
        </button>

        {showProfile && (
          <div className="absolute top-full mt-1 right-0 w-52 bg-[#1A2232] border border-[#2A3445] rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A3445]">
              <p className="text-xs font-semibold text-slate-200">{state.currentUser.name}</p>
              <p className="text-[10px] text-slate-500">{state.currentUser.email}</p>
              <span className="mt-1 inline-block text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full capitalize">{state.currentUser.role}</span>
            </div>
            {[
              { icon: <User size={13} />, label: "My Profile", action: () => navigate("settings") },
              { icon: <Settings size={13} />, label: "Settings", action: () => navigate("settings") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); setShowProfile(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:bg-[#2A3445] transition-colors"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="border-t border-[#2A3445]">
              <button
                onClick={() => { void logout(); showToast("You have been signed out", "info"); setShowProfile(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
