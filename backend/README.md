# School Inventory Management System

This project uses a Laravel 12 JSON API, SQLite by default, and a React/Vite frontend. Laravel migrations are the authoritative database schema; they create the indexed tables and foreign keys. The generated SQLite schema reference is `database/schema.sql`; it is SQLite-specific, while migrations are the portable schema source. The default database is `backend/database/database.sqlite` unless `DB_DATABASE` is set in `backend/.env`.

## Local setup (XAMPP)

Requirements: PHP 8.4+, Composer, Node.js, and npm. Start Apache/MySQL in XAMPP if using MySQL; SQLite requires no database service.

1. From the project root, install frontend packages with `npm install`.
2. In `backend`, copy `.env.example` to `.env` if needed and set `APP_KEY` by running `php artisan key:generate`.
3. Select `DB_CONNECTION=sqlite` for the default local database, or configure MySQL credentials in `.env`.
4. Run `php artisan migrate --seed` to create the schema and demo accounts.
5. From the project root run `npm run build`.
6. Start the API with `php artisan serve` from `backend`; in another terminal, use `npm run dev:web` from the root for the Vite development frontend. For the built frontend served by Laravel, run `npm start` from the root.

See [`../DEMO_ACCOUNTS.md`](../DEMO_ACCOUNTS.md) for development login credentials.

## Data model

Schema is managed by `database/migrations`. It includes users with role/permission fields, inventory items, categories, warehouses/storage locations, stock transactions, borrow records, activity logs, transfers, suppliers, and application support records. A separate roles table is not used; roles are validated enum-like string values on users.

Authentication uses an encrypted, HttpOnly, SameSite=Lax cookie that expires after eight hours. State-changing API requests require a short-lived CSRF token header. Viewer writes are rejected server-side. Borrow and return actions update stock and create corresponding stock transactions inside database transactions.
