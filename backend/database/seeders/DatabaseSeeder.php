<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use App\Models\InventoryItem;
use App\Models\Transfer;
use App\Models\AppNotification;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Remove only the legacy demo data from the previous generic seed.
        $legacyWarehouseNames = [
            'New York Distribution Center',
            'Los Angeles Warehouse',
            'Chicago Regional Hub',
            'Atlanta Southeast Hub',
            'Seattle Pacific Region',
        ];
        $legacySkus = [
            'CTRL-2024-A1', 'SENS-HUM-PRO', 'RELAY-48V-100A', 'CAP-ALUM-470UF',
            'DIODE-SCHOTT-1N4148', 'PUMP-HYD-100CC', 'BALL-BEARING-6310',
            'MOTOR-STEP-NEMA23', 'VALVE-SOLENOID-24V', 'ISO-ALCO-99.9',
            'LUBR-SYNTH-500ML', 'SOLDER-LEAD-500G', 'BOX-CARDBOARD-12X8X6',
            'FOAM-PACKING-SHEET', 'TAPE-PACKING-2INCH', 'ALU-EXTRUSION-20X20',
            'STEEL-ROD-12MM', 'COPPER-WIRE-AWG10', 'PLASTIC-SHEET-ACRYLIC',
            'LED-RGB-5MM', 'COUPLING-FLEX-ALUMINUM', 'FLUX-SOLDERING-25G',
        ];

        $legacyItemIds = InventoryItem::whereIn('sku', $legacySkus)->pluck('id');
        Transfer::whereIn('itemId', $legacyItemIds)->delete();
        InventoryItem::whereIn('id', $legacyItemIds)->delete();

        Warehouse::whereIn('name', $legacyWarehouseNames)
            ->whereDoesntHave('inventoryItems')
            ->whereDoesntHave('outgoingTransfers')
            ->whereDoesntHave('incomingTransfers')
            ->delete();

        // School facilities used as inventory storage locations
        $warehouses = [
            ['name' => 'Computer Laboratory 1', 'location' => 'CEIT Building, Room 101', 'capacity' => 500, 'manager' => 'Alex Reyes'],
            ['name' => 'Computer Laboratory 2', 'location' => 'CEIT Building, Room 102', 'capacity' => 500, 'manager' => 'Jamie Santos'],
            ['name' => 'ICT Equipment Storage', 'location' => 'CEIT Building, Stockroom', 'capacity' => 800, 'manager' => 'Taylor Cruz'],
            ['name' => 'General Supplies Room', 'location' => 'Administration Building, Stockroom', 'capacity' => 1000, 'manager' => 'Morgan Garcia'],
        ];

        $warehouseIds = [];
        foreach ($warehouses as $wh) {
            $warehouse = Warehouse::updateOrCreate(['name' => $wh['name']], $wh);
            $warehouseIds[] = $warehouse->id;
        }

        // Inventory items based on the project description
        $items = [
            ['sku' => 'ICT-KBD-001', 'name' => 'USB Keyboard', 'description' => 'Standard wired USB keyboard for desktop computers', 'category' => 'Computer Equipment', 'quantity' => 35, 'reorderPoint' => 10, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 450],
            ['sku' => 'ICT-MOU-001', 'name' => 'USB Optical Mouse', 'description' => 'Standard wired optical mouse', 'category' => 'Computer Equipment', 'quantity' => 42, 'reorderPoint' => 10, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 250],
            ['sku' => 'ICT-MON-001', 'name' => 'LED Monitor 22-inch', 'description' => 'LED monitor for computer laboratory workstations', 'category' => 'Computer Equipment', 'quantity' => 24, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 5200],
            ['sku' => 'ICT-SYS-001', 'name' => 'Desktop System Unit', 'description' => 'Desktop computer system unit for student use', 'category' => 'Computer Equipment', 'quantity' => 25, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 18500],
            ['sku' => 'ICT-PRJ-001', 'name' => 'Multimedia Projector', 'description' => 'Projector for classroom and laboratory presentations', 'category' => 'Computer Equipment', 'quantity' => 4, 'reorderPoint' => 2, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 18500],
            ['sku' => 'ICT-UPS-001', 'name' => 'UPS 650VA', 'description' => 'Backup power supply for computer workstations', 'category' => 'Computer Equipment', 'quantity' => 12, 'reorderPoint' => 4, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 2300],
            ['sku' => 'ICT-LAN-001', 'name' => 'LAN Cable 5m', 'description' => 'Ethernet cable for network connections', 'category' => 'Computer Accessories', 'quantity' => 18, 'reorderPoint' => 10, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 180],
            ['sku' => 'ICT-SWT-001', 'name' => '8-Port Network Switch', 'description' => 'Ethernet switch for laboratory network connections', 'category' => 'Computer Accessories', 'quantity' => 6, 'reorderPoint' => 2, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 1250],
            ['sku' => 'ICT-HDM-001', 'name' => 'HDMI Cable 3m', 'description' => 'HDMI cable for projector and monitor connections', 'category' => 'Computer Accessories', 'quantity' => 14, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 220],
            ['sku' => 'LAB-ARD-001', 'name' => 'Arduino Uno R3', 'description' => 'Microcontroller board for basic electronics activities', 'category' => 'Laboratory Materials', 'quantity' => 20, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 650],
            ['sku' => 'LAB-BRD-001', 'name' => 'Breadboard 830 Points', 'description' => 'Solderless breadboard for circuit prototyping', 'category' => 'Laboratory Materials', 'quantity' => 25, 'reorderPoint' => 8, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 180],
            ['sku' => 'LAB-LED-001', 'name' => 'LED Assorted Pack', 'description' => 'Assorted LEDs for electronics laboratory exercises', 'category' => 'Laboratory Materials', 'quantity' => 15, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 120],
            ['sku' => 'LAB-RST-001', 'name' => 'Resistor Assorted Pack', 'description' => 'Assorted resistors for circuit activities', 'category' => 'Laboratory Materials', 'quantity' => 2, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 150],
            ['sku' => 'SUP-PPR-001', 'name' => 'A4 Bond Paper Ream', 'description' => 'A4 multipurpose bond paper, 500 sheets per ream', 'category' => 'Office Supplies', 'quantity' => 30, 'reorderPoint' => 10, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 250],
            ['sku' => 'SUP-INK-001', 'name' => 'Printer Ink Bottle', 'description' => 'Black printer ink for office and laboratory printers', 'category' => 'Office Supplies', 'quantity' => 8, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 380],
            ['sku' => 'SUP-MRK-001', 'name' => 'Whiteboard Marker Set', 'description' => 'Assorted-color whiteboard markers', 'category' => 'Office Supplies', 'quantity' => 18, 'reorderPoint' => 6, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 95],
            ['sku' => 'SUP-FLD-001', 'name' => 'Document Folder', 'description' => 'Long plastic document folder for school records', 'category' => 'Office Supplies', 'quantity' => 60, 'reorderPoint' => 15, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 18],
            ['sku' => 'FUR-CHR-001', 'name' => 'Computer Chair', 'description' => 'Basic office chair assigned to computer workstations', 'category' => 'Furniture', 'quantity' => 28, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 1800],
            ['sku' => 'FUR-TBL-001', 'name' => 'Computer Table', 'description' => 'Computer workstation table', 'category' => 'Furniture', 'quantity' => 22, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 2500],
            ['sku' => 'ICT-WBC-001', 'name' => 'Webcam', 'description' => 'USB webcam for online classes and meetings', 'category' => 'Computer Accessories', 'quantity' => 3, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 950],
        ];

        foreach ($items as $item) {
            InventoryItem::updateOrCreate(['sku' => $item['sku'], 'warehouseId' => $item['warehouseId']], $item);
        }

        // Sample stock transfers between school facilities
        $allItems = InventoryItem::all()->keyBy('sku');
        $transfers = [
            ['sourceWarehouse' => $warehouseIds[2], 'destinationWarehouse' => $warehouseIds[0], 'itemId' => $allItems['ICT-KBD-001']->id, 'itemName' => $allItems['ICT-KBD-001']->name, 'quantity' => 5, 'status' => 'completed', 'notes' => 'Keyboard allocation for Computer Laboratory 1'],
            ['sourceWarehouse' => $warehouseIds[2], 'destinationWarehouse' => $warehouseIds[1], 'itemId' => $allItems['ICT-MOU-001']->id, 'itemName' => $allItems['ICT-MOU-001']->name, 'quantity' => 8, 'status' => 'completed', 'notes' => 'Mouse replacement stock for Computer Laboratory 2'],
            ['sourceWarehouse' => $warehouseIds[3], 'destinationWarehouse' => $warehouseIds[0], 'itemId' => $allItems['SUP-PPR-001']->id, 'itemName' => $allItems['SUP-PPR-001']->name, 'quantity' => 3, 'status' => 'pending', 'notes' => 'Bond paper request for laboratory printing activities'],
        ];

        foreach ($transfers as $transfer) {
            Transfer::firstOrCreate(
                [
                    'sourceWarehouse' => $transfer['sourceWarehouse'],
                    'destinationWarehouse' => $transfer['destinationWarehouse'],
                    'itemId' => $transfer['itemId'],
                    'quantity' => $transfer['quantity'],
                ],
                $transfer
            );
        }

        // Product categories
        $categoryColors = [
            'Computer Equipment' => '#3B82F6',
            'Computer Accessories' => '#8B5CF6',
            'Laboratory Materials' => '#10B981',
            'Office Supplies' => '#F59E0B',
            'Furniture' => '#EF4444',
        ];

        foreach ($categoryColors as $name => $color) {
            Category::updateOrCreate(['name' => $name], ['color' => $color]);
        }

        // Sample suppliers
        $suppliers = [
            ['name' => 'TechCorp Industries', 'contact' => 'John Smith', 'email' => 'john@techcorp.com', 'phone' => '+1-555-0101'],
            ['name' => 'Global Industrial Supply', 'contact' => 'Sarah Lee', 'email' => 'sarah@globalindustrial.com', 'phone' => '+1-555-0102'],
            ['name' => 'MediSupply Inc.', 'contact' => 'Robert Chen', 'email' => 'rchen@medisupply.com', 'phone' => '+1-555-0103'],
            ['name' => 'Office Depot Pro', 'contact' => 'Emily Davis', 'email' => 'emily@odepot.com', 'phone' => '+1-555-0104'],
        ];
        foreach ($suppliers as $supplier) {
            Supplier::updateOrCreate(['name' => $supplier['name']], $supplier);
        }

        User::whereIn('email', [
            'AdminMiranda@.com',
            'AdminMiranda@gmail.com',
            'ManagerAnacta@gmail.com',
            'Thervs@gmail.com',
            'Jes@gmail.com',
            'Kevs@gmail.com',
            'Employee@gmail.com',
        ])->delete();

        $users = [
            ['name' => 'Errol Miranda', 'email' => 'adminmiranda@gmail.com', 'password' => 'admin123', 'role' => 'admin', 'permission' => 'manage', 'department' => 'Operations', 'active' => true],
            ['name' => 'Jesreel Domaanis', 'email' => 'jes@gmail.com', 'password' => 'staff123', 'role' => 'staff', 'permission' => 'manage', 'department' => 'Inventory', 'active' => true],
            ['name' => 'Employee', 'email' => 'employee@gmail.com', 'password' => 'viewer123', 'role' => 'viewer', 'permission' => 'view', 'department' => 'Finance', 'active' => true],
        ];
        foreach ($users as $userData) {
            $initials = collect(explode(' ', $userData['name']))
                ->map(fn ($part) => substr($part, 0, 1))
                ->implode('');
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'permission' => $userData['permission'],
                    'avatar' => $initials,
                    'department' => $userData['department'],
                    'active' => $userData['active'],
                    'api_token' => null,
                    'token_expires_at' => null,
                ],
            );
        }

        if (AppNotification::count() === 0) {
            AppNotification::create([
                'title' => 'WarehouseIQ connected',
                'message' => 'Operational data is now loaded from Laravel.',
                'type' => 'success',
                'read' => false,
            ]);
        }

        SystemSetting::updateOrCreate(['section' => 'general'], ['payload' => [
            'companyName' => 'WarehouseIQ Corp',
            'systemEmail' => 'system@warehouseiq.com',
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
            'dateFormat' => 'YYYY-MM-DD',
            'lowStockThreshold' => 10,
            'overstockThreshold' => 500,
        ]]);
        SystemSetting::updateOrCreate(['section' => 'notifications'], ['payload' => [
            'lowStockEmail' => true,
            'outOfStockEmail' => true,
            'expirationEmail' => true,
            'transferEmail' => false,
            'dailyDigest' => true,
            'weeklyReport' => true,
        ]]);
        SystemSetting::updateOrCreate(['section' => 'appearance'], ['payload' => [
            'darkMode' => true,
            'themeColor' => '#3B82F6',
        ]]);
        SystemSetting::updateOrCreate(['section' => 'thresholds'], ['payload' => [
            'lowStockMin' => 10,
            'overstockMax' => 500,
        ]]);
    }
}
