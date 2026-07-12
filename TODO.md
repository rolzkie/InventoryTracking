# Conversion Todo: React/Vite + Supabase → Laravel (Blade) + Tailwind + MySQL

## Step 1 — Backend scaffolding
- [x] Create `backend/` Laravel project structure (routes, controllers, models, migrations).
- [x] Configure MySQL connection in `.env.example`.

## Step 2 — Data model + migrations
- [x] Implement migrations + models for:
  - warehouses
  - inventory
  - transfers
- [x] Add constraints that match current logic (inventory SKU uniqueness, etc.).

## Step 3 — API endpoints (Laravel routes)
- [x] Implement routes matching current frontend calls:
  - POST `/api/seed`
  - GET `/api/dashboard`
  - GET/POST/PUT/DELETE `/api/warehouses`
  - GET/POST/PUT/DELETE `/api/inventory`
  - POST `/api/inventory/{id}/adjust`
  - GET/POST/PUT/DELETE `/api/transfers`
- [x] Implement transfer status transition rules identical to Supabase Hono logic.

## Step 4 — Blade UI (remove React)
- [x] Create Blade layout + Tailwind setup.
- [x] Implement pages matching current UI sections:
  - Dashboard
  - Inventory
  - Warehouses
  - Transfers
  - Reports
- [x] Implement forms and modals (server-side POST endpoints + validation).

## Step 5 — Frontend integration
- [x] Replace `src/lib/api.ts` calls with server-rendered data.
- [x] Remove Vite/React build artifacts/files (or leave unused) to avoid confusion.

## Step 6 — Testing & fix errors
- [x] Run migrations + seed endpoint.
- [x] Verify each page loads and actions (add/edit/delete/adjust/transfer status) work.
- [x] Fix any runtime, routing, validation, and DB errors.

