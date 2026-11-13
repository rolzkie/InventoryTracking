import { useEffect, useState } from "react";
import {
  ArrowRight,
  AlertCircle,
  Box,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  onContactUs: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const RECENT_LOGINS_KEY = "warehouseiq.recent-logins";

type RecentLogin = {
  email: string;
  name: string;
  role: string;
  lastLogin: string;
};

const binStatuses = [
  { id: "A-01", level: 76, status: "Stocked" },
  { id: "A-02", level: 48, status: "Stocked" },
  { id: "A-03", level: 88, status: "Stocked" },
  { id: "A-04", level: 40, status: "Stocked" },
  { id: "B-01", level: 70, status: "Stocked" },
  { id: "B-02", level: 16, status: "Low" },
  { id: "B-03", level: 80, status: "Stocked" },
  { id: "B-04", level: 60, status: "Stocked" },
  { id: "C-01", level: 0, status: "Out" },
  { id: "C-02", level: 63, status: "Stocked" },
  { id: "C-03", level: 50, status: "Stocked" },
  { id: "C-04", level: 78, status: "Stocked" },
];

export default function Login({ onLogin, onForgotPassword, onContactUs }: LoginProps) {
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter your work email and password to continue.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await onLogin(email.trim(), password);
      if (!result.success) {
        setError(result.error ?? "Unable to sign in with those details.");
        setLoading(false);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to reach the sign-in service.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your work email first.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    const result = await onForgotPassword(email.trim());
    setLoading(false);
    if (result.success) setNotice(result.message);
    else setError(result.message);
  };

  const selectRecentLogin = (account: RecentLogin) => {
    setEmail(account.email);
    setPassword("");
    setError("");
    setNotice("");
  };

  return (
    <main className="login-shell min-h-screen bg-canvas text-content lg:grid lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,0.96fr)]">
      <section className="login-brand-panel relative hidden min-h-screen flex-col justify-center overflow-hidden px-8 py-8 md:px-12 lg:flex xl:px-16" aria-label="Inventory System overview">
        <div className="login-grid-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="login-brand-content relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-7 xl:gap-8">
          <div className="flex items-center gap-3">
            <div className="login-brand-mark flex h-11 w-11 items-center justify-center rounded-2xl">
              <Box size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-content">Inventory System</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-content-subtle">Access Control</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-content-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
              One connected operation
            </div>
            <h1 className="text-3xl font-bold leading-[1.12] tracking-tight text-content sm:text-4xl xl:text-[2.7rem]">
              School resources,
              <span className="login-heading-accent block">clearly accounted for.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-content-muted">
              Monitor supplies, computer equipment, laboratory materials, and borrowed resources in one secure place.
            </p>
          </div>

          <div className="login-warehouse-preview rounded-[1.4rem] p-3.5 sm:p-4" aria-label="Illustration of live warehouse inventory bins">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-content-subtle">East DC · Aisles Aâ€“C</p>
                <p className="mt-1 text-[11px] font-semibold text-content">Warehouse floor overview</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              {binStatuses.map((bin) => (
                <div className="login-bin" key={bin.id}>
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className="text-[8px] font-semibold tracking-wide text-content-subtle">{bin.id}</span>
                    {bin.status !== "Stocked" && (
                      <span className={`text-[7px] font-bold uppercase ${bin.status === "Low" ? "text-amber-500" : "text-red-500"}`}>
                        {bin.status}
                      </span>
                    )}
                  </div>
                  <div className="login-bin-well">
                    {bin.level > 0 && (
                      <span
                        className={`login-bin-fill ${bin.status === "Low" ? "is-low" : ""}`}
                        style={{ height: `${bin.level}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {[
              { value: "$3.22M", label: "Inventory value" },
              { value: "48,920", label: "Units tracked" },
              { value: "4 online", label: "Locations" },
            ].map((metric) => (
              <div className="login-metric rounded-xl px-3.5 py-3" key={metric.label}>
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-content-subtle">{metric.label}</p>
                <p className="mt-1.5 text-base font-bold tracking-tight text-content sm:text-lg">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="login-form-panel flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 lg:px-10 xl:px-14" aria-label="Account access">
        <div className="login-card w-full max-w-[530px] rounded-[1.6rem] p-5 sm:p-7">
          <div className="login-logo-panel">
            <BrandLogo className="login-brand-logo" />
          </div>
          <div className="login-card-content">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-content">Welcome back</h2>
              <p className="mt-1 text-xs leading-relaxed text-content-muted">Sign in to manage school inventory.</p>
            </div>
          </div>

          {recentLogins.length > 0 && (
                <details className="login-recent mb-4 rounded-xl border border-border-subtle">
                  <summary className="cursor-pointer px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-content-subtle">Recent profiles ({recentLogins.length})</summary>
                  <div className="grid grid-cols-1 gap-1.5 border-t border-border-subtle p-2 sm:grid-cols-2">
                    {recentLogins.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        disabled={loading}
                        onClick={() => selectRecentLogin(account)}
                        className="login-recent-item rounded-lg px-3 py-2 text-left transition-colors disabled:opacity-50"
                      >
                        <span className="block truncate text-xs font-semibold text-content">{account.name}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-content-subtle">{account.email} · {account.role}</span>
                      </button>
                    ))}
                  </div>
                </details>
              )}

              {error && (
                <div role="alert" className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3">
                  <AlertCircle size={14} className="shrink-0 text-red-500" aria-hidden="true" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}
              {notice && (
                <div role="status" className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3">
                  <Mail size={14} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  <p className="text-xs text-emerald-600">{notice}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-[10px] font-semibold text-content-muted">University email</label>
                  <div className="login-input-wrap relative">
                    <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" aria-hidden="true" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setError(""); }}
                      placeholder="name@company.com"
                      autoComplete="username"
                      required
                      className="login-input w-full rounded-xl py-3 pl-10 pr-3 text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="login-password" className="text-[10px] font-semibold text-content-muted">Password</label>
                    <button type="button" onClick={() => void handleForgotPassword()} disabled={loading} className="login-link text-[10px] font-semibold disabled:opacity-50">Forgot password?</button>
                  </div>
                  <div className="login-input-wrap relative">
                    <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => { setPassword(event.target.value); setError(""); }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="login-input w-full rounded-xl py-3 pl-10 pr-11 text-sm outline-none transition"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="login-password-toggle absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg"
                    >
                      {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="login-submit flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-65">
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in</> : <>Sign in <ArrowRight size={14} aria-hidden="true" /></>}
                </button>
              </form>

              <div className="login-access-note mt-4 border-t border-border-subtle pt-3 text-center">
                <p className="text-[10px] text-content-subtle">Need access? <button type="button" onClick={onContactUs} className="login-link font-semibold">Contact your administrator.</button></p>
                <p className="mt-1 text-[10px] text-content-subtle">Inventory System</p>
              </div>
          </div>
        </div>

      </section>
    </main>
  );
}

