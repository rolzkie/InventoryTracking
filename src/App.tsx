import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/layout/Sidebar";
import TopNav from "./components/layout/TopNav";
import { ToastContainer } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Warehouses from "./pages/Warehouses";
import Transfers from "./pages/Transfers";
import StockTransactions from "./pages/StockTransactions";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

function AppContent() {
  const { state, login, forgotPassword, showToast, refreshOperationalData } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Not authenticated → show login ───────────────────────────────────────
  if (!state.isAuthenticated) {
    return (
      <>
        <Login
          onLogin={async (email, password) => {
            const result = await login(email, password);
            if (result.success) {
              showToast(`Welcome back, ${state.users.find(u => u.email.toLowerCase() === email.toLowerCase())?.name ?? "User"}!`, "success");
            }
            return result;
          }}
          onForgotPassword={forgotPassword}
        />
        <ToastContainer />
      </>
    );
  }

  // ─── Authenticated → show ERP shell ────────────────────────────────────────
  const page = (() => {
    switch (state.currentPage) {
      case "dashboard": return <Dashboard />;
      case "inventory": return <Inventory />;
      case "warehouses": return <Warehouses />;
      case "transfers": return <Transfers />;
      case "stock-transactions": return <StockTransactions />;
      case "reports": return <Reports />;
      case "users":
        return state.currentUser.role === "admin" || state.currentUser.role === "manager"
          ? <Users />
          : <Dashboard />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  })();

  return (
    <div className="app-shell min-h-screen" style={{ backgroundColor: "#0B1220" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNav onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {state.backendError && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              <span>Laravel API unavailable: {state.backendError}</span>
              <button
                type="button"
                className="rounded-lg border border-red-400/30 px-3 py-1.5 font-medium hover:bg-red-500/10"
                onClick={() => void refreshOperationalData().catch(() => undefined)}
              >
                Retry
              </button>
            </div>
          )}
          {state.loadingOperationalData && (
            <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-200">
              Loading operational data from Laravel…
            </div>
          )}
          {page}
        </main>

        <footer className="px-6 py-3 border-t text-center text-xs text-slate-600" style={{ borderColor: "#2A3445" }}>
          WarehouseIQ ERP System v2.4.0 · React 19 + Tailwind CSS v4 · Logged in as{" "}
          <span className="text-slate-500">{state.currentUser.name}</span>
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
