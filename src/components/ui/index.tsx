import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Check, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { InventoryItem } from "../../types";

export function formatPHP(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = "blue" | "green" | "red" | "amber" | "purple" | "gray" | "cyan";

const badgeColors: Record<BadgeVariant, string> = {
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  green: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  red: "bg-red-500/20 text-red-400 border border-red-500/30",
  amber: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  purple: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  gray: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
};

export function Badge({ children, variant = "gray", className = "" }: { children: React.ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    "in-stock": { label: "In Stock", variant: "green" },
    "low-stock": { label: "Low Stock", variant: "amber" },
    "out-of-stock": { label: "Out of Stock", variant: "red" },
    "expired": { label: "Expired", variant: "red" },
    "overstock": { label: "Overstock", variant: "purple" },
    "pending": { label: "Pending", variant: "amber" },
    "in-transit": { label: "In Transit", variant: "blue" },
    "completed": { label: "Completed", variant: "green" },
    "cancelled": { label: "Cancelled", variant: "red" },
    "approved": { label: "Approved", variant: "green" },
    "ordered": { label: "Ordered", variant: "blue" },
    "received": { label: "Received", variant: "green" },
    "active": { label: "Active", variant: "green" },
    "inactive": { label: "Inactive", variant: "gray" },
    "stock-in": { label: "Stock In", variant: "green" },
    "stock-out": { label: "Stock Out", variant: "red" },
  };
  const config = map[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Button ──────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_18px_rgba(59,130,246,0.38)] focus-visible:shadow-[0_0_18px_rgba(59,130,246,0.38)]",
  secondary: "bg-[#2A3445] hover:bg-[#334155] text-slate-200 border border-[#2A3445] hover:border-blue-500/50 hover:shadow-[0_0_16px_rgba(59,130,246,0.22)] focus-visible:shadow-[0_0_16px_rgba(59,130,246,0.22)]",
  danger: "bg-red-600 hover:bg-red-500 text-white hover:shadow-[0_0_18px_rgba(239,68,68,0.38)] focus-visible:shadow-[0_0_18px_rgba(239,68,68,0.38)]",
  ghost: "bg-transparent hover:bg-[#2A3445] text-slate-300 hover:text-white hover:shadow-[0_0_14px_rgba(148,163,184,0.18)] focus-visible:shadow-[0_0_14px_rgba(148,163,184,0.18)]",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.38)] focus-visible:shadow-[0_0_18px_rgba(16,185,129,0.38)]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}) {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${btnVariants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({
  label,
  error,
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>, "option"> =>
      React.isValidElement(child) && child.type === "option",
  );
  const selected = options.find((option) => String(option.props.value ?? "") === String(props.value ?? "")) ?? options[0];
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (value: string) => {
    const fakeEvent = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
    props.onChange?.(fakeEvent);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-left text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors ${error ? "border-red-500" : ""} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${selected ? "text-slate-100" : "text-slate-500"} truncate`}>
          {selected ? String(selected.props.children) : "Select..."}
        </span>
        <svg className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 7l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[#334155] bg-[#111827] shadow-[0_18px_40px_rgba(15,23,42,0.45)]">
          {options.map((option) => {
            const value = String(option.props.value ?? "");
            const active = String(props.value ?? "") === value;
            const optionLabel = String(option.props.children ?? "");
            return (
              <button
                key={value || optionLabel}
                type="button"
                onClick={() => handleSelect(value)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#1E2A3A] focus:bg-[#1E2A3A] ${active ? "bg-blue-500/10" : ""}`}
                role="option"
                aria-selected={active}
              >
                <span className="block text-sm font-semibold text-slate-100">{optionLabel}</span>
              </button>
            );
          })}
        </div>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({
  label,
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>}
      <textarea
        rows={3}
        className={`w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#1A2232] border border-[#2A3445] rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3445]">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#2A3445] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A2232] border border-[#2A3445] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2 rounded-full bg-red-500/20">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────
const toastIcons = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error: <X size={16} className="text-red-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
  info: <Info size={16} className="text-blue-400" />,
};

const toastBg = {
  success: "border-emerald-500/30",
  error: "border-red-500/30",
  warning: "border-amber-500/30",
  info: "border-blue-500/30",
};

export function ToastContainer() {
  const { state, dispatch } = useApp();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[#1A2232] border ${toastBg[toast.type]} rounded-xl shadow-xl animate-slide-up min-w-72 max-w-sm`}
        >
          {toastIcons[toast.type]}
          <span className="text-sm text-slate-200 flex-1">{toast.message}</span>
          <button onClick={() => dispatch({ type: "REMOVE_TOAST", id: toast.id })} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1A2232] border border-[#2A3445] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "blue" | "purple" | "green" | "amber" | "red" | "cyan";
  trend?: { value: number; label: string };
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <Card className="p-5 hover:border-[#334155] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>{icon}</div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.value >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100 mb-0.5">{value}</p>
        <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </Card>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-[#2A3445] ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-slate-300 border-b border-[#2A3445]/50 ${className}`}>
      {children}
    </td>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({
  page,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A3445]">
      <span className="text-xs text-slate-500">
        Showing {start}–{end} of {total} results
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-xs rounded-lg transition-colors ${
              p === page ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-[#2A3445] hover:text-slate-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );
}

type SearchableOption = InventoryItem & {
  productCode?: string;
  product_code?: string;
};

function highlightMatch(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const matchIndex = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (matchIndex < 0) return text;

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + trimmed.length);
  const after = text.slice(matchIndex + trimmed.length);

  return (
    <>
      {before}
      <span className="rounded bg-blue-500/20 text-blue-300">{match}</span>
      {after}
    </>
  );
}

export function SearchableSelect({
  label,
  value,
  items,
  onChange,
  placeholder,
  emptyMessage,
  className = "",
  inputClassName = "",
  listClassName = "",
  getSecondary,
  getEmptyMessage,
}: {
  label: string;
  value: string;
  items: SearchableOption[];
  onChange: (itemId: string) => void;
  placeholder: string;
  emptyMessage: string;
  className?: string;
  inputClassName?: string;
  listClassName?: string;
  getSecondary?: (item: SearchableOption) => string;
  getEmptyMessage?: (query: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedItem = items.find((item) => item.id === value);

  useEffect(() => {
    if (selectedItem) {
      setQuery(`${selectedItem.name} · ${selectedItem.sku}`);
    }
  }, [selectedItem]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items.slice(0, 25);
    return items.filter((item) => {
      const productCode = String(item.productCode ?? item.product_code ?? "");
      return [item.name, item.sku, productCode].some((part) => part.toLowerCase().includes(term));
    }).slice(0, 25);
  }, [items, query]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</label>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#2A3445] text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors ${inputClassName}`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-options`}
      />
      {open && (
        <div className={`absolute left-0 right-0 z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#334155] bg-[#111827] shadow-[0_18px_40px_rgba(15,23,42,0.45)] ${listClassName}`}>
          {filteredItems.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500">{getEmptyMessage ? getEmptyMessage(query) : emptyMessage}</div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = item.id === value;
              const secondary = getSecondary?.(item) ?? `${item.sku} · ${item.quantity} ${item.unit}`;
              const hasQueryMatch = query.trim() !== "" && [item.name, item.sku, item.productCode ?? item.product_code ?? "", secondary].some((part) =>
                String(part).toLowerCase().includes(query.trim().toLowerCase()),
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setQuery(`${item.name} · ${item.sku}`);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors focus:bg-[#1E2A3A] hover:bg-[#1E2A3A] ${isSelected || hasQueryMatch ? "bg-blue-500/10" : ""}`}
                >
                  <span className="block text-sm font-semibold text-slate-100">{highlightMatch(item.name, query)}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{secondary}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-slate-600 mb-4">{icon}</div>}
      <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = "blue" }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorClass = pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-blue-500";
  return (
    <div className="w-full bg-[#2A3445] rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-300 ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
