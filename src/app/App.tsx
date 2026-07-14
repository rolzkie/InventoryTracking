import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowLeftRight, BarChart3, Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Package, Search, Sun, Warehouse } from "lucide-react";
import { api, type DashboardStats, type InventoryItem, type Warehouse as WH } from "../lib/api";
import { initializeSeedData } from "../lib/seed-data";
import { toast, Toaster, inputCls, NotificationsPanel } from "./components/ui";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { WarehousesPage } from "./pages/WarehousesPage";
import { TransfersPage } from "./pages/TransfersPage";
import { ReportsPage } from "./pages/ReportsPage";
import type { Page } from "./types";
import type { LucideIcon } from "lucide-react";

const NAV: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "warehouses", label: "Warehouses", icon: Warehouse },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { id: "transactions", label: "Transactions", icon: ArrowDownRight },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const initialized = useRef(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const loadGlobal = useCallback(async () => {
    try {
      setGlobalError(null);
      const [whs, inv, statsData] = await Promise.all([api.warehouses.list(), api.inventory.list(), api.dashboard()]);
      setWarehouses(whs);
      setInventory(inv);
      setStats(statsData);
    } catch (error: any) {
      const message = error?.message ?? "Failed to load data";
      setGlobalError(message);
      toast("error", message);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const savedTheme = window.localStorage.getItem("stockos-theme") as "dark" | "light" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    initializeSeedData();
    loadGlobal();
  }, [loadGlobal]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("stockos-theme", theme);
  }, [theme]);

  const alertCount = (stats?.lowStock ?? 0) + (stats?.outOfStock ?? 0);
  const reportCount = Math.max(1, Math.min(4, Math.ceil((stats?.totalSkus ?? inventory.length) / 10)));

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = !normalizedSearch
    ? []
    : [
        ...inventory
          .filter((item) => [item.name, item.sku, item.category].some((value) => value?.toLowerCase().includes(normalizedSearch)))
          .slice(0, 4)
          .map((item) => ({ id: item.id, label: `${item.name} (${item.sku})`, detail: "Inventory item", page: "inventory" as Page })),
        ...warehouses
          .filter((warehouse) => [warehouse.name, warehouse.location, warehouse.manager].some((value) => value?.toLowerCase().includes(normalizedSearch)))
          .slice(0, 3)
          .map((warehouse) => ({ id: warehouse.id, label: `${warehouse.name} · ${warehouse.location}`, detail: "Warehouse", page: "warehouses" as Page })),
      ].slice(0, 6);

  function openSearchResult(result: { page: Page; id: string }) {
    setPage(result.page);
    setSearchQuery("");
    setSearchOpen(false);
    setSidebarOpen(false);
  }

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-background overflow-hidden lg:h-screen" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
      <Toaster />

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className="fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 lg:relative lg:translate-x-0">
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <Package size={14} className="text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">StockOS</span>
            <span className="text-xs text-muted-foreground block leading-none" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              ERP v2.4
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground px-3 py-2 mt-1 tracking-wider">MAIN MENU</p>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            const badge = id === "inventory" ? alertCount : 0;
            return (
              <button
                key={id}
                onClick={() => {
                  setPage(id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium transition-all ${
                  active ? "bg-sidebar-accent/60 text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <Icon size={15} className={active ? "text-primary" : "text-muted-foreground"} />
                {label}
                {badge > 0 && (
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          <p className="text-xs font-medium text-muted-foreground px-3 py-2 mt-3 tracking-wider">SYSTEM</p>
          {[
            { label: "Users", icon: LayoutDashboard },
            { label: "Settings", icon: Warehouse },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all"
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/60 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">SC</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Sarah Chen</p>
              <p className="text-xs text-muted-foreground truncate">Warehouse Admin</p>
            </div>
            <LogOut size={13} className="text-muted-foreground" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="min-h-14 flex flex-wrap items-center gap-3 px-4 lg:px-6 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-foreground capitalize">{page}</h1>
          <div className="flex-1" />
          <div className="relative hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(Boolean(e.target.value.trim()));
                }}
                onFocus={() => setSearchOpen(Boolean(searchQuery.trim()))}
                placeholder="Quick search..."
                className={`${inputCls} pl-9 w-full sm:w-56`}
              />
            </div>
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-xl border border-border bg-card shadow-2xl">
                {searchResults.length > 0 ? (
                  <div className="max-h-72 overflow-auto p-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.page}-${result.id}`}
                        onClick={() => openSearchResult(result)}
                        className="flex w-full items-start justify-between rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-white/5"
                      >
                        <span>
                          <span className="block font-medium">{result.label}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{result.detail}</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{result.page}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-xs text-muted-foreground">No matching inventory or warehouse results.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors" aria-label="Toggle color mode">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <div ref={notificationRef} className="relative">
              <button onClick={() => setNotificationsOpen((open) => !open)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors">
                <Bell size={15} />
              </button>
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
                  {alertCount}
                </span>
              )}
              {notificationsOpen && (
                <NotificationsPanel reportCount={reportCount} alertCount={alertCount} onNavigate={setPage} onClose={() => setNotificationsOpen(false)} />
              )}
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">SC</div>
              <ChevronDown size={12} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {globalError ? (
            <div className="flex flex-col gap-3 bg-card border border-red-500/30 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-300">Failed to load data</p>
                  <p className="text-xs text-red-200/80 mt-1">{globalError}</p>
                </div>
                <button onClick={loadGlobal} className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
                  Retry
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Please check the API connection and database configuration.</p>
            </div>
          ) : (
            <>
              {page === "dashboard" && <DashboardPage stats={stats} onNavigate={setPage} />}
              {page === "inventory" && <InventoryPage warehouses={warehouses} />}
              {page === "warehouses" && <WarehousesPage warehouses={warehouses} setWarehouses={setWarehouses} />}
              {page === "transfers" && <TransfersPage warehouses={warehouses} inventory={inventory} />}
              {page === "transactions" && <TransactionsPage inventory={inventory} warehouses={warehouses} />}
              {page === "reports" && <ReportsPage inventory={inventory} warehouses={warehouses} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
