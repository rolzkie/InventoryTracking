# InventoryTracking Technical Analysis Report

## 1. Project Structure

### Root Tree (major directories only)

```
InventoryTracking/
├─ ATTRIBUTIONS.md
├─ database_mysql_sample.sql
├─ index.html
├─ package.json
├─ pnpm-workspace.yaml
├─ postcss.config.mjs
├─ README.md
├─ TODO.md
├─ vite.config.ts
├─ backend/
│  ├─ artisan
│  ├─ composer.json
│  ├─ composer.lock
│  ├─ package.json
│  ├─ phpunit.xml
│  ├─ vite.config.js
│  ├─ app/
│  │  ├─ Http/
│  │  │  ├─ Controllers/
│  │  │  ├─ Middleware/
│  │  ├─ Models/
│  ├─ bootstrap/
│  ├─ config/
│  ├─ database/
│  │  ├─ migrations/
│  ├─ public/
│  ├─ resources/
│  ├─ routes/
│  ├─ storage/
│  ├─ tests/
│  ├─ vendor/
├─ bootstrap/
├─ developers picture/
├─ guidelines/
├─ public/
├─ resources/
├─ routes/
├─ src/
│  ├─ main.tsx
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ components/
│  │  ├─ pages/
│  ├─ lib/
│  │  ├─ api.ts
│  │  ├─ local-storage-api.ts
│  │  ├─ seed-data.ts
│  ├─ styles/
├─ storage/
├─ supabase/
├─ utils/
├─ vendor/
```

### Purpose of major directories

- `src/`
  - React + Vite frontend application.
  - Contains `main.tsx`, `app/` UI components and pages, `lib/` API/utility code, and CSS.

- `backend/`
  - Laravel backend API server.
  - Contains controllers, models, migrations, routes, config, and database files.

- `public/`
  - Static assets available to the frontend and/or backend.

- `resources/`
  - Secondary assets and views outside main frontend.

- `guidelines/`
  - Documentation and design guidelines.

- `supabase/`
  - Separate Supabase function code not integrated into the primary React/Laravel flow.

- `utils/`
  - Additional utility scripts or helpers.

- `backend/database/`
  - Laravel migrations and database schema definitions.
  - Also contains `database.sqlite` used by the backend.

- `backend/routes/`
  - Laravel API and web route definitions.

### Important files

- Frontend:
  - `src/main.tsx` — React entry point.
  - `src/app/App.tsx` — top-level app shell and page routing.
  - `src/lib/api.ts` — API service wrapper and data normalization.
  - `vite.config.ts` — Vite config, proxying `/api` to Laravel at `127.0.0.1:8000`.

- Backend:
  - `backend/artisan` — Laravel CLI.
  - `backend/composer.json` — backend PHP dependencies.
  - `backend/routes/api.php` — API route definitions.
  - `backend/routes/web.php` — web route definitions.
  - `backend/app/Http/Controllers/` — controllers for inventory, warehouses, transfers, transactions, dashboard, reports.
  - `backend/app/Models/` — Eloquent models.
  - `backend/database/migrations/` — DB schema.
  - `backend/database.sqlite` — active local DB.

### File classification

- React + Vite frontend:
  - `src/`
  - `vite.config.ts`
  - `package.json` at root
  - `postcss.config.mjs`
  - `index.html`

- Laravel backend:
  - `backend/`
  - `backend/composer.json`
  - `backend/routes/`
  - `backend/app/`
  - `backend/database/`
  - `backend/config/`

- MySQL integration:
  - `database_mysql_sample.sql` — sample MySQL schema
  - Laravel backend can support MySQL via config, but current active DB is SQLite.

- Assets:
  - `public/`
  - `resources/`
  - `src/styles/`

- Utilities:
  - `src/lib/local-storage-api.ts`
  - `src/lib/seed-data.ts`
  - `utils/`

- Configuration:
  - `package.json`, `backend/composer.json`
  - `vite.config.ts`, `backend/vite.config.js`
  - `pnpm-workspace.yaml`
  - `postcss.config.mjs`
  - `backend/phpunit.xml`

- API:
  - `backend/routes/api.php`
  - `src/lib/api.ts`

---

## 2. Frontend Architecture

### Entry point

- `src/main.tsx`
  - Renders `<App />` into the DOM.
  - Imports `src/styles/index.css`.

### Routing flow

- There is no React Router.
- Page selection is controlled by internal `App` state.
- `App` uses `page` state and renders the matching page component.

### Layout structure

- `App.tsx` provides the main shell:
  - Sidebar navigation
  - Top header with search, theme toggle, notifications
  - Main content area
- `App` also loads global data once via `loadGlobal()`.

### Page hierarchy

- `App`
  - `DashboardPage`
  - `InventoryPage`
  - `WarehousesPage`
  - `TransfersPage`
  - `TransactionsPage`
  - `ReportsPage`

### Shared components

- UI primitives in `src/app/components/ui`:
  - `button.tsx`, `form.tsx`, `modal/dialog`, `table.tsx`, `badge.tsx`, `input.tsx`, etc.
- Shared display components:
  - `DeveloperCard`
  - `KpiCard`
  - `StatusBadge`
  - `TeamMemberCard`
  - `NotificationsPanel`
- Shared utilities:
  - `toast`
  - `inputCls`
  - `selectCls`
  - `Modal`
  - `ConfirmDialog`
  - `LoadingRow`
  - `EmptyRow`

### Hooks

- Built-in React hooks only:
  - `useState`
  - `useEffect`
  - `useCallback`
  - `useMemo`
  - `useRef`
- No custom hooks are present in the main app.

### Context providers

- No React Context providers are used.
- Global state is kept in `App` and passed as props.

### API services

- `src/lib/api.ts`
  - Exposes `api.dashboard`, `api.warehouses`, `api.inventory`, `api.transfers`, `api.transactions`.
  - Wraps fetch requests to `/api/*`.
  - Falls back to `localStorageAPI` if remote API fails.
  - Normalizes response data for inventory, warehouses, transfers, transactions.

### State management

- `App.tsx` holds global `warehouses`, `inventory`, and `stats`.
- Pages manage local UI state for search, filters, modals, and lists.
- No centralized state library is used.

### Dashboard components

- `DashboardPage.tsx`
  - KPI cards using `KpiCard`
  - Area chart using `recharts`
  - Pie chart using `recharts`
  - Alerts list
  - Developer cards and team section

### Charts

- `DashboardPage`:
  - `AreaChart` for stock movement
  - `PieChart` for category distribution
- `ReportsPage`:
  - `BarChart` for monthly movement
  - Warehouse value bars

### Forms

- Inventory add/edit form
- Warehouse add/edit form
- Warehouse assignment form
- Transfer creation form
- Transaction creation form

### Tables

- Inventory table
- Transfer table
- Transaction table
- Reports snapshot table

### Modals

- Inventory add/edit modal
- Inventory view details modal
- Warehouse add/edit modal
- Warehouse assignment modal
- Transfer create modal
- Transaction create modal

### Navigation flow

- Primary nav is in the `App` sidebar.
- Page changes occur from:
  - Sidebar
  - Search result selection
  - Dashboard alerts
  - Notification panel

### Component call graph

```
App
├─ DashboardPage
│  ├─ KpiCard
│  ├─ StatusBadge
│  ├─ DeveloperCard
│  └─ TeamMemberCard
├─ InventoryPage
│  ├─ InventoryModal
│  ├─ ViewItemModal
│  ├─ ConfirmDialog
│  ├─ StatusBadge
│  └─ LoadingRow / EmptyRow
├─ WarehousesPage
│  ├─ WarehouseModal
│  ├─ AssignmentModal
│  ├─ ConfirmDialog
│  ├─ StatusBadge
│  └─ LoadingRow / EmptyRow
├─ TransfersPage
│  ├─ TransferModal
│  ├─ ConfirmDialog
│  ├─ StatusBadge
│  └─ LoadingRow / EmptyRow
├─ TransactionsPage
│  ├─ TransactionModal
│  ├─ ConfirmDialog
│  └─ LoadingRow / EmptyRow
└─ ReportsPage
```

---

## 3. Backend Architecture

### Routes

- `backend/routes/api.php`
  - `/dashboard` → `DashboardController@index`
  - `/warehouses` → `WarehouseController` resource routes
  - `/inventory` → `InventoryController` resource routes
  - `/inventory/{id}/adjust` → `InventoryController@adjust`
  - `/inventory/{inventory}/assign` → `InventoryController@assign`
  - `/transfers` → `TransferController` resource routes
  - `/transactions` → `StockTransactionController` resource routes
  - `/reports/summary` → `ReportController@summary`
  - `/reports/low-stock` → `ReportController@lowStock`

- `backend/routes/web.php`
  - `/` returns JSON status
  - `/health` returns JSON

### Controllers

- `WarehouseController`
  - list, create, show, update, destroy warehouses
  - computes warehouse status and capacity usage
- `InventoryController`
  - list, create, show, update, destroy inventory
  - `adjust()` updates quantity
  - `assign()` assigns warehouse and updates status
- `TransferController`
  - list, create, show, update, destroy transfers
  - transfer lifecycle management and inventory updates
- `StockTransactionController`
  - list, create, update, destroy stock transactions
  - validates warehouse/item match and updates inventory quantity
- `DashboardController`
  - computes summary stats, alerts, item counts, value
- `ReportController`
  - summary metrics and low stock list

### Models

- `Warehouse`
  - `inventoryItems()` hasMany
  - `outgoingTransfers()` hasMany
  - `incomingTransfers()` hasMany
  - `computeStatus()` based on capacity usage
- `InventoryItem`
  - belongsTo `Warehouse`
  - hasMany `Transfer`
  - auto-updates status in `saving` hook
- `Transfer`
  - belongsTo `InventoryItem`
  - belongsTo source and destination `Warehouse`
- `StockTransaction`
  - belongsTo `InventoryItem`
  - belongsTo `Warehouse`

### Middleware

- API routes use Laravel's `api` middleware group.
- No custom auth middleware is implemented.

### Services

- No separate service classes exist.
- Business logic is implemented in controllers and models.

### Requests

- No `FormRequest` classes are used.
- Validation is done inline in controller methods.

### Database structure

- `warehouses`
- `inventory_items`
- `transfers`
- `stock_transactions`

### Migrations

- `2024_01_01_000001_create_warehouses_table.php`
- `2024_01_01_000002_create_inventory_items_table.php`
- `2024_01_01_000003_create_transfers_table.php`
- `2026_07_14_000004_create_stock_transactions_table.php`

### Seeders

- No backend seeder classes were observed.
- Frontend has local fallback seed data, but backend has no visible Laravel seeders.

### Storage

- `backend/storage/` for Laravel runtime.
- `backend/database.sqlite` is the active database.

### Authentication flow

- None implemented.
- API is open under `api` middleware without auth.

### API endpoints

- `GET /api/dashboard`
- `GET /api/warehouses`
- `POST /api/warehouses`
- `GET /api/warehouses/{id}`
- `PUT /api/warehouses/{id}`
- `DELETE /api/warehouses/{id}`
- `GET /api/inventory`
- `POST /api/inventory`
- `GET /api/inventory/{id}`
- `PUT /api/inventory/{id}`
- `DELETE /api/inventory/{id}`
- `POST /api/inventory/{id}/adjust`
- `POST /api/inventory/{id}/assign`
- `GET /api/transfers`
- `POST /api/transfers`
- `GET /api/transfers/{id}`
- `PUT /api/transfers/{id}`
- `DELETE /api/transfers/{id}`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/{id}`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
- `GET /api/reports/summary`
- `GET /api/reports/low-stock`

---

## 4. API Communication Flow

### Flow diagram

```
React Component
        ↓
API Service
        ↓
Laravel Route
        ↓
Controller
        ↓
Model
        ↓
MySQL / SQLite
        ↓
Response
        ↓
React UI Update
```

### Endpoint consumers

- `App.tsx`
  - `api.dashboard()`
  - `api.warehouses.list()`
  - `api.inventory.list()`
- `InventoryPage.tsx`
  - `api.inventory.list()`
  - `api.inventory.create()`
  - `api.inventory.update()`
  - `api.inventory.delete()`
  - `api.inventory.adjust()` exists but is not wired into UI
  - `api.inventory.assign()` exists and is used elsewhere
- `WarehousesPage.tsx`
  - `api.warehouses.create()`
  - `api.warehouses.update()`
  - `api.warehouses.delete()`
  - `api.inventory.assign()`
- `TransfersPage.tsx`
  - `api.transfers.list()`
  - `api.transfers.create()`
  - `api.transfers.update()`
  - `api.transfers.delete()`
- `TransactionsPage.tsx`
  - `api.transactions.list()`
  - `api.transactions.create()`
  - `api.transactions.delete()`
- `ReportsPage.tsx`
  - does not call any backend report endpoints
- `DashboardPage.tsx`
  - receives data from `App`, not direct API

### Important note

- Report API endpoints exist but are unused in frontend.
- `ReportsPage` constructs charts from local app data.

---

## 5. Database Analysis

### Existing tables

- `warehouses`
- `inventory_items`
- `transfers`
- `stock_transactions`

### Primary keys

- All tables use `id` as the primary key.

### Foreign keys

- `inventory_items.warehouseId` → `warehouses.id`
- `transfers.sourceWarehouse` → `warehouses.id`
- `transfers.destinationWarehouse` → `warehouses.id`
- `transfers.itemId` → `inventory_items.id`
- `stock_transactions.itemId` → `inventory_items.id`
- `stock_transactions.warehouseId` → `warehouses.id`

### Relationships

- `Warehouse` has many `InventoryItem`
- `Warehouse` has many outgoing/incoming `Transfer`
- `InventoryItem` belongs to `Warehouse`
- `InventoryItem` has many `Transfer`
- `Transfer` belongs to `InventoryItem`
- `Transfer` belongs to source and destination `Warehouse`
- `StockTransaction` belongs to `InventoryItem`
- `StockTransaction` belongs to `Warehouse`

### Module table use

- Inventory module: `inventory_items`, `warehouses`
- Warehouse module: `warehouses`, `inventory_items`
- Transfer module: `transfers`, `inventory_items`, `warehouses`
- Transaction module: `stock_transactions`, `inventory_items`, `warehouses`
- Reporting module: derived from `inventory_items`, `warehouses`, `transfers`

### Inventory-related tables

- `inventory_items`
- `transfers`
- `stock_transactions`

### Warehouse tables

- `warehouses`
- `inventory_items`
- `transfers`
- `stock_transactions`

### Transaction tables

- `stock_transactions`
- `transfers`

### Reporting tables

- None dedicated; reporting uses aggregates from existing tables.

---

## 6. ERP Workflow

### Implemented workflow

```
Dashboard
↓
Inventory Tracking
↓
Warehouse Location Tracking
↓
Stock Transactions
↓
Inventory Reporting & Alerts
```

### Current workflow

- Dashboard loads stats and alerts.
- Inventory tracking allows CRUD operations.
- Warehouse tracking allows warehouse management and item assignment.
- Stock transactions record stock in/out.
- Reports are generated client-side from loaded inventory.

### Workflow completeness

- Dashboard to Inventory: implemented.
- Inventory to Warehouse assignment: implemented, but assignment UI is in WarehousesPage.
- Warehouse to Stock Transactions: implemented.
- Reporting from live data: partially implemented client-side.

### Inconsistencies

- `ReportsPage` does not use backend report endpoints.
- Dashboard alert details lack warehouse names.
- Inventory stock adjustment API exists but is not fully exposed.
- Warehouse assignment API is used from WarehousesPage, not InventoryPage.

---

## 7. Navigation Flow

### Main navigation

```
Dashboard
├─ Inventory
├─ Warehouses
├─ Transfers
├─ Transactions
└─ Reports
```

### Navigation triggers

- Sidebar buttons navigate pages.
- Header search results navigate to Inventory or Warehouses.
- Dashboard "View all" button navigates to Inventory.
- Notification panel can navigate to pages.

### Page navigation notes

- `Users` and `Settings` sidebar entries are placeholders only.
- There is no dedicated Developers page.
- Search navigation only changes page, not details.

---

## 8. Dashboard Analysis

### Dashboard cards

- Total SKUs
- Warehouses
- Stock Alerts
- Unassigned Items
- Total Value

### Charts

- Area chart: inbound vs outbound
- Pie chart: category distribution

### Data sources

- API endpoint: `GET /api/dashboard`
- Data is loaded in `App` and forwarded to `DashboardPage`

### Database tables behind dashboard

- `inventory_items`
- `warehouses`
- `transfers`

### Update behavior

- Dashboard loads once on app startup.
- No polling or auto-refresh is implemented.

### Issue

- Alerts list in dashboard may lack warehouse context from backend.

---

## 9. Host Flow

### Current development architecture

```
Browser
↓
Vite dev server (localhost:5173)
↓
React Application
↓
API Requests to /api
↓
Laravel backend (127.0.0.1:8000)
↓
SQLite database
↓
Response
↓
React UI
```

### Config details

- `vite.config.ts` proxies `/api` to `http://127.0.0.1:8000`.
- `backend/routes/web.php` returns JSON for `/` and `/health`.
- Laravel does not serve the React frontend.

### MySQL note

- `database_mysql_sample.sql` is present, but the current active DB is SQLite.

---

## 10. Dependency Map

### Pages → APIs

- `App` → `api.dashboard()`, `api.warehouses.list()`, `api.inventory.list()`
- `InventoryPage` → `api.inventory.*`
- `WarehousesPage` → `api.warehouses.*`, `api.inventory.assign()`
- `TransfersPage` → `api.transfers.*`
- `TransactionsPage` → `api.transactions.*`
- `ReportsPage` → none direct
- `DashboardPage` → reads `stats`

### API → Controllers

- `/api/dashboard` → `DashboardController`
- `/api/warehouses` → `WarehouseController`
- `/api/inventory` → `InventoryController`
- `/api/transfers` → `TransferController`
- `/api/transactions` → `StockTransactionController`
- `/api/reports/*` → `ReportController`

### Controller → Models

- `WarehouseController` → `Warehouse`
- `InventoryController` → `InventoryItem`
- `TransferController` → `Transfer`, `InventoryItem`
- `StockTransactionController` → `StockTransaction`, `InventoryItem`
- `DashboardController` → `InventoryItem`, `Warehouse`, `Transfer`
- `ReportController` → `InventoryItem`, `Warehouse`, `Transfer`

### Models → Tables

- `Warehouse` → `warehouses`
- `InventoryItem` → `inventory_items`
- `Transfer` → `transfers`
- `StockTransaction` → `stock_transactions`

### Overall dependency graph

```
App
├─ DashboardPage
├─ InventoryPage
├─ WarehousesPage
├─ TransfersPage
├─ TransactionsPage
└─ ReportsPage

API Layer
├─ api.dashboard
├─ api.warehouses
├─ api.inventory
├─ api.transfers
├─ api.transactions
└─ api.reports (unused)

Backend Controllers
├─ DashboardController
├─ WarehouseController
├─ InventoryController
├─ TransferController
├─ StockTransactionController
└─ ReportController

Models
├─ Warehouse
├─ InventoryItem
├─ Transfer
└─ StockTransaction

Database Tables
├─ warehouses
├─ inventory_items
├─ transfers
└─ stock_transactions
```

---

## 11. Current Problems

### Broken or incomplete connections

- `ReportsPage` does not consume backend report endpoints.
- `Dashboard` alert entries may lack warehouse context.
- `api.inventory.adjust()` exists but is not wired into Inventory UI.
- Warehouse assignment UI is only in `WarehousesPage`.

### Missing implementations

- No authentication/login flow.
- No dedicated settings/user management pages.
- No backend seeders were found.

### Unused components / code

- `backend/vite.config.js` appears unused.
- `api.reports` endpoints are unused.
- `ReportsPage` uses hard-coded chart data.

### Duplicate functionality

- Dashboard and Reports each render stock movement charts.
- Alerts and low-stock logic is duplicated across multiple screens.

### Incorrect module assignments

- Inventory assignment is handled in Warehouses module instead of Inventory.
- Stock adjustment APIs are available in both Inventory and Transfers paths.

### Data consistency issues

- Warehouse `used` field is computed but also stored in DB.
- `StockTransactionController@destroy()` does not revert inventory quantity.

### Navigation problems

- Placeholder `Users` and `Settings` sidebar items.
- No dedicated Developers page.

### Performance issues

- Global data is loaded once on startup and not refreshed after mutations.
- No caching or polling.

---

## 12. ERP Module Verification

### Inventory Tracking

Implemented:
- Add
- Update
- View
- Search
- Delete

Notes:
- Inventory page does not expose direct stock adjustment or assignment actions.

### Stock Transactions

Implemented:
- Stock-In
- Stock-Out
- Transaction History
- Expiration Tracking

Notes:
- No explicit expiration alert workflow besides counts and filters.
- Transaction deletion does not reverse inventory changes.

### Warehouse Location Tracking

Implemented:
- Assign Warehouse
- Warehouse Quantities
- Transfer Between Warehouses
- Storage Organization

Notes:
- Storage organization is limited to a text field.
- Assignment workflow is present in warehouse page.

### Inventory Reporting & Alerts

Implemented:
- Reports
- Alerts
- Thresholds and reorder logic

Notes:
- Reports use client-side derived data instead of backend report API.
- Alerts are computed in backend, but warehouse context may be incomplete.

### Misplaced functions

- `InventoryController.adjust()` is implemented but not exposed by inventory UI.
- `api.inventory.assign()` is used in warehouse assignment flow.
- Reports endpoints are not consumed by frontend.

---

## Summary

This repository is a React + Laravel ERP-style application with a clean SPA/API separation.

- Frontend: React, Vite, Recharts, and custom UI primitives.
- Backend: Laravel API with controllers, models, and migrations.
- Database: SQLite active, MySQL sample schema present.
- API: Well-defined `/api/*` endpoints.

### Key findings

- Architecture is mostly sound.
- Reports and dashboard contain some duplicated and unused implementation.
- Module boundaries are partially respected but assignment/adjustment paths are fragmented.
- Data synchronization and backend report usage are weak points.

If you want, the next step can be a prioritized fix list for the most important issues.
