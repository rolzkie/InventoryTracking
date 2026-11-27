# School Inventory Management System

This project has a Laravel 12 JSON API and a React/Vite frontend. Run frontend commands from the repository root; the Laravel application is in `backend`.

## Requirements

- PHP **8.2 or newer** with the extensions required by Laravel (including `mbstring`, `openssl`, `pdo_sqlite`, `tokenizer`, and `xml` for the default SQLite setup).
- Composer 2.
- Node.js 20.19+ or 22.12+, and npm.
- SQLite is the default database, so no database server is needed. MySQL can be configured instead.

The backend is locked to PHP 8.2 compatible Laravel 12 and Symfony 7 dependencies. Check the PHP executable PowerShell will use before setup:

```powershell
php --version
```

If PHP 8.2+ is installed but is not the `php` command on `PATH`, point the scripts at its executable. For example, XAMPP commonly installs PHP at `C:\xampp\php\php.exe`:

```powershell
$env:WAREHOUSEIQ_PHP_PATH = 'C:\xampp\php\php.exe'
& $env:WAREHOUSEIQ_PHP_PATH --version
```

Keep using that PowerShell window for setup and startup. Both scripts use the same PHP executable and report a clear error if it is older than 8.2.

## First-time setup (Windows PowerShell)

Run these commands from the repository root:

```powershell
npm ci
npm run setup
```

`npm ci` installs the frontend dependencies from the root lockfile. `npm run setup` installs Composer dependencies into `backend/vendor`, creates `backend/.env` from `.env.example` if needed, generates `APP_KEY`, creates the default SQLite database file when needed, clears Laravel's cached configuration, and runs migrations. No separate MySQL or SQLite server is needed for the default setup.

To load the sample inventory and demo accounts into the database, seed it once after setup:

```powershell
Push-Location .\backend
if ($env:WAREHOUSEIQ_PHP_PATH) {
    & $env:WAREHOUSEIQ_PHP_PATH artisan db:seed
} else {
    php artisan db:seed
}
Pop-Location
```

Seeder accounts are listed in [`../DEMO_ACCOUNTS.md`](../DEMO_ACCOUNTS.md). Seeding updates the sample data; do not run it against a database whose existing data you need to preserve.

## Run the application

From the repository root, run both the API and frontend together:

```powershell
npm run dev
```

This starts both services. Keep the terminal open while using the application:

- Frontend: <http://127.0.0.1:5173>
- Laravel API: <http://127.0.0.1:8000>

Open the frontend URL in a browser. If you want separate terminals, use these exact commands from the repository root (there is no space in `dev:api`):

```powershell
npm run dev:api
npm run dev:web
```

Check that the API is responding:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

The response should contain `status: ok`.

## Database configuration

SQLite is configured by default in `backend/.env`. The default database path is `backend/database/database.sqlite`; the setup script creates the file if it is missing. To use MySQL instead, create the database, set `DB_CONNECTION=mysql` and the `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` values in `backend/.env`, then run migrations from `backend`:

```powershell
php artisan migrate
```

If PHP is not on `PATH`, use `& $env:WAREHOUSEIQ_PHP_PATH artisan migrate` instead. Do not commit `.env` or its application key.

## Build and tests

From the repository root, type-check and create the production frontend build:

```powershell
npm run build
```

Run the Laravel test suite from `backend`:

```powershell
Push-Location .\backend
if ($env:WAREHOUSEIQ_PHP_PATH) {
    & $env:WAREHOUSEIQ_PHP_PATH artisan test
} else {
    php artisan test
}
Pop-Location
```

For a single-process local production preview, build first and then start the Laravel server from the repository root:

```powershell
npm run build
npm start
```

Open <http://127.0.0.1:8000>. Laravel serves the built React app and API from that address. `npm start` does not run the Vite development server.

## Troubleshooting

- **`Failed opening required ... backend/vendor/autoload.php`**: from the repository root, run `npm run setup`. If running the steps manually, install Composer packages first by running `composer install` from `backend`; only then can `php artisan key:generate` run.
- **PHP version error**: the project requires PHP 8.2 or newer. Check `php --version`, then install a supported PHP version or set `WAREHOUSEIQ_PHP_PATH` to its executable in the same PowerShell window.
- **Composer is not recognized**: install Composer 2 and ensure it is available on `PATH`. On Windows, the setup script can also use Composer's standard `C:\ProgramData\ComposerSetup\bin\composer.phar` installation.
- **Port 8000 is in use**: choose another API port with `WAREHOUSEIQ_PORT` and update the Vite `/api` proxy in `vite.config.ts` to match.
- **Port 5173 is in use**: Vite automatically selects another available port; open the URL printed in the terminal.

## Data model

Schema is managed by `backend/database/migrations`. It includes users with role/permission fields, inventory items, departments and storage locations, stock transactions, borrow records, activity logs, transfers, suppliers, and application support records. The existing storage-location API/table is retained for compatibility with inventory and transfer history.

Items without a department storage location are labeled **Unassigned**, not out of stock. Create a department and physical location under **Departments & Locations**, then assign products there; capacity, stock movements, and reports use that assignment. Staff and administrators can borrow available items before assigning them. Deleting a product archives it from active inventory while keeping its stock, borrow, and transfer history available for audit. Visitors are read-only accounts; their department can be set to **N/A**.

Authentication uses an encrypted, HttpOnly, SameSite=Lax cookie that expires after eight hours. State-changing API requests require a short-lived CSRF token header. Viewer and visitor writes are rejected server-side. Borrow and return actions update stock and create corresponding stock transactions inside database transactions.

Date-time values are stored as UTC instants and displayed in the configured system timezone. The default is **Asia/Manila**. Administrators can change the timezone in **System Settings → General**; dashboard day totals and date-based inventory status use that timezone. Date-only expiry and due dates are preserved as calendar dates.
