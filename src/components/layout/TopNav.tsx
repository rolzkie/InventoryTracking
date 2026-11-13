import { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Settings, Package, Warehouse, TrendingUp, CircleHelp } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Page } from "../../types";

const pageLabels: Record<Page, string> = {
  dashboard: "Dashboard",
  inventory: "Products",
  warehouses: "Warehouses",
  transfers: "Transfers",
  "stock-transactions": "Transactions",
  "borrow-records": "Borrow & Return",
  categories: "Categories",
  "activity-logs": "Activity Logs",
  reports: "Reports",
  users: "Users",
  settings: "Settings",
};

const pageDescriptions: Record<Page, string> = {
  dashboard: "School inventory overview",
  inventory: "Track availability, value, and replenishment",
  warehouses: "Manage facilities, capacity, and zones",
  transfers: "Coordinate stock between locations",
  "stock-transactions": "Review stock received, issued, borrowed, and returned",
  "borrow-records": "Record equipment loans and returns",
  categories: "Manage school inventory categories",
  "activity-logs": "Review user and inventory activity",
  reports: "Resolve alerts and monitor performance",
  users: "Manage access across your operation",
  settings: "Configure your workspace",
};

export default function TopNav({ onMenuToggle, onOpenHelp, helpActive = false }: { onMenuToggle: () => void; onOpenHelp: () => void; helpActive?: boolean }) {
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
  const criticalAlertCount = state.alerts.filter((alert) => !alert.acknowledged && alert.severity === "critical").length;
  const actionAlertCount = state.alerts.filter((alert) => !alert.acknowledged && alert.severity === "warning").length;
  const infoAlertCount = state.alerts.filter((alert) => !alert.acknowledged && alert.severity === "info").length;
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
  const notificationState = criticalAlertCount > 0
    ? "critical"
    : actionAlertCount > 0
      ? "action"
      : unreadCount + infoAlertCount > 0
        ? "new"
        : "quiet";
  const stateUnreadCount = notificationState === "critical"
    ? criticalAlertCount
    : notificationState === "action"
      ? actionAlertCount
      : unreadCount + infoAlertCount;
  const notificationStateLabel = notificationState === "critical"
    ? `${criticalAlertCount} critical alert${criticalAlertCount === 1 ? "" : "s"}`
    : notificationState === "action"
      ? `${actionAlertCount} alert${actionAlertCount === 1 ? "" : "s"} need attention`
      : notificationState === "new"
        ? `${stateUnreadCount} new update${stateUnreadCount === 1 ? "" : "s"}`
        : "All caught up";
  const notificationAccessibleLabel = notificationState === "quiet"
    ? "Notifications. No new alerts."
    : `Notifications. ${notificationStateLabel}. ${unreadFeedCount} unread in the feed.`;
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
        return "stock-transactions" as const;
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
    setSearchResults(results);
  };

  const notifColors = { error: "bg-red-500/20 text-red-400", warning: "bg-amber-500/20 text-amber-400", info: "bg-blue-500/20 text-blue-400", success: "bg-emerald-500/20 text-emerald-400" };

  return (
    <header className="app-topbar sticky top-0 z-20 bg-canvas/90 backdrop-blur-md border-b border-border-subtle min-h-[68px] flex items-center px-4 md:px-6 gap-3 md:gap-5">
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} aria-label="Open navigation" className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors">
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div className="min-w-0">
        <h1 className="truncate text-base md:text-lg font-semibold tracking-tight text-slate-100">{pageLabels[state.currentPage]}</h1>
        <p className="hidden sm:block truncate text-[11px] text-slate-500">{pageDescriptions[state.currentPage]}</p>
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
            placeholder="Search products, SKUs..."
            aria-label="Search products and SKUs"
            className="pl-9 pr-3 py-2 w-36 sm:w-48 lg:w-60 rounded-lg bg-surface-raised border border-border-subtle text-content placeholder:text-content-subtle text-xs focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 transition-colors"
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
          type="button"
          aria-label={notificationAccessibleLabel}
          aria-expanded={showNotifications}
          aria-haspopup="dialog"
          title={notificationAccessibleLabel}
          data-alert-state={notificationState}
          className="notification-trigger relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1A2232] transition-colors"
        >
          <Bell className="notification-bell" size={17} aria-hidden="true" />
          {notificationState === "new" && <span className="notification-dot" aria-hidden="true" />}
          {stateUnreadCount > 0 && notificationState !== "new" && (
            <span className="notification-count" aria-hidden="true">
              {stateUnreadCount > 99 ? "99+" : stateUnreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div role="dialog" aria-label="Notifications" className="absolute top-full mt-1 right-0 w-80 bg-[#1A2232] border border-[#2A3445] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3445]">
              <div>
                <span className="block text-sm font-semibold text-slate-200">Notifications</span>
                <span className="notification-state-copy mt-1 flex items-center gap-1.5 text-[10px]" data-alert-state={notificationState}>
                  <span className="notification-state-dot" aria-hidden="true" />{notificationStateLabel}
                </span>
              </div>
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

      <div className="relative">
        <button type="button" aria-label="Help and FAQs" title="Help and FAQs" aria-current={helpActive ? "page" : undefined} onClick={() => { onOpenHelp(); setShowProfile(false); setShowNotifications(false); }} className={`topnav-help-button inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${helpActive ? "is-active" : ""}`}>
          <CircleHelp size={17} />
        </button>
      </div>      <div ref={profileRef} className="relative">
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
