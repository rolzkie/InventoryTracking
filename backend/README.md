# School Inventory Management System

This project has a Laravel 12 JSON API and a React/Vite frontend. Run frontend commands from the repository root; the Laravel application is in `backend`.

## Requirements

- PHP **8.4.1 or newer** with the extensions required by Laravel (including `mbstring`, `openssl`, `pdo_sqlite`, `tokenizer`, and `xml` for the default SQLite setup).
- Composer 2.
- Node.js 20.19+ or 22.12+, and npm.
- SQLite is the default database, so no database server is needed. MySQL can be configured instead.

The locked backend dependencies require PHP 8.4.1+. XAMPP's bundled PHP may be older; check with `php --version` before setup. If PHP 8.4.1+ is installed but not on `PATH`, set its executable for the current PowerShell window:

```powershell
$env:WAREHOUSEIQ_PHP_PATH = 'C:\path\to\php.exe'
& $env:WAREHOUSEIQ_PHP_PATH --version
```

Keep using that PowerShell window for setup and startup so the application scripts use the same PHP executable. The project's `setup` and `dev` scripts also check the PHP version and stop with an actionable message if it is too old.

## First-time setup (Windows PowerShell)

Run these commands from the repository root:

```powershell
npm install --no-package-lock
npm run setup
```

`npm run setup` installs the Composer dependencies into `backend/vendor`, creates `backend/.env` from `.env.example` if needed, generates `APP_KEY`, creates the default SQLite database file when needed, clears Laravel's cached configuration, and runs migrations. This fixes the `vendor/autoload.php` error: Artisan commands cannot run until Composer dependencies have been installed.

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

From the repository root:

```powershell
npm run dev
```

This starts both services:

- Frontend: <http://127.0.0.1:5173>
- Laravel API: <http://127.0.0.1:8000>

Open the frontend URL in a browser. To run the services in separate terminals instead, run `npm run dev:api` in one and `npm run dev:web` in another, both from the repository root.

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
- **Composer reports an unsupported PHP version**: use PHP 8.4.1+ and set `WAREHOUSEIQ_PHP_PATH` to its executable in the same PowerShell window.
- **Composer is not recognized**: install Composer 2 and ensure it is available on `PATH`. On Windows, the setup script can also use Composer's standard `C:\ProgramData\ComposerSetup\bin\composer.phar` installation.
- **Port 8000 is in use**: choose another API port with `WAREHOUSEIQ_PORT` and update the Vite `/api` proxy in `vite.config.ts` to match.
- **Port 5173 is in use**: Vite automatically selects another available port; open the URL printed in the terminal.

## Data model

Schema is managed by `backend/database/migrations`. It includes users with role/permission fields, inventory items, categories, warehouses/storage locations, stock transactions, borrow records, activity logs, transfers, suppliers, and application support records. A separate roles table is not used; roles are validated enum-like string values on users.

Authentication uses an encrypted, HttpOnly, SameSite=Lax cookie that expires after eight hours. State-changing API requests require a short-lived CSRF token header. Viewer writes are rejected server-side. Borrow and return actions update stock and create corresponding stock transactions inside database transactions.
