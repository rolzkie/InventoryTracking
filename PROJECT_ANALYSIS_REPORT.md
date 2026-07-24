# WarehouseIQ Current Architecture Analysis

## Canonical application

The repository now has one intended application flow:

```text
React 19 + Vite 8 + Tailwind CSS 4
                |
                | HTTP JSON through /api
                v
          Laravel 13 API
                |
                v
       Eloquent + SQLite/MySQL
```

The root `src/` directory is the current frontend. The `backend/` directory is the current backend. Operational data should not be authored in frontend mock state.

## Current folder structure

```text
InventoryTracking/
|-- src/                         Current React frontend
|   |-- App.tsx                  Application shell and page selection
|   |-- main.tsx                 React entry point
|   |-- index.css                Tailwind CSS v4 import and global styles
|   |-- components/
|   |   |-- layout/              Sidebar and top navigation
|   |   `-- ui/                  Shared UI components
|   |-- context/
|   |   `-- AppContext.tsx       Frontend state and Laravel operations
|   |-- data/
|   |   `-- mockData.ts          Reference/demo data only
|   |-- lib/
|   |   `-- api.ts               Laravel API client and data adapters
|   |-- pages/
|   |   |-- Dashboard.tsx
|   |   |-- Inventory.tsx
|   |   |-- Warehouses.tsx
|   |   |-- Transfers.tsx
|   |   |-- StockTransactions.tsx
|   |   |-- Reports.tsx
|   |   |-- Login.tsx
|   |   |-- Users.tsx
|   |   `-- Settings.tsx
|   `-- types/
|       `-- index.ts
|
|-- backend/                     Laravel application
|   |-- app/
|   |   |-- Http/Controllers/    API and legacy page controllers
|   |   |-- Http/Requests/       Inventory form request classes
|   |   `-- Models/              Eloquent models
|   |-- bootstrap/               Laravel bootstrap
|   |-- config/                  Database, CORS, auth, cache, etc.
|   |-- database/
|   |   |-- migrations/          Operational database schema
|   |   |-- seeders/
|   |   `-- database.sqlite      Default local database
|   |-- resources/views/         Legacy Blade UI, no longer canonical
|   |-- routes/
|   |   |-- api.php              JSON API
|   |   `-- web.php              React build and asset serving
|   `-- tests/                   PHPUnit feature and unit tests
|
|-- public/                      Static frontend assets
|-- dist/                        Generated React production build
|-- package.json                 Frontend dependencies/scripts
|-- vite.config.ts               React/Tailwind plugins and Laravel proxy
|-- tsconfig.json                Strict TypeScript configuration
`-- README.md                    Setup and run instructions
```

## Frontend runtime flow

1. `src/main.tsx` mounts `App`.
2. `AppProvider` starts and requests operational data from Laravel.
3. `src/lib/api.ts` loads reference, operational, user, notification, reorder, and settings records.
4. API records are normalized into the types expected by the new UI.
5. Dashboard and report values are derived from the loaded operational state.
6. Create, update, assignment, transaction, and transfer actions call Laravel.
7. After a successful write, the provider reloads operational data from Laravel.
8. API failures remain visible and are not silently replaced with browser-local data.

## Laravel API map

| Frontend module | Laravel endpoints | Main models |
|---|---|---|
| Dashboard | `GET /api/dashboard` and loaded operational data | InventoryItem, Warehouse, Transfer |
| Inventory | `/api/inventory` resource | InventoryItem |
| Assignment | `POST /api/inventory/{id}/assign` | InventoryItem, Warehouse |
| Warehouses | `/api/warehouses` resource | Warehouse |
| Transactions | `/api/transactions` resource | StockTransaction, InventoryItem |
| Transfers | `/api/transfers` resource | Transfer, InventoryItem, Warehouse |
| Reports | `/api/reports/*` | InventoryItem, StockTransaction, Warehouse |
| Login | `/api/auth/*` | User, password_reset_tokens |
| Users | `/api/users` resource | User |
| Reference data | `GET /api/categories`, `GET /api/suppliers` | Category, Supplier |
| Reorders | `/api/reorders` resource | ReorderRequest |
| Notifications | `/api/notifications*` | AppNotification |
| Alert acknowledgement | `/api/alert-acknowledgements` | alert_acknowledgements |
| Settings and backup | `/api/settings/*`, `/api/system/*` | SystemSetting and operational models |

## Data mapping

The new React UI and the existing Laravel schema use different naming conventions. `src/lib/api.ts` is the explicit translation boundary.

| React field | Laravel field |
|---|---|
| `categoryId` | `category` |
| `expirationDate` | `expiryDate` |
| `unitCost` | `unitPrice` |
| `zoneId` | `zone` |
| `type: stock-in` | `transactionType: stock_in` |
| `type: stock-out` | `transactionType: stock_out` |
| `fromWarehouseId` | `sourceWarehouse` |
| `toWarehouseId` | `destinationWarehouse` |
| `in-transit` | `in_transit` |

Additional migrations preserve the new UI's warehouse address/zones, maximum stock, supplier reference, transaction metadata, and transfer approval metadata.

## Source-of-truth status

### Laravel-backed

- Warehouses
- Warehouse zones stored with warehouses
- Inventory items
- Warehouse assignment
- Stock quantities
- Stock-in and stock-out transactions
- Transfers and transfer status changes
- Expiration dates
- Dashboard operational values
- Inventory reports and alerts derived from operational records

- Database-verified login, expiring bearer tokens, and password reset requests
- User and role CRUD
- Categories and suppliers
- Reorder requests and lifecycle status
- Notifications and alert acknowledgements
- System settings, theme preference, thresholds, and data exports

Laravel-issued tokens now protect User Management, and both Laravel and React enforce
administrator/manager account permissions. The next security phase should standardize
this on Laravel Sanctum and protect the remaining operational API routes.

## Backend integrity changes

- Transfer stock mutations execute inside database transactions.
- Inventory rows are locked during transfer quantity changes.
- Stock-in and stock-out mutations lock inventory rows and reject negative stock.
- Warehouse deletion unassigns items only when no immutable transaction/transfer history exists.
- Insufficient transfer stock is rejected instead of silently clamping quantity to zero.
- SKU uniqueness is scoped by warehouse, allowing a SKU to exist at both source and destination after a partial transfer.
- SQLite uses `strftime` for monthly reporting while MySQL uses `DATE_FORMAT`.
- Laravel serves the current `dist/index.html`; the old Blade pages are not part of the canonical runtime.

## Verification status

- Frontend TypeScript check: passing.
- Frontend Vite production build: passing.
- Changed PHP files: syntax checks passing.
- Laravel PHPUnit suite: not executed because the locally discovered XAMPP PHP is 8.2.12 while the installed Composer dependencies require PHP 8.4.1 or newer.
- Production bundle warning: the JavaScript bundle is approximately 539 kB before gzip and should eventually be split by page.

## Repository hygiene

The repository historically tracked dependency and build directories. `.gitignore` now covers root/backend `node_modules`, `dist`, environment files, and logs, but already tracked dependency files remain in the Git index until intentionally removed in a separate cleanup.

Empty root directories such as `app/`, `bootstrap/`, `resources/`, and `routes/` are legacy remnants. Laravel's real versions are under `backend/`.

## Recommended next phase

1. Install PHP 8.4.1 or newer and run migrations/tests.
2. Add Laravel Sanctum authentication and authorization middleware.
3. Add feature tests for completed/partial transfers and authorization rules.
4. Add React component/API tests.
5. Add route-based lazy loading to reduce the production bundle.
6. Perform a deliberate Git cleanup of already tracked dependencies and generated files.
