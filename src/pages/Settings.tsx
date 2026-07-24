import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Bell, Shield, Database, Globe, Palette, Save, RefreshCw, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button, Card, Input, Select, PageHeader } from "../components/ui";

type SettingTab = "general" | "notifications" | "security" | "appearance" | "data";

export default function Settings() {
  const {
    state,
    showToast,
    setDarkMode,
    saveSettings,
    exportSystemData,
    resetDemoData,
  } = useApp();
  const [activeTab, setActiveTab] = useState<SettingTab>("general");
  const [saved, setSaved] = useState<string | null>(null);

  const [general, setGeneral] = useState({
    companyName: "WarehouseIQ Corp",
    systemEmail: "system@warehouseiq.com",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "YYYY-MM-DD",
    lowStockThreshold: 10,
    overstockThreshold: 500,
  });

  const [notifications, setNotifications] = useState({
    lowStockEmail: true,
    outOfStockEmail: true,
    expirationEmail: true,
    transferEmail: false,
    dailyDigest: true,
    weeklyReport: true,
  });
  const [security, setSecurity] = useState({
    passwordPolicy: true,
    sessionTimeout: true,
    twoFactorAuth: false,
    auditLogging: true,
    ipAllowlist: false,
  });
  const [themeColor, setThemeColor] = useState("#3B82F6");

  useEffect(() => {
    if (state.settings.general) setGeneral((current) => ({ ...current, ...state.settings.general }));
    if (state.settings.notifications) setNotifications((current) => ({ ...current, ...state.settings.notifications }));
    if (state.settings.security) setSecurity((current) => ({ ...current, ...state.settings.security }));
    if (state.settings.appearance?.themeColor) setThemeColor(String(state.settings.appearance.themeColor));
  }, [state.settings]);

  const handleSave = async (section: string) => {
    const payload =
      section === "General" ? general :
      section === "Notifications" ? notifications :
      section === "Security" ? security :
      { darkMode: state.darkMode, themeColor };
    try {
      await saveSettings(section.toLowerCase(), payload);
      if (section === "General") {
        await saveSettings("thresholds", {
          lowStockMin: general.lowStockThreshold,
          overstockMax: general.overstockThreshold,
        });
      }
      setSaved(section);
      showToast(`${section} settings saved successfully`, "success");
      setTimeout(() => setSaved(null), 2000);
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to save ${section} settings`, "error");
    }
  };

  const toggleSecuritySetting = async (key: keyof typeof security) => {
    const next = { ...security, [key]: !security[key] };
    setSecurity(next);
    try {
      await saveSettings("security", next);
      showToast("Security setting updated", "success");
    } catch (error) {
      setSecurity(security);
      showToast(error instanceof Error ? error.message : "Unable to update security setting", "error");
    }
  };

  const handleThemeColor = async (color: string) => {
    setThemeColor(color);
    try {
      await saveSettings("appearance", { darkMode: state.darkMode, themeColor: color });
      showToast("Theme color saved", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to save theme color", "error");
    }
  };

  const download = (contents: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDataAction = async (action: string) => {
    try {
      if (action === "Export CSV") {
        const rows = [
          ["SKU", "Name", "Warehouse", "Quantity", "Unit Cost", "Status"],
          ...state.items.map((item) => [
            item.sku,
            item.name,
            state.warehouses.find((warehouse) => warehouse.id === item.warehouseId)?.name ?? "Unassigned",
            item.quantity,
            item.unitCost,
            item.status,
          ]),
        ];
        const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
        download(csv, `warehouseiq-data-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
      } else if (action === "Export PDF") {
        window.print();
      } else if (action === "Create Backup") {
        const data = await exportSystemData();
        download(JSON.stringify(data, null, 2), `warehouseiq-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
      } else if (action === "Reset Data") {
        if (!window.confirm("Reset all local operational data to the seeded demo records? This cannot be undone.")) return;
        await resetDemoData();
      }
      showToast(`${action} completed`, action === "Reset Data" ? "warning" : "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : `${action} failed`, "error");
    }
  };

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <SettingsIcon size={14} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
    { id: "security", label: "Security", icon: <Shield size={14} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={14} /> },
    { id: "data", label: "Data & Backup", icon: <Database size={14} /> },
  ];

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#2A3445]/50 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? "bg-blue-600" : "bg-[#2A3445]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Configure your ERP system preferences"
      />

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === tab.id ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-[#2A3445]/50 hover:text-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">General Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Core system configuration</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleSave("General")}>
                  {saved === "General" ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save Changes</>}
                </Button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Company Name" value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} />
                  <Input label="System Email" type="email" value={general.systemEmail} onChange={(e) => setGeneral({ ...general, systemEmail: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Timezone" value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}>
                    <option value="Asia/Manila">Philippine Time (PHT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="UTC">UTC</option>
                  </Select>
                  <Select label="Currency" value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}>
                    <option value="PHP">PHP — Philippine Peso</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="JPY">JPY — Japanese Yen</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Date Format" value={general.dateFormat} onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </Select>
                </div>
                <div className="pt-4 border-t border-[#2A3445]">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Alert Thresholds</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Low Stock Minimum" type="number" min={0} value={general.lowStockThreshold} onChange={(e) => setGeneral({ ...general, lowStockThreshold: parseInt(e.target.value) || 0 })} />
                    <Input label="Overstock Maximum" type="number" min={0} value={general.overstockThreshold} onChange={(e) => setGeneral({ ...general, overstockThreshold: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Notification Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure when and how you receive alerts</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleSave("Notifications")}>
                  {saved === "Notifications" ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save</>}
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Email Alerts</p>
                <Toggle value={notifications.lowStockEmail} onChange={(v) => setNotifications({ ...notifications, lowStockEmail: v })} label="Low Stock Email Alerts" />
                <Toggle value={notifications.outOfStockEmail} onChange={(v) => setNotifications({ ...notifications, outOfStockEmail: v })} label="Out of Stock Email Alerts" />
                <Toggle value={notifications.expirationEmail} onChange={(v) => setNotifications({ ...notifications, expirationEmail: v })} label="Expiration Warning Emails" />
                <Toggle value={notifications.transferEmail} onChange={(v) => setNotifications({ ...notifications, transferEmail: v })} label="Transfer Request Notifications" />
              </div>
              <div className="mt-6 pt-4 border-t border-[#2A3445]">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Scheduled Reports</p>
                <Toggle value={notifications.dailyDigest} onChange={(v) => setNotifications({ ...notifications, dailyDigest: v })} label="Daily Inventory Digest" />
                <Toggle value={notifications.weeklyReport} onChange={(v) => setNotifications({ ...notifications, weeklyReport: v })} label="Weekly Summary Report" />
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                  <Shield size={16} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-300">Security Status: Active</p>
                    <p className="text-xs text-slate-500">All security protocols are functioning normally</p>
                  </div>
                </div>
                {[
                  { key: "passwordPolicy" as const, label: "Password Policy", desc: "Minimum 8 characters, mixed case required" },
                  { key: "sessionTimeout" as const, label: "Session Timeout", desc: "Auto-logout after 4 hours of inactivity" },
                  { key: "twoFactorAuth" as const, label: "Two-Factor Auth", desc: "TOTP-based 2FA for all admin accounts" },
                  { key: "auditLogging" as const, label: "Audit Logging", desc: "All CRUD operations are logged and tracked" },
                  { key: "ipAllowlist" as const, label: "IP Allowlist", desc: "Restrict access to approved IP ranges" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-[#0B1220]/50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <Button variant={security[item.key] ? "success" : "secondary"} size="sm" onClick={() => void toggleSecuritySetting(item.key)}>
                      {security[item.key] ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-slate-200">Appearance</h2>
                <Button variant="primary" size="sm" onClick={() => handleSave("Appearance")}>
                  {saved === "Appearance" ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save</>}
                </Button>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Theme Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Dark Mode", value: true, desc: "Professional dark interface" },
                      { label: "Light Mode", value: false, desc: "Clean light interface" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          if (state.darkMode !== opt.value) {
                            void setDarkMode(opt.value).catch((error) => showToast(error instanceof Error ? error.message : "Unable to save theme", "error"));
                          }
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${state.darkMode === opt.value ? "border-blue-500 bg-blue-500/10" : "border-[#2A3445] hover:border-[#334155]"}`}
                      >
                        <p className="text-xs font-medium text-slate-200 mb-0.5">{opt.label}</p>
                        <p className="text-[10px] text-slate-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Color Palette</p>
                  <div className="flex gap-2">
                    {["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 hover:border-white transition-all ${themeColor === color ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => void handleThemeColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "data" && (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-6">Data & Backup</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={14} className="text-blue-400" />
                    <span className="text-xs font-medium text-blue-300">Data Overview</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {[
                      { label: "Inventory Items", count: state.items.length },
                      { label: "Transactions", count: state.transactions.length },
                      { label: "Transfers", count: state.transfers.length },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-lg font-bold text-slate-100">{s.count}</p>
                        <p className="text-[10px] text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Export All Data (CSV)", desc: "Download all inventory and transaction data", action: "Export CSV" },
                    { label: "Export Reports (PDF)", desc: "Generate and download PDF reports", action: "Export PDF" },
                    { label: "Backup Database", desc: "Create a full system data backup", action: "Create Backup" },
                    { label: "Reset to Demo Data", desc: "Restore initial demo data (cannot be undone)", action: "Reset Data", danger: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-[#0B1220]/50 rounded-xl">
                      <div>
                        <p className="text-xs font-medium text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <Button variant={item.danger ? "danger" : "secondary"} size="sm" onClick={() => void handleDataAction(item.action)}>
                        {item.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
