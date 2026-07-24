import { useState } from "react";
import { Eye, EyeOff, Box, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "m.torres@erp.com", password: "admin123", role: "Administrator" },
  { label: "Manager", email: "j.wong@erp.com", password: "manager123", role: "Logistics Manager" },
];

export default function Login({ onLogin, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    const result = await onLogin(email.trim(), password);
    if (!result.success) {
      setError(result.error ?? "Invalid credentials.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    const result = await onForgotPassword(email);
    setLoading(false);
    if (result.success) setNotice(result.message);
    else setError(result.message);
  };

  const handleQuickDemo = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
    setNotice("");
    setLoading(true);
    const result = await onLogin(acc.email, acc.password);
    if (!result.success) {
      setError(result.error ?? "Unable to access the demo account.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#0B1220" }}
    >
      {/* Left panel – branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f1c35 0%, #111827 60%, #0B1220 100%)" }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Box size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-100 leading-tight">WarehouseIQ</p>
            <p className="text-xs text-slate-500">Enterprise ERP Platform</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">Live Dashboard Active</span>
          </div>
          <h1 className="text-5xl font-black text-slate-100 leading-tight mb-4">
            Inventory &<br />Warehouse<br />
            <span style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Intelligence
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Unified control over your entire supply chain — real-time tracking, automated alerts, and comprehensive reporting across all your warehouses.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {["Real-time Tracking", "Auto Alerts", "PDF Reports", "Multi-Warehouse", "Stock Transfers", "PO Generation"].map((f) => (
              <span key={f} className="px-3 py-1.5 text-xs font-medium text-slate-300 rounded-full border border-[#2A3445] bg-[#1A2232]/60">
                {f}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[
              { value: "15+", label: "SKUs Tracked" },
              { value: "4", label: "Warehouses" },
              { value: "100%", label: "Live Data" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative p-4 rounded-2xl border border-[#2A3445] bg-[#1A2232]/50">
          <p className="text-sm text-slate-300 italic leading-relaxed">
            "WarehouseIQ gave us complete visibility across all four facilities — stock alerts alone saved us thousands in waste."
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              MT
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Michael Torres</p>
              <p className="text-[10px] text-slate-500">Operations Director, WarehouseIQ Corp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Box size={20} className="text-white" />
          </div>
          <p className="text-lg font-bold text-slate-100">WarehouseIQ</p>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to access your ERP dashboard</p>
          </div>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Quick Demo Access</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => void handleQuickDemo(acc)}
                  className="flex-1 py-2 px-3 text-xs font-medium rounded-xl border border-[#2A3445] text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-300 transition-all duration-150"
                >
                  <span className="block">{acc.label}</span>
                  <span className="block mt-0.5 text-[10px] text-slate-500">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2A3445]" />
            <span className="text-xs text-slate-600">or sign in manually</span>
            <div className="flex-1 h-px bg-[#2A3445]" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/25">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          {notice && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <Mail size={15} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300">{notice}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-[#2A3445] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Password</label>
                <button type="button" onClick={() => void handleForgotPassword()} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111827] border border-[#2A3445] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: loading ? "#2563EB" : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                boxShadow: loading ? "none" : "0 0 24px rgba(59,130,246,0.25)",
              }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          {/* Hint */}
          <p className="mt-6 text-center text-xs text-slate-600">
            Quick Demo: <span className="text-slate-500 font-mono">admin123</span> ·{" "}
            <span className="text-slate-500 font-mono">manager123</span>
          </p>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-700">
            WarehouseIQ ERP v2.4.0 · © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
