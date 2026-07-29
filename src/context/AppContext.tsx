import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import type {
  Category,
  Supplier,
  Warehouse,
  InventoryItem,
  StockTransaction,
  Transfer,
  Alert,
  ReorderRequest,
  User,
  Notification,
  Page,
} from "../types";
import { api } from "../lib/api";

const AUTH_STORAGE_KEY = "warehouseiq.auth";
const RECENT_LOGINS_KEY = "warehouseiq.recent-logins";

interface AppState {
  currentPage: Page;
  categories: Category[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  items: InventoryItem[];
  assignableItems: InventoryItem[];
  transactions: StockTransaction[];
  transfers: Transfer[];
  alerts: Alert[];
  reorderRequests: ReorderRequest[];
  users: User[];
  notifications: Notification[];
  settings: Record<string, Record<string, unknown>>;
  acknowledgedAlertIds: string[];
  darkMode: boolean;
  toasts: Toast[];
  currentUser: User;
  isAuthenticated: boolean;
  loadingOperationalData: boolean;
  backendError: string | null;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

type Action =
  | { type: "SET_PAGE"; page: Page }
  | {
      type: "SET_OPERATIONAL_DATA";
      data: {
        warehouses: Warehouse[];
        items: InventoryItem[];
        assignableItems: InventoryItem[];
        transactions: StockTransaction[];
        transfers: Transfer[];
        categories: Category[];
        suppliers: Supplier[];
        users: User[];
        reorderRequests: ReorderRequest[];
        notifications: Notification[];
        settings: Record<string, Record<string, unknown>>;
        acknowledgedAlertIds: string[];
      };
    }
  | { type: "SET_BACKEND_ERROR"; error: string | null }
  | { type: "ADD_ITEM"; item: InventoryItem }
  | { type: "UPDATE_ITEM"; item: InventoryItem }
  | { type: "DELETE_ITEM"; id: string }
  | { type: "ADD_WAREHOUSE"; warehouse: Warehouse }
  | { type: "UPDATE_WAREHOUSE"; warehouse: Warehouse }
  | { type: "DELETE_WAREHOUSE"; id: string }
  | { type: "ADD_TRANSACTION"; transaction: StockTransaction }
  | { type: "ADD_TRANSFER"; transfer: Transfer }
  | { type: "UPDATE_TRANSFER"; transfer: Transfer }
  | { type: "ACKNOWLEDGE_ALERT"; id: string }
  | { type: "ADD_ALERT"; alert: Alert }
  | { type: "ADD_REORDER"; request: ReorderRequest }
  | { type: "UPDATE_REORDER"; request: ReorderRequest }
  | { type: "ADD_USER"; user: User }
  | { type: "UPDATE_USER"; user: User }
  | { type: "DELETE_USER"; id: string }
  | { type: "SET_DARK_MODE"; value: boolean }
  | { type: "TOGGLE_DARK_MODE" }
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "SET_NOTIFICATIONS"; notifications: Notification[] }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" };

function computeItemStatus(item: InventoryItem): InventoryItem {
  return item;
}

function buildAlerts(
  items: InventoryItem[],
  acknowledgedAlertIds: string[] = [],
  thresholds: Record<string, unknown> = {},
): Alert[] {
  const alerts: Alert[] = [];
  const lowStockMinimum = Number(thresholds.lowStockMin ?? 0);
  const overstockMaximum = Number(thresholds.overstockMax ?? 0);

  for (const item of items) {
    const lowStockPoint = Math.max(item.reorderPoint, lowStockMinimum);
    if (item.status === "out-of-stock") {
      alerts.push({
        id: `out-${item.id}`,
        type: "out-of-stock",
        itemId: item.id,
        message: `${item.name} is out of stock`,
        severity: "critical",
        createdAt: new Date().toISOString(),
        acknowledged: acknowledgedAlertIds.includes(`out-${item.id}`),
      });
    } else if (item.status === "low-stock" || (lowStockMinimum > 0 && item.quantity <= lowStockPoint)) {
      alerts.push({
        id: `low-${item.id}`,
        type: "low-stock",
        itemId: item.id,
        message: `${item.name} is below its reorder point`,
        severity: "warning",
        createdAt: new Date().toISOString(),
        acknowledged: acknowledgedAlertIds.includes(`low-${item.id}`),
      });
    }

    if (item.status === "overstock" || (overstockMaximum > 0 && item.quantity > overstockMaximum)) {
      alerts.push({
        id: `over-${item.id}`,
        type: "overstock",
        itemId: item.id,
        message: `${item.name} exceeds the global overstock threshold`,
        severity: "info",
        createdAt: new Date().toISOString(),
        acknowledged: acknowledgedAlertIds.includes(`over-${item.id}`),
      });
    }

    if (item.expirationDate) {
      const days = Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / 86_400_000);
      if (days >= 0 && days <= 30) {
        alerts.push({
          id: `exp-${item.id}`,
          type: "expiring",
          itemId: item.id,
          message: `${item.name} expires in ${days} day${days === 1 ? "" : "s"}`,
          severity: days <= 7 ? "critical" : "warning",
          createdAt: new Date().toISOString(),
          acknowledged: acknowledgedAlertIds.includes(`exp-${item.id}`),
        });
      }
    }
  }

  return alerts;
}

function mergeAlerts(
  items: InventoryItem[],
  acknowledgedAlertIds: string[],
  thresholds: Record<string, unknown>,
): Alert[] {
  return buildAlerts(items, acknowledgedAlertIds, thresholds).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.page };

    case "SET_OPERATIONAL_DATA":
      return {
        ...state,
        ...action.data,
        alerts: mergeAlerts(
          action.data.items,
          action.data.acknowledgedAlertIds,
          action.data.settings.thresholds,
        ),
        darkMode: typeof action.data.settings.appearance?.darkMode === "boolean"
          ? action.data.settings.appearance.darkMode
          : state.darkMode,
        loadingOperationalData: false,
        backendError: null,
      };

    case "SET_BACKEND_ERROR":
      return {
        ...state,
        loadingOperationalData: false,
        backendError: action.error,
      };

    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, computeItemStatus(action.item)],
        alerts: mergeAlerts(
          [...state.items, computeItemStatus(action.item)],
          state.acknowledgedAlertIds,
          state.settings.thresholds ?? {},
        ),
      };

    case "UPDATE_ITEM": {
      const updatedItems = state.items.map((i) => (i.id === action.item.id ? computeItemStatus(action.item) : i));
      return {
        ...state,
        items: updatedItems,
        alerts: mergeAlerts(updatedItems, state.acknowledgedAlertIds, state.settings.thresholds ?? {}),
      };
    }

    case "DELETE_ITEM": {
      const items = state.items.filter((i) => i.id !== action.id);
      return {
        ...state,
        items,
        alerts: mergeAlerts(items, state.acknowledgedAlertIds, state.settings.thresholds ?? {}),
      };
    }

    case "ADD_WAREHOUSE":
      return { ...state, warehouses: [...state.warehouses, action.warehouse] };

    case "UPDATE_WAREHOUSE":
      return {
        ...state,
        warehouses: state.warehouses.map((w) => (w.id === action.warehouse.id ? action.warehouse : w)),
      };

    case "DELETE_WAREHOUSE":
      return { ...state, warehouses: state.warehouses.filter((w) => w.id !== action.id) };

    case "ADD_TRANSACTION": {
      const txn = action.transaction;
      const updatedItems = state.items.map((item) => {
        if (item.id !== txn.itemId) return item;
        const newQty = txn.type === "stock-in" ? item.quantity + txn.quantity : item.quantity - txn.quantity;
        return computeItemStatus({ ...item, quantity: Math.max(0, newQty), updatedAt: new Date().toISOString() });
      });

      // Also update warehouse used capacity
      const updatedWarehouses = state.warehouses.map((wh) => {
        const item = updatedItems.find((i) => i.id === txn.itemId);
        if (!item || item.warehouseId !== wh.id) return wh;
        const delta = txn.type === "stock-in" ? txn.quantity : -txn.quantity;
        return { ...wh, used: Math.max(0, wh.used + delta) };
      });

      return {
        ...state,
        transactions: [txn, ...state.transactions],
        items: updatedItems,
        warehouses: updatedWarehouses,
        alerts: mergeAlerts(updatedItems, state.acknowledgedAlertIds, state.settings.thresholds ?? {}),
      };
    }

    case "ADD_TRANSFER": {
      return { ...state, transfers: [action.transfer, ...state.transfers] };
    }

    case "UPDATE_TRANSFER": {
      const tr = action.transfer;
      let updatedItems = state.items;

      if (tr.status === "completed") {
        updatedItems = state.items.map((item) => {
          if (item.id !== tr.itemId) return item;
          return computeItemStatus({ ...item, warehouseId: tr.toWarehouseId, zoneId: tr.toZoneId ?? null, updatedAt: new Date().toISOString() });
        });
      }

      return {
        ...state,
        transfers: state.transfers.map((t) => (t.id === tr.id ? tr : t)),
        items: updatedItems,
        alerts: mergeAlerts(updatedItems, state.acknowledgedAlertIds, state.settings.thresholds ?? {}),
      };
    }

    case "ACKNOWLEDGE_ALERT":
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.id ? { ...a, acknowledged: true } : a)),
        acknowledgedAlertIds: state.acknowledgedAlertIds.includes(action.id)
          ? state.acknowledgedAlertIds
          : [...state.acknowledgedAlertIds, action.id],
      };

    case "ADD_ALERT":
      return { ...state, alerts: [action.alert, ...state.alerts] };

    case "ADD_REORDER":
      return { ...state, reorderRequests: [action.request, ...state.reorderRequests] };

    case "UPDATE_REORDER":
      return {
        ...state,
        reorderRequests: state.reorderRequests.map((r) => (r.id === action.request.id ? action.request : r)),
      };

    case "ADD_USER":
      return { ...state, users: [...state.users, action.user] };

    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.user.id ? action.user : u)),
      };

    case "DELETE_USER":
      return { ...state, users: state.users.filter((u) => u.id !== action.id) };

    case "TOGGLE_DARK_MODE":
      return { ...state, darkMode: !state.darkMode };

    case "SET_DARK_MODE":
      return { ...state, darkMode: action.value };

    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.notifications };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };

    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case "LOGIN":
      return { ...state, isAuthenticated: true, currentUser: action.user };

    case "LOGOUT":
      return { ...state, isAuthenticated: false, currentPage: "dashboard" };

    default:
      return state;
  }
}

const initialState: AppState = {
  currentPage: "dashboard",
  categories: [],
  suppliers: [],
  warehouses: [],
  items: [],
  assignableItems: [],
  transactions: [],
  transfers: [],
  alerts: [],
  reorderRequests: [],
  users: [],
  notifications: [],
  settings: {},
  acknowledgedAlertIds: [],
  darkMode: true,
  toasts: [],
  currentUser: {
    id: "",
    name: "Guest User",
    email: "",
    role: "viewer",
    permission: "view",
    avatar: "GU",
    department: "",
    lastLogin: "Never",
    active: false,
    createdAt: "",
  },
  isAuthenticated: false,
  loadingOperationalData: true,
  backendError: null,
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  navigate: (page: Page) => void;
  showToast: (message: string, type?: Toast["type"]) => void;
  getItem: (id: string) => InventoryItem | undefined;
  getWarehouse: (id: string) => Warehouse | undefined;
  getCategory: (id: string) => Category | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  generateId: (prefix?: string) => string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshOperationalData: (currentUser?: User) => Promise<void>;
  createItem: (item: InventoryItem, supplierName?: string) => Promise<void>;
  updateItem: (item: InventoryItem, supplierName?: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  createWarehouse: (warehouse: Warehouse) => Promise<void>;
  updateWarehouse: (warehouse: Warehouse) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  assignItem: (itemId: string, warehouseId: string, zoneId: string | null) => Promise<void>;
  createTransaction: (transaction: Omit<StockTransaction, "id" | "referenceNumber"> & { id?: string; referenceNumber?: string }) => Promise<void>;
  createTransfer: (transfer: Transfer) => Promise<void>;
  updateTransfer: (transfer: Transfer) => Promise<void>;
  createUser: (user: User, password: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  createReorder: (request: ReorderRequest) => Promise<void>;
  updateReorder: (request: ReorderRequest) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  setDarkMode: (value: boolean) => Promise<void>;
  saveSettings: (section: string, payload: Record<string, unknown>) => Promise<void>;
  exportSystemData: () => Promise<Record<string, unknown>>;
  resetDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshOperationalData = useCallback(async (currentUser = state.currentUser) => {
    try {
      const data = await api.operational.load(currentUser);
      dispatch({ type: "SET_OPERATIONAL_DATA", data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the Laravel API.";
      dispatch({ type: "SET_BACKEND_ERROR", error: message });
      throw error;
    }
  }, [state.currentUser]);

  useEffect(() => {
    // Every new page load starts at the login screen. This also prevents a stale
    // browser token from bypassing login after the backend/database restarts.
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", !state.darkMode);
  }, [state.darkMode]);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshNotifications = () => {
      void api.notifications.list()
        .then((notifications) => dispatch({ type: "SET_NOTIFICATIONS", notifications }))
        .catch(() => undefined);
    };

    refreshNotifications();
    const timer = window.setInterval(refreshNotifications, 10_000);
    return () => window.clearInterval(timer);
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const timer = window.setInterval(() => {
      void refreshOperationalData().catch(() => undefined);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [refreshOperationalData, state.isAuthenticated]);

  const navigate = useCallback(
    (page: Page) => dispatch({ type: "SET_PAGE", page }),
    [],
  );

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = `toast-${Date.now()}`;
    dispatch({ type: "ADD_TOAST", toast: { id, message, type } });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 3500);
  }, []);

  const getItem = useCallback((id: string) => state.items.find((i) => i.id === id), [state.items]);
  const getWarehouse = useCallback((id: string) => state.warehouses.find((w) => w.id === id), [state.warehouses]);
  const getCategory = useCallback((id: string) => state.categories.find((c) => c.id === id), [state.categories]);
  const getSupplier = useCallback((id: string) => state.suppliers.find((s) => s.id === id), [state.suppliers]);
  const generateId = useCallback((prefix = "id") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, []);

  const createItem = useCallback(async (item: InventoryItem, supplierName?: string) => {
    await api.inventory.create(item, state.categories, supplierName);
    await refreshOperationalData();
  }, [refreshOperationalData, state.categories]);

  const updateItem = useCallback(async (item: InventoryItem, supplierName?: string) => {
    await api.inventory.update(item, state.categories, supplierName);
    await refreshOperationalData();
  }, [refreshOperationalData, state.categories]);

  const deleteItem = useCallback(async (id: string) => {
    await api.inventory.delete(id);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const createWarehouse = useCallback(async (warehouse: Warehouse) => {
    await api.warehouses.create(warehouse);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const updateWarehouse = useCallback(async (warehouse: Warehouse) => {
    await api.warehouses.update(warehouse);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const deleteWarehouse = useCallback(async (id: string) => {
    await api.warehouses.delete(id);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const assignItem = useCallback(async (itemId: string, warehouseId: string, zoneId: string | null) => {
    await api.inventory.assign(itemId, warehouseId, zoneId);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const createTransaction = useCallback(async (transaction: Omit<StockTransaction, "id" | "referenceNumber"> & { id?: string; referenceNumber?: string }) => {
    const item = state.items.find((entry) => entry.id === transaction.itemId);
    if (!item?.warehouseId) throw new Error("Assign this item to a warehouse before recording stock.");
    await api.transactions.create(transaction, item.warehouseId);
    await refreshOperationalData();
  }, [refreshOperationalData, state.items]);

  const createTransfer = useCallback(async (transfer: Transfer) => {
    await api.transfers.create(transfer);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const updateTransfer = useCallback(async (transfer: Transfer) => {
    await api.transfers.update(transfer);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const session = await api.auth.login(email, password);
      const { user } = session;
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      const recentLogins = (() => {
        try {
          const raw = window.localStorage.getItem(RECENT_LOGINS_KEY);
          return raw ? JSON.parse(raw) as Array<{ email: string; name: string; role: string; lastLogin: string }> : [];
        } catch {
          return [];
        }
      })();
      const entry = { email: user.email, name: user.name, role: user.role, lastLogin: new Date().toISOString() };
      window.localStorage.setItem(
        RECENT_LOGINS_KEY,
        JSON.stringify([entry, ...recentLogins.filter((loginEntry) => loginEntry.email.toLowerCase() !== user.email.toLowerCase())].slice(0, 6)),
      );
      dispatch({ type: "LOGIN", user });
      void refreshOperationalData(user).catch(() => undefined);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to sign in.",
      };
    }
  }, [refreshOperationalData]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const result = await api.auth.forgotPassword(email);
      return { success: true, message: result.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to request a password reset.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => undefined);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    dispatch({ type: "LOGOUT" });
  }, []);

  const createUser = useCallback(async (user: User, password: string) => {
    await api.users.create(user, password);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const updateUser = useCallback(async (user: User) => {
    await api.users.update(user);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const deleteUser = useCallback(async (id: string) => {
    await api.users.delete(id);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    await api.alerts.acknowledge(id, state.currentUser.id);
    await refreshOperationalData();
  }, [refreshOperationalData, state.currentUser.id]);

  const createReorder = useCallback(async (request: ReorderRequest) => {
    await api.reorders.create(request);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const updateReorder = useCallback(async (request: ReorderRequest) => {
    await api.reorders.update(request);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.notifications.markRead(id);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const markAllNotificationsRead = useCallback(async () => {
    await api.notifications.markAllRead();
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const setDarkMode = useCallback(async (value: boolean) => {
    const appearance = { ...(state.settings.appearance ?? {}), darkMode: value };
    dispatch({ type: "SET_DARK_MODE", value });
    try {
      await api.settings.update("appearance", appearance);
    } catch (error) {
      dispatch({ type: "SET_DARK_MODE", value: !value });
      throw error;
    }
  }, [state.settings.appearance]);

  const saveSettings = useCallback(async (section: string, payload: Record<string, unknown>) => {
    await api.settings.update(section, payload);
    await refreshOperationalData();
  }, [refreshOperationalData]);

  const exportSystemData = useCallback(() => api.system.export(), []);

  const resetDemoData = useCallback(async () => {
    await api.system.reset();
    await refreshOperationalData();
  }, [refreshOperationalData]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      navigate,
      showToast,
      getItem,
      getWarehouse,
      getCategory,
      getSupplier,
      generateId,
      login,
      forgotPassword,
      logout,
      refreshOperationalData,
      createItem,
      updateItem,
      deleteItem,
      createWarehouse,
      updateWarehouse,
      deleteWarehouse,
      assignItem,
      createTransaction,
      createTransfer,
      updateTransfer,
      createUser,
      updateUser,
      deleteUser,
      acknowledgeAlert,
      createReorder,
      updateReorder,
      markNotificationRead,
      markAllNotificationsRead,
      setDarkMode,
      saveSettings,
      exportSystemData,
      resetDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
