# WarehouseIQ Integration Roadmap

## Required before local backend verification

- [ ] Install or select PHP 8.4.1 or newer.
- [ ] Run `composer install` in `backend/`.
- [ ] Run `php artisan migrate`.
- [ ] Run `php artisan test`.

## Laravel production modules

- [ ] Add Laravel Sanctum authentication.
- [x] Issue expiring Laravel bearer tokens for registered-account management.
- [x] Persist users and roles in Laravel.
- [x] Add category and supplier tables/endpoints.
- [x] Add reorder request endpoints and lifecycle rules.
- [x] Persist notifications and acknowledgement state.
- [x] Persist system settings.

## Testing

- [ ] Test partial and full transfer completion.
- [x] Add database-integrity regression coverage for stock-out and warehouse deletion.
- [ ] Test concurrent stock-out and transfer requests with a PHP 8.4 runtime.
- [ ] Test the additional React frontend database fields.
- [ ] Test SQLite and MySQL report queries.
- [ ] Add React API-client and page interaction tests.

## Maintenance

- [ ] Code-split frontend pages to reduce the main bundle.
- [ ] Remove already tracked `node_modules`, vendor artifacts, and generated builds from the Git index in a dedicated cleanup commit.
- [ ] Remove legacy root directories and Blade views after confirming they are no longer needed.
