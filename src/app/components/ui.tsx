import { useEffect, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Check, Package, X, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import type { Page } from "../types";

type Toast = { id: string; type: "success" | "error" | "info"; message: string };
let toastSetter: ((fn: (t: Toast[]) => Toast[]) => void) | null = null;

export function toast(type: Toast["type"], message: string) {
  const id = Math.random().toString(36).slice(2);
  toastSetter?.((prev) => [...prev, { id, type, message }] as Toast[]);
  setTimeout(() => toastSetter?.((prev) => prev.filter((t) => t.id !== id)), 3500);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    toastSetter = setToasts;
    return () => { toastSetter = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border pointer-events-auto ${
          t.type === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
          : t.type === "error" ? "bg-red-500/15 border-red-500/30 text-red-300"
          : "bg-blue-500/15 border-blue-500/30 text-blue-300"
        }`}>
          {t.type === "success" ? <Check size={13} /> : <AlertCircle size={13} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

export const inputCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30";
export const selectCls = `${inputCls} cursor-pointer`;

export function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-card border border-border rounded-xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean; }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-5 flex flex-col gap-5">
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-xs rounded-lg text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}>
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    unassigned:   { label: "Unassigned",  cls: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
    in_stock:     { label: "In Stock",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    low_stock:    { label: "Low Stock",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    out_of_stock: { label: "Out of Stock",cls: "bg-red-500/15 text-red-400 border-red-500/20" },
    completed:    { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    in_transit:   { label: "In Transit",  cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    pending:      { label: "Pending",     cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    cancelled:    { label: "Cancelled",   cls: "bg-red-500/15 text-red-400 border-red-500/20" },
    active:       { label: "Active",      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    near_full:    { label: "Near Full",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-500/15 text-slate-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
  );
}

export function KpiCard({ icon: Icon, label, value, delta, sub, color }: { icon: any; label: string; value: string | number; delta?: number; sub?: string; color: string; }) {
  const pos = (delta ?? 0) >= 0;
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} /></div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${pos ? "text-emerald-400" : "text-red-400"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
            {pos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(delta)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
        {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full border border-current border-t-transparent w-5 h-5" />
            <span className="text-xs">Loading data...</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center">
            <Package size={28} className="opacity-30" />
          </div>
          <span className="text-xs">{message}</span>
        </div>
      </td>
    </tr>
  );
}

export function NotificationSummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: any; tone: string; }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${tone}`}><Icon size={13} /></div>
      </div>
      <p className="text-lg font-bold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{value}</p>
    </div>
  );
}

export function DeveloperCard({ title, subtitle, description, badge, icon: Icon, tone }: { title: string; subtitle: string; description: string; badge: string; icon: any; tone: string; }) {
  return (
    <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-sm shadow-black/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon size={15} /></div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">{badge}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-1">{subtitle}</p>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function NotificationsPanel({ reportCount, alertCount, onNavigate, onClose }: { reportCount: number; alertCount: number; onNavigate: (page: Page) => void; onClose: () => void; }) {
  return (
    <div className="absolute right-0 top-11 z-40 w-[19rem] rounded-xl border border-border bg-card shadow-2xl backdrop-blur-sm">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Reports & Alerts</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Live summary for operations and reviews</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <NotificationSummaryCard label="Reports" value={reportCount} icon={BarChart3} tone="bg-blue-500/15 text-blue-400" />
        <NotificationSummaryCard label="Alerts" value={alertCount} icon={AlertTriangle} tone="bg-amber-500/15 text-amber-400" />
      </div>
      <div className="px-3 pb-3 flex flex-col gap-2">
        <button onClick={() => { onNavigate("reports"); onClose(); }} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-white/15 hover:bg-white/5 transition-colors">
          <span>Open Reports</span>
          <BarChart3 size={13} className="text-muted-foreground" />
        </button>
        <button onClick={() => { onNavigate("inventory"); onClose(); }} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-white/15 hover:bg-white/5 transition-colors">
          <span>Review Alerts</span>
          <AlertTriangle size={13} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
