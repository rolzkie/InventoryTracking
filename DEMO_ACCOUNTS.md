# WarehouseIQ Registered Demo Accounts

These accounts are created or refreshed by `backend/database/seeders/DatabaseSeeder.php`.
Run `php artisan migrate --seed` after installing PHP 8.2 or newer.

## Registered Login Accounts

These accounts appear on the login page. Selecting an active account signs in
immediately. The inactive account is shown, but cannot sign in until an
administrator or manager activates it.

| Role | Name | Email | Password | Status |
|---|---|---|---|---|
| Administrator | Errol Miranda | `adminmiranda@gmail.com` | `admin123` | Active |
| Manager | Rolando Anacta | `manageranacta@gmail.com` | `manager123` | Active |
| Manager | Thervin Ranehart Bandril | `thervs@gmail.com` | `manager123` | Active |
| Staff | Jesreel Domaanis | `jes@gmail.com` | `staff123` | Active |
| Staff | Kevin Rei Gelle | `kevs@gmail.com` | `staff123` | Active |
| Viewer | Employee | `employee@gmail.com` | `staff123` | Inactive |

## Account-management Permissions

- Administrators can create and manage accounts for every role.
- Managers can create and manage manager, staff, and viewer accounts.
- Managers cannot create, edit, delete, or promote an administrator account.
- No user can deactivate or delete their own account.
- Staff and viewer accounts cannot access User Management.

These are development credentials. Change or remove them before a production deployment.
