# Inventory Tracking System

Laravel 12 API and React/Vite frontend for managing inventory, departments, and storage locations.

## Requirements

- PHP 8.2 or newer with `mbstring`, `openssl`, `pdo_sqlite`, `tokenizer`, and `xml`
- Composer 2
- Node.js 20.19+ or 22.12+, and npm

SQLite is the default database; no database server is needed for local development. If PowerShell uses a different PHP executable than the one you want, set it for the current terminal before setup:

```powershell
$env:WAREHOUSEIQ_PHP_PATH = 'C:\xampp\php\php.exe'
& $env:WAREHOUSEIQ_PHP_PATH --version
```

## First-time setup

From this repository's root directory:

```powershell
npm ci
npm run setup
```

Setup installs the Laravel dependencies, creates `backend/.env` when missing, generates the app key, creates the SQLite database when needed, clears cached configuration, and applies database migrations. The migrations add the department field to existing storage locations while preserving the current inventory and transaction data.

Optionally load the demonstration records once:

```powershell
Push-Location .\backend
if ($env:WAREHOUSEIQ_PHP_PATH) { & $env:WAREHOUSEIQ_PHP_PATH artisan db:seed } else { php artisan db:seed }
Pop-Location
```

Demo account details are in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md). Seeding modifies the database, so skip it if existing data must be preserved.

## Run locally

Start the frontend and API together from the repository root:

```powershell
npm run dev
```

Open <http://127.0.0.1:5173>. The API runs at <http://127.0.0.1:8000>. To start them in separate terminals, use `npm run dev:api` and `npm run dev:web` (no space in `dev:api`). Check API health with:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Departments and storage locations

Open **Departments & Storage Locations** to create department/location records and assign unlocated products. Staff and administrators can assign products; only administrators can manage the location records. Inventory, borrow/return, stock movement, transfer, capacity, and report flows use the assigned location. Products without an assignment remain **Unassigned** and can still be borrowed when stock is available.

The existing storage-location API and database relationship are retained for compatibility with inventory history. An upgrade adds the department field to existing locations and sets them to **General**. Run `npm run setup` after pulling this version to apply the migration.

Timestamps are stored as UTC instants and displayed in the system timezone. The default timezone is **Asia/Manila**; administrators can change it under **System Settings → General**. Date-only values such as expiry and due dates stay calendar dates and are not shifted between timezones. Dashboard daily totals and overdue/expiry status use the configured timezone.

## Build and more setup details

Create a production frontend build with `npm run build`. See [backend/README.md](backend/README.md) for database configuration, production preview, tests, and troubleshooting instructions.
