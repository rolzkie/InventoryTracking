# School Inventory Demo Accounts

Run migrations and seed the demo database from the `backend` folder:

```powershell
php artisan migrate --seed
```

The seeder creates or refreshes these development accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | `adminmiranda@gmail.com` | `admin123` |
| Inventory Staff | `jes@gmail.com` | `staff123` |
| Viewer | `employee@gmail.com` | `viewer123` |

Passwords are stored as Laravel password hashes. Change these demo credentials before deployment.
