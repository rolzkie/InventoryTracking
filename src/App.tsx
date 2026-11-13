import { useState } from "react";
import { Box } from "lucide-react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/layout/Sidebar";
import TopNav from "./components/layout/TopNav";
import { ToastContainer } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import StockTransactions from "./pages/StockTransactions";
import BorrowReturns from "./pages/BorrowReturns";
import Categories from "./pages/Categories";
import ActivityLogs from "./pages/ActivityLogs";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ContactUs from "./pages/ContactUs";
import HelpGuide from "./pages/HelpGuide";

function AppContent() {
  const { state, dispatch, login, forgotPassword, showToast, refreshOperationalData } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPublicContact, setShowPublicContact] = useState(false);
  const [supportPage, setSupportPage] = useState<null | "help" | "contact">(null);

  // ─── Not authenticated → show login ───────────────────────────────────────
  if (!state.isAuthenticated) {
    return (
      <>
        {showPublicContact ? <ContactUs onBack={() => setShowPublicContact(false)} /> : <Login
          onLogin={async (email, password) => {
            const result = await login(email, password);
            if (result.success) {
              showToast(`Welcome back, ${result.user?.name ?? "User"}!`, "success");
            }
            return result;
          }}
          onForgotPassword={forgotPassword}
          onContactUs={() => setShowPublicContact(true)}
          darkMode={state.darkMode}
          onToggleTheme={() => dispatch({ type: "SET_DARK_MODE", value: !state.darkMode })}
        />}
        <ToastContainer />
      </>
    );
  }

  // ─── Authenticated → show ERP shell ────────────────────────────────────────
  const page = (() => {
    switch (state.currentPage) {
      case "dashboard": return <Dashboard />;
      case "inventory": return <Inventory />;
      case "stock-transactions": return <StockTransactions />;
      case "borrow-records": return <BorrowReturns />;
      case "categories": return <Categories />;
      case "activity-logs": return state.currentUser.role === "admin" ? <ActivityLogs /> : <Dashboard />;
      case "reports": return <Reports />;
      case "users":
        return state.currentUser.role === "admin"
          ? <Users />
          : <Dashboard />;
      case "settings": return state.currentUser.role === "admin" ? <Settings /> : <Dashboard />;
      default: return <Dashboard />;
    }
  })();

  return (
    <div className="app-shell min-h-screen bg-canvas text-content">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-60 flex flex-col min-h-screen min-w-0">
        <TopNav onMenuToggle={() => setSidebarOpen((v) => !v)} onOpenHelp={() => setSupportPage("help")} helpActive={supportPage !== null} />

        <main className="app-main flex-1 min-w-0 p-4 md:p-6 xl:p-7 overflow-auto">
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
          {supportPage === "help" ? <HelpGuide onContact={() => setSupportPage("contact")} onBack={() => setSupportPage(null)} />
            : supportPage === "contact" ? <ContactUs onBack={() => setSupportPage("help")} />
              : page}
        </main>

        <footer className="app-footer px-6 py-3 border-t text-center text-xs text-slate-500" style={{ borderColor: "var(--border-subtle)" }}>
          <span className="inline-flex items-center gap-2 justify-center">
            <Box size={12} className="text-slate-500" />
            <span>Inventory System 2026</span>
          </span>
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
