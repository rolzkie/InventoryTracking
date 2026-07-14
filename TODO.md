# Inventory Expiry & Expiring Notifications - TODO

Status: Plan created. Code changes pending.

## Backend
- [ ] Add `expiryDate` column to `inventory_items` via new migration.
- [ ] Update `InventoryItem` model: include `expiryDate` in `$fillable`, cast `expiryDate`.
- [ ] Update `InventoryItem` status logic to set status to `Expiring` when expiry is within next 7 days (and not already expired).
- [ ] Update `InventoryController` store/update validation to accept `expiryDate` and persist it.
- [ ] Add expiring notifications endpoint in `ReportController` (e.g. `/reports/expiring`) based on `inventory_items.expiryDate`.
- [ ] Update `backend/routes/api.php` to register new expiring reports route.

## Frontend
- [ ] Update `src/lib/api.ts` types + normalization to include `expiryDate`.
- [ ] Update `src/app/pages/InventoryPage.tsx`: add expiry date column and input field in add/edit modal.
- [ ] Update `src/app/pages/ReportsPage.tsx`: add Expiring Soon notification table/section using `/reports/expiring`.
- [ ] Update `src/app/components/ui.tsx` `StatusBadge` to support `Expiring` status.
- [ ] Update `src/app/pages/TransactionsPage.tsx`: when selecting an Item, auto-fill `warehouseId` and auto-fill `expirationDate` from item’s `expiryDate`.

## Local storage fallback
- [ ] Update `src/lib/local-storage-api.ts` to include expiryDate, compute Expiring status, and support the new expiring report endpoint.

## Verify
- [ ] Run backend migrations.
- [ ] Test UI flows: add item with expiry, inventory list shows Expiring badge, reports show expiring notifications, stock-in modal auto-fills warehouse+expiry.

