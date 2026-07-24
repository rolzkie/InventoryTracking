# WarehouseIQ Registered Demo Accounts

These accounts are created or refreshed by `backend/database/seeders/DatabaseSeeder.php`.
Run `php artisan migrate --seed` after installing PHP 8.4.1 or newer.

## Quick Demo Access

Only these administrator and manager accounts appear as Quick Demo buttons on the
login page. Selecting a button signs in immediately.

| Role | Name | Email | Password |
|---|---|---|---|
| Administrator | Michael Torres | `m.torres@erp.com` | `admin123` |
| Manager | Jessica Wong | `j.wong@erp.com` | `manager123` |

## Other Registered Accounts

These active accounts can sign in manually but are not displayed in Quick Demo Access.

| Role | Name | Email | Password | Account management |
|---|---|---|---|---|
| Manager | David Kim | `d.kim@erp.com` | `manager123` | Yes |
| Staff | Amanda Rodriguez | `a.rodriguez@erp.com` | `staff123` | No |
| Staff | Brian Chen | `b.chen@erp.com` | `staff123` | No |

The following seeded account is inactive and cannot sign in:

| Role | Name | Email | Password | Status |
|---|---|---|---|---|
| Viewer | Sarah Johnson | `s.johnson@erp.com` | `staff123` | Inactive |

## Account-management permissions

- Administrators can create and manage accounts for every role.
- Managers can create and manage manager, staff, and viewer accounts.
- Managers cannot create, edit, delete, or promote an administrator account.
- No user can deactivate or delete their own account.
- Staff and viewer accounts cannot access User Management.

These are development credentials. Change or remove them before a production deployment.
