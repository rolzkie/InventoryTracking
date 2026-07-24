<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\ReorderRequest;
use App\Models\StockTransaction;
use App\Models\Supplier;
use App\Models\SystemSetting;
use App\Models\Transfer;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemDataController extends Controller
{
    public function export()
    {
        return response()->json([
            'exportedAt' => now()->toIso8601String(),
            'warehouses' => Warehouse::all(),
            'inventory' => InventoryItem::all(),
            'transactions' => StockTransaction::all(),
            'transfers' => Transfer::all(),
            'categories' => Category::all(),
            'suppliers' => Supplier::all(),
            'reorders' => ReorderRequest::all(),
            'notifications' => AppNotification::all(),
            'users' => User::all(),
            'settings' => SystemSetting::all(),
        ]);
    }

    public function reset(Request $request)
    {
        abort_unless(app()->environment('local', 'testing'), 403, 'Demo reset is only available locally.');

        $request->validate(['confirmation' => ['required', 'in:RESET']]);

        DB::transaction(function () {
            DB::table('alert_acknowledgements')->delete();
            DB::table('reorder_requests')->delete();
            DB::table('stock_transactions')->delete();
            DB::table('transfers')->delete();
            DB::table('inventory_items')->delete();
            DB::table('warehouses')->delete();
            DB::table('app_notifications')->delete();
            DB::table('system_settings')->delete();
            DB::table('suppliers')->delete();
            DB::table('categories')->delete();
            DB::table('password_reset_tokens')->delete();
            DB::table('users')->delete();

            app(DatabaseSeeder::class)->run();
        });

        return response()->json(['ok' => true]);
    }
}
