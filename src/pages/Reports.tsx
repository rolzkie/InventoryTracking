import { useState, useMemo, useEffect } from "react";
import {
  BarChart2, AlertTriangle, AlertCircle, CheckCircle, Clock, FileText,
  Download, Printer, RefreshCw, Package, TrendingDown, ChevronRight, Settings,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { ReorderRequest } from "../types";
import {
  Button, Card, Table, Th, Td, PageHeader, StatusBadge, Badge, Modal, Input, Select,
  formatPHP,
} from "../components/ui";

type ReportTab = "inventory" | "movement" | "warehouse" | "low-stock" | "out-of-stock" | "expiring" | "alerts" | "reorders";

export default function Reports() {
  const {
    state,
    showToast,
    generateId,
    acknowledgeAlert,
    createReorder,
    updateReorder,
    saveSettings,
  } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>("inventory");
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholds, setThresholds] = useState({ lowStockMin: 10, overstockMax: 500 });
  const [acknowledgeId, setAcknowledgeId] = useState<string | null>(null);

  useEffect(() => {
    const stored = state.settings.thresholds;
    if (stored) {
      setThresholds({
        lowStockMin: Number(stored.lowStockMin ?? 10),
        overstockMax: Number(stored.overstockMax ?? 500),
      });
    }
  }, [state.settings.thresholds]);

  const stats = useMemo(() => {
    const lowStock = state.items.filter((i) => i.quantity > 0 && i.quantity <= Math.max(i.reorderPoint, thresholds.lowStockMin));
    const outOfStock = state.items.filter((i) => i.status === "out-of-stock");
    const overstock = state.items.filter((i) => thresholds.overstockMax > 0 && i.quantity > thresholds.overstockMax);
    const expiring = state.items.filter((i) => {
      if (!i.expirationDate) return false;
      const days = Math.ceil((new Date(i.expirationDate).getTime() - Date.now()) / 86400000);
      return days <= 90 && days > 0;
    });
    const expired = state.items.filter((i) => i.status === "expired");
    const activeAlerts = state.alerts.filter((a) => !a.acknowledged);
    return { lowStock, outOfStock, overstock, expiring, expired, activeAlerts };
  }, [state.items, state.alerts, thresholds]);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      showToast("Alert acknowledged", "info");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to acknowledge alert", "error");
    }
  };

  const handleGenerateReorder = async (itemId: string) => {
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return;
    const existingOpen = state.reorderRequests.find((r) => r.itemId === itemId && r.status !== "received");
    if (existingOpen) { showToast("An open reorder already exists for this item", "warning"); return; }
    const reorder: ReorderRequest = {
      id: generateId("ro"),
      itemId,
      supplierId: item.supplierId ?? state.suppliers[0]?.id ?? "",
      quantity: Math.max(1, item.maxStock - item.quantity),
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      estimatedDelivery: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      notes: "Auto-generated from stock alert",
    };
    try {
      await createReorder(reorder);
      showToast(`Reorder request created for ${item.name}`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to create reorder", "error");
    }
  };

  const handleReorderStatus = async (request: ReorderRequest, status: ReorderRequest["status"], message: string) => {
    try {
      await updateReorder({ ...request, status });
      showToast(message, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update reorder", "error");
    }
  };

  const handleSaveThresholds = async () => {
    try {
      await saveSettings("thresholds", thresholds);
      showToast("Thresholds saved successfully", "success");
      setShowThresholdModal(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to save thresholds", "error");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["SKU", "Name", "Category", "Warehouse", "Quantity", "Unit Cost", "Total Value", "Status"],
      ...state.items.map((i) => [
        i.sku,
        i.name,
        state.categories.find((c) => c.id === i.categoryId)?.name ?? "",
        state.warehouses.find((w) => w.id === i.warehouseId)?.name ?? "Unassigned",
        i.quantity,
        i.unitCost,
        (i.quantity * i.unitCost).toFixed(2),
        i.status,
      ]),
    ];
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully", "success");
  };

  const handlePrint = () => {
    window.print();
    showToast("Print dialog opened", "info");
  };

  const tabs: { id: ReportTab; label: string; badge?: number }[] = [
    { id: "inventory", label: "Inventory Report" },
    { id: "movement", label: "Stock Movement" },
    { id: "warehouse", label: "Warehouse Report" },
    { id: "low-stock", label: "Low Stock", badge: stats.lowStock.length },
    { id: "out-of-stock", label: "Out of Stock", badge: stats.outOfStock.length },
    { id: "expiring", label: "Expiring Items", badge: stats.expiring.length },
    { id: "alerts", label: "Alerts", badge: stats.activeAlerts.length },
    { id: "reorders", label: "Reorder Requests" },
  ];

  const alertSeverityIcon = { critical: <AlertCircle size={14} className="text-red-400" />, warning: <AlertTriangle size={14} className="text-amber-400" />, info: <Clock size={14} className="text-blue-400" /> };
  const recentAlerts = [...state.alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const formatAlertTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Alerts"
        subtitle="Comprehensive inventory analytics and automated alerts"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowThresholdModal(true)}>
              <Settings size={13} /> Thresholds
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download size={13} /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer size={13} /> Print
            </Button>
          </div>
        }
      />

      {/* Summary Alert Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Low Stock", count: stats.lowStock.length, color: "amber", icon: <TrendingDown size={14} /> },
          { label: "Out of Stock", count: stats.outOfStock.length, color: "red", icon: <Package size={14} /> },
          { label: "Overstock", count: stats.overstock.length, color: "purple", icon: <Package size={14} /> },
          { label: "Expiring <90d", count: stats.expiring.length, color: "amber", icon: <Clock size={14} /> },
          { label: "Expired", count: stats.expired.length, color: "red", icon: <AlertCircle size={14} /> },
          { label: "Active Alerts", count: stats.activeAlerts.length, color: "red", icon: <AlertTriangle size={14} /> },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className={`flex items-center gap-2 mb-1 ${s.color === "red" ? "text-red-400" : s.color === "amber" ? "text-amber-400" : "text-purple-400"}`}>
              {s.icon}
              <span className="text-[10px] font-medium text-slate-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color === "red" ? "text-red-400" : s.color === "amber" ? "text-amber-400" : "text-purple-400"}`}>{s.count}</p>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-[#111827] rounded-xl mb-4 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inventory Report */}
      {activeTab === "inventory" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Current Inventory Report</h3>
              <p className="text-xs text-slate-500">Live data — updates automatically</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <RefreshCw size={11} /> Live
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Item Name</Th>
                <Th>Category</Th>
                <Th>Warehouse</Th>
                <Th>Quantity</Th>
                <Th>Reorder Pt.</Th>
                <Th>Unit Cost</Th>
                <Th>Total Value</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => {
                const cat = state.categories.find((c) => c.id === item.categoryId);
                const wh = state.warehouses.find((w) => w.id === item.warehouseId);
                return (
                  <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                    <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                    <Td><span className="text-xs text-slate-200">{item.name}</span></Td>
                    <Td>{cat && <span className="text-xs px-2 py-0.5 rounded" style={{ color: cat.color, background: cat.color + "22" }}>{cat.name}</span>}</Td>
                    <Td><span className="text-xs text-slate-400">{wh?.name ?? <span className="text-amber-400">Unassigned</span>}</span></Td>
                    <Td><span className="text-xs font-medium">{item.quantity}</span></Td>
                    <Td><span className="text-xs text-slate-500">{item.reorderPoint}</span></Td>
                    <Td><span className="text-xs">{formatPHP(item.unitCost)}</span></Td>
                    <Td><span className="text-xs font-medium text-emerald-400">{formatPHP(item.quantity * item.unitCost)}</span></Td>
                    <Td><StatusBadge status={item.status} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <div className="p-4 border-t border-[#2A3445] flex items-center justify-between">
            <span className="text-xs text-slate-500">{state.items.length} total items</span>
            <span className="text-sm font-semibold text-emerald-400">
              Total Value: {formatPHP(state.items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
            </span>
          </div>
        </Card>
      )}

      {/* Stock Movement Report */}
      {activeTab === "movement" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445]">
            <h3 className="text-sm font-semibold text-slate-200">Stock Movement Report</h3>
            <p className="text-xs text-slate-500">All recorded stock-in and stock-out transactions</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Type</Th>
                <Th>Item</Th>
                <Th>Qty</Th>
                <Th>Unit Cost</Th>
                <Th>Total</Th>
                <Th>Date</Th>
                <Th>By</Th>
              </tr>
            </thead>
            <tbody>
              {state.transactions.map((txn) => {
                const item = state.items.find((i) => i.id === txn.itemId);
                return (
                  <tr key={txn.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                    <Td><span className="font-mono text-xs text-blue-400">{txn.referenceNumber}</span></Td>
                    <Td><StatusBadge status={txn.type} /></Td>
                    <Td><span className="text-xs text-slate-200">{item?.name ?? "Unknown"}</span></Td>
                    <Td><span className={`text-xs font-semibold ${txn.type === "stock-in" ? "text-emerald-400" : "text-red-400"}`}>{txn.type === "stock-in" ? "+" : "-"}{txn.quantity}</span></Td>
                    <Td><span className="text-xs">{formatPHP(txn.unitCost)}</span></Td>
                    <Td><span className="text-xs">{formatPHP(txn.quantity * txn.unitCost)}</span></Td>
                    <Td><span className="text-xs text-slate-500">{txn.date}</span></Td>
                    <Td><span className="text-xs text-slate-400">{txn.processedBy}</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Warehouse Report */}
      {activeTab === "warehouse" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.warehouses.map((wh) => {
            const items = state.items.filter((i) => i.warehouseId === wh.id);
            const value = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
            const pct = Math.round((wh.used / wh.capacity) * 100);
            return (
              <Card key={wh.id} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">{wh.name}</h3>
                    <p className="text-xs text-slate-500">{wh.location} · {wh.address}</p>
                  </div>
                  <span className={`text-xs font-bold ${pct > 85 ? "text-red-400" : pct > 60 ? "text-amber-400" : "text-emerald-400"}`}>{pct}% full</span>
                </div>
                <div className="w-full bg-[#2A3445] rounded-full h-2 mb-3">
                  <div className={`h-2 rounded-full ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Total SKUs", value: items.length },
                    { label: "Total Value", value: formatPHP(value) },
                    { label: "Low Stock", value: items.filter(i => i.status === "low-stock" || i.status === "out-of-stock").length },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#0B1220]/50 rounded-xl p-2 text-center">
                      <p className="text-sm font-bold text-slate-100">{s.value}</p>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500">Manager: {wh.manager || "—"} · {wh.zones.length} zones</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Low Stock Report */}
      {activeTab === "low-stock" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445]">
            <h3 className="text-sm font-semibold text-slate-200">Low Stock Report</h3>
            <p className="text-xs text-slate-500">Items at or below reorder point</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Item</Th>
                <Th>Warehouse</Th>
                <Th>Current Qty</Th>
                <Th>Reorder Pt.</Th>
                <Th>Shortage</Th>
                <Th>Supplier</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStock.length === 0 ? (
                <tr><td colSpan={8}><div className="flex items-center gap-2 justify-center py-8 text-emerald-400"><CheckCircle size={16} /> All items are above reorder point</div></td></tr>
              ) : stats.lowStock.map((item) => {
                const wh = state.warehouses.find((w) => w.id === item.warehouseId);
                const sup = state.suppliers.find((s) => s.id === item.supplierId);
                const shortage = item.reorderPoint - item.quantity;
                const hasReorder = state.reorderRequests.some((r) => r.itemId === item.id && r.status !== "received");
                return (
                  <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                    <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                    <Td><span className="text-xs text-slate-200">{item.name}</span></Td>
                    <Td><span className="text-xs text-slate-400">{wh?.name ?? "Unassigned"}</span></Td>
                    <Td><span className="text-xs font-semibold text-amber-400">{item.quantity}</span></Td>
                    <Td><span className="text-xs">{item.reorderPoint}</span></Td>
                    <Td><span className="text-xs font-semibold text-red-400">{shortage > 0 ? shortage : "At point"}</span></Td>
                    <Td><span className="text-xs text-slate-500">{sup?.name ?? "—"}</span></Td>
                    <Td>
                      {hasReorder ? (
                        <Badge variant="amber">Reorder Pending</Badge>
                      ) : (
                        <Button variant="primary" size="sm" onClick={() => handleGenerateReorder(item.id)}>
                          <FileText size={11} /> Generate PO
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Out of Stock */}
      {activeTab === "out-of-stock" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445]">
            <h3 className="text-sm font-semibold text-slate-200">Out of Stock Report</h3>
            <p className="text-xs text-slate-500 text-red-400/70">Critical — immediate attention required</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Item</Th>
                <Th>Category</Th>
                <Th>Last Updated</Th>
                <Th>Max Stock</Th>
                <Th>Supplier</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {stats.outOfStock.length === 0 ? (
                <tr><td colSpan={7}><div className="flex items-center gap-2 justify-center py-8 text-emerald-400"><CheckCircle size={16} /> No out-of-stock items</div></td></tr>
              ) : stats.outOfStock.map((item) => {
                const cat = state.categories.find((c) => c.id === item.categoryId);
                const sup = state.suppliers.find((s) => s.id === item.supplierId);
                const hasReorder = state.reorderRequests.some((r) => r.itemId === item.id && r.status !== "received");
                return (
                  <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                    <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                    <Td><span className="text-xs font-medium text-red-300">{item.name}</span></Td>
                    <Td>{cat && <span className="text-xs px-2 py-0.5 rounded" style={{ color: cat.color, background: cat.color + "22" }}>{cat.name}</span>}</Td>
                    <Td><span className="text-xs text-slate-500">{item.updatedAt}</span></Td>
                    <Td><span className="text-xs">{item.maxStock}</span></Td>
                    <Td><span className="text-xs text-slate-400">{sup?.name ?? "—"}</span></Td>
                    <Td>
                      {hasReorder ? (
                        <Badge variant="blue">Reorder In Progress</Badge>
                      ) : (
                        <Button variant="danger" size="sm" onClick={() => handleGenerateReorder(item.id)}>
                          <AlertCircle size={11} /> Urgent Reorder
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Expiring Items */}
      {activeTab === "expiring" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445]">
            <h3 className="text-sm font-semibold text-slate-200">Expiring Items Report</h3>
            <p className="text-xs text-slate-500">Items expiring within 90 days or already expired</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Item</Th>
                <Th>Warehouse</Th>
                <Th>Quantity</Th>
                <Th>Expiry Date</Th>
                <Th>Days Remaining</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {[...stats.expiring, ...stats.expired].length === 0 ? (
                <tr><td colSpan={7}><div className="flex items-center gap-2 justify-center py-8 text-emerald-400"><CheckCircle size={16} /> No expiring items</div></td></tr>
              ) : [...stats.expired, ...stats.expiring].map((item) => {
                const daysLeft = Math.ceil((new Date(item.expirationDate!).getTime() - Date.now()) / 86400000);
                const wh = state.warehouses.find((w) => w.id === item.warehouseId);
                return (
                  <tr key={item.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                    <Td><span className="font-mono text-xs text-blue-400">{item.sku}</span></Td>
                    <Td><span className="text-xs text-slate-200">{item.name}</span></Td>
                    <Td><span className="text-xs text-slate-400">{wh?.name ?? "Unassigned"}</span></Td>
                    <Td><span className="text-xs">{item.quantity} {item.unit}</span></Td>
                    <Td><span className="text-xs text-slate-300">{item.expirationDate}</span></Td>
                    <Td><span className={`text-xs font-semibold ${daysLeft <= 0 ? "text-red-400" : daysLeft <= 30 ? "text-red-400" : daysLeft <= 60 ? "text-amber-400" : "text-blue-400"}`}>{daysLeft <= 0 ? "Expired" : `${daysLeft} days`}</span></Td>
                    <Td><StatusBadge status={daysLeft <= 0 ? "expired" : daysLeft <= 30 ? "out-of-stock" : "low-stock"} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Alerts */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          {state.alerts.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No alerts</p>
              <p className="text-xs text-slate-500 mt-1">All inventory levels are within acceptable thresholds</p>
            </Card>
          )}
          {recentAlerts.map((alert) => {
            const item = state.items.find((i) => i.id === alert.itemId);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                  alert.acknowledged ? "opacity-50 bg-[#111827] border-[#2A3445]" : alert.severity === "critical" ? "bg-red-500/5 border-red-500/25" : alert.severity === "warning" ? "bg-amber-500/5 border-amber-500/25" : "bg-blue-500/5 border-blue-500/25"
                }`}
              >
                {alertSeverityIcon[alert.severity]}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-slate-200">{item?.name ?? "Unknown Item"}</p>
                    <Badge variant={alert.type === "low-stock" ? "amber" : alert.type === "out-of-stock" ? "red" : alert.type === "expiring" ? "amber" : "purple"}>{alert.type.replace("-", " ")}</Badge>
                    {alert.acknowledged && <Badge variant="gray">Acknowledged</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">{alert.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{formatAlertTime(alert.createdAt)}</p>
                </div>
                {!alert.acknowledged && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void handleAcknowledge(alert.id)}>
                      <CheckCircle size={12} /> Acknowledge
                    </Button>
                    {(alert.type === "low-stock" || alert.type === "out-of-stock") && (
                      <Button variant="primary" size="sm" onClick={() => void handleGenerateReorder(alert.itemId)}>
                        <FileText size={12} /> Generate PO
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reorder Requests */}
      {activeTab === "reorders" && (
        <Card>
          <div className="p-4 border-b border-[#2A3445]">
            <h3 className="text-sm font-semibold text-slate-200">Reorder Requests / Purchase Orders</h3>
            <p className="text-xs text-slate-500">Auto-generated and manual reorder requests</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Item</Th>
                <Th>Supplier</Th>
                <Th>Quantity</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Est. Delivery</Th>
                <Th>Notes</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {state.reorderRequests.length === 0 ? (
                <tr><td colSpan={9}><div className="flex items-center gap-2 justify-center py-8 text-slate-500"><FileText size={16} /> No reorder requests</div></td></tr>
              ) : state.reorderRequests.map((req) => {
                const item = state.items.find((i) => i.id === req.itemId);
                const sup = state.suppliers.find((s) => s.id === req.supplierId);
                return (
                  <tr key={req.id} className="hover:bg-[#1E2A3A]/50 transition-colors">
                    <Td><span className="font-mono text-xs text-blue-400">{req.id.slice(0, 10)}</span></Td>
                    <Td><span className="text-xs text-slate-200">{item?.name ?? "Unknown"}</span></Td>
                    <Td><span className="text-xs text-slate-400">{sup?.name ?? "—"}</span></Td>
                    <Td><span className="text-xs font-medium">{req.quantity}</span></Td>
                    <Td><StatusBadge status={req.status} /></Td>
                    <Td><span className="text-xs text-slate-500">{req.createdAt}</span></Td>
                    <Td><span className="text-xs text-slate-500">{req.estimatedDelivery ?? "—"}</span></Td>
                    <Td><span className="text-xs text-slate-500 max-w-40 truncate block">{req.notes}</span></Td>
                    <Td>
                      {req.status === "pending" && (
                        <Button variant="success" size="sm" onClick={() => void handleReorderStatus(req, "approved", "Reorder approved")}>
                          Approve
                        </Button>
                      )}
                      {req.status === "approved" && (
                        <Button variant="primary" size="sm" onClick={() => void handleReorderStatus(req, "ordered", "Purchase order sent")}>
                          Mark Ordered
                        </Button>
                      )}
                      {req.status === "ordered" && (
                        <Button variant="secondary" size="sm" onClick={() => void handleReorderStatus(req, "received", "Order received")}>
                          Mark Received
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Threshold Modal */}
      <Modal isOpen={showThresholdModal} onClose={() => setShowThresholdModal(false)} title="Configure Alert Thresholds" size="sm">
        <div className="p-6 space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            These thresholds determine when low-stock and overstock alerts are triggered automatically.
          </div>
          <Input label="Low Stock Minimum Threshold" type="number" min={0} value={thresholds.lowStockMin} onChange={(e) => setThresholds({ ...thresholds, lowStockMin: parseInt(e.target.value) || 0 })} />
          <Input label="Overstock Maximum Threshold" type="number" min={0} value={thresholds.overstockMax} onChange={(e) => setThresholds({ ...thresholds, overstockMax: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={() => setShowThresholdModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => void handleSaveThresholds()}>
            <Settings size={14} /> Save Thresholds
          </Button>
        </div>
      </Modal>
    </div>
  );
}
