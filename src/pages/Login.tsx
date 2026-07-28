import { useEffect, useState } from "react";
import { Eye, EyeOff, Box, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const RECENT_LOGINS_KEY = "warehouseiq.recent-logins";

type RecentLogin = {
  email: string;
  name: string;
  role: string;
  lastLogin: string;
};

export default function Login({ onLogin, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_LOGINS_KEY);
      if (!raw) return;
      setRecentLogins(JSON.parse(raw) as RecentLogin[]);
    } catch {
      setRecentLogins([]);
    }
  }, []);

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

  const handleQuickLogin = (acc: RecentLogin) => {
    setEmail(acc.email);
    setError("");
    setNotice("");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#0B1220" }}
    >
      {/* Left panel – branding */}
      <div
        className="hidden lg:flex w-[52%] min-w-0 flex-col justify-start gap-10 px-10 py-10 xl:px-12 xl:py-12 relative overflow-hidden"
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
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Box size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-100 leading-tight">Inventory and Warehouse</p>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">Live Dashboard Active</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-slate-100 leading-[0.95] tracking-tight mb-4 max-w-md">
            Inventory &<br />Warehouse<br />
            <span style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              System
            </span>
          </h1>
          <p className="text-sm xl:text-base text-slate-400 leading-relaxed max-w-md">
           Take full control of your inventory and warehouse operations with a centralized ERP solution. Monitor stock levels in real time, automate inventory processes, manage multiple warehouses, and generate insightful reports—all from one powerful dashboard.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 xl:mt-10 max-w-md">
            {[
              { value: "15+", label: "SKUs Tracked" },
              { value: "4", label: "Warehouses" },
              { value: "100%", label: "Live Data" },
            ].map((s) => (
              <div key={s.label} className="min-w-0">
                <p className="text-xl xl:text-2xl font-black text-slate-100 leading-none">{s.value}</p>
                <p className="mt-1 text-[11px] xl:text-xs text-slate-500 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 lg:px-16 lg:py-0 lg:justify-center relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Box size={20} className="text-white" />
          </div>
          <p className="text-lg font-bold text-slate-100">Inventory Warehouse Management System</p>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to access your ERP dashboard</p>
          </div>

          {/* Recent saved log ins */}
          <div className="mb-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Recent Saved Log Ins</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {recentLogins.length > 0 ? recentLogins.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc)}
                  className="py-2 px-3 text-xs font-medium rounded-xl border border-[#2A3445] text-slate-300 transition-all duration-150 hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-300"
                >
                  <span className="block">{acc.name}</span>
                  <span className="block mt-0.5 text-[10px] text-slate-600">{acc.role}</span>
                  <span className="block mt-0.5 text-[10px] text-slate-600">
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(acc.lastLogin))}
                  </span>
                </button>
              )) : (
                <div className="col-span-full rounded-xl border border-[#2A3445] bg-[#111827] px-3 py-4 text-xs text-slate-500">
                  Your recent logins will appear here after a successful sign in.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#2A3445]" />
            <span className="text-xs text-slate-400">or sign in manually</span>
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
          <form onSubmit={handleSubmit} className="space-y-3">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111827] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors pointer-events-auto"
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
                  "Sign In"
                )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-700">
            Inventory and Warehouse Management System 2026
          </p>
        </div>
      </div>
    </div>
  );
}
