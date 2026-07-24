# WarehouseIQ Inventory ERP

The canonical application is:

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 in `src/`
- **Backend:** Laravel 13 in `backend/`
- **Database:** SQLite by default, with Laravel's database configuration available for MySQL

Laravel is the source of truth for operational inventory data. The React application owns the user interface and communicates with Laravel through `/api`.

Seeded login credentials and their role permissions are listed in
[DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md). Quick Demo Access is limited to the primary
administrator and manager accounts.

## System flow

```text
React page
  -> AppContext operation
  -> src/lib/api.ts
  -> /api request
  -> Laravel route/controller
  -> Eloquent model
  -> SQLite or MySQL
  -> JSON response
  -> React refreshes operational state
```

Operational Laravel-backed modules:

- Dashboard data derived from inventory state
- Inventory
- Warehouses and zones
- Warehouse item assignment
- Stock-in and stock-out transactions
- Warehouse transfers
- Operational reports and alerts
- Database-verified login and password-reset requests
- User administration
- Reorder workflow
- Notifications and alert acknowledgements
- General, notification, security, appearance, and report-threshold settings
- CSV/JSON data export and local demo-data reset

## Development

Requirements:

- Node.js compatible with Vite 7
- PHP 8.2 or newer
- Composer

Install and initialize:

```powershell
npm install
cd backend
composer install
php artisan migrate
php artisan db:seed
```

Start Laravel and the React development server together:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to Laravel at `http://127.0.0.1:8000`.
The startup script automatically uses `C:\xampp\php\php.exe` when present. For
another PHP installation, set `WAREHOUSEIQ_PHP_PATH` to its executable path.

The checked-in local configuration uses `backend/database/database.sqlite`. To use
MySQL, set `DB_CONNECTION=mysql` plus `DB_HOST`, `DB_PORT`, `DB_DATABASE`,
`DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`, then run the migrations and
seeder. Laravel/Eloquent remains the only database access layer used by React.

## Production-style local run

Build the React application:

```powershell
npm run build
```

Then start Laravel:

```powershell
cd backend
php artisan serve
```

Open `http://127.0.0.1:8000`. Laravel serves the generated `dist/index.html` and assets while continuing to handle `/api`.

## Important folders

```text
src/                    Current React/Vite/Tailwind frontend
backend/app/            Laravel controllers and models
backend/routes/api.php  JSON API routes
backend/routes/web.php  React production shell and static assets
backend/database/       Migrations, seeders, and SQLite database
backend/tests/          Laravel feature and unit tests
public/                 Frontend static assets
dist/                   Generated React production build
```

The root-level `app/`, `bootstrap/`, `resources/`, and `routes/` directories are legacy empty remnants. The old Blade page files under `backend/resources/views/` are retained for reference but are no longer the canonical frontend.
