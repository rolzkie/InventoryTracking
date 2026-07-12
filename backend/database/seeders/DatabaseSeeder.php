<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use App\Models\InventoryItem;
use App\Models\Transfer;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Warehouses
        $warehouses = [
            ['name' => 'New York Distribution Center', 'location' => 'Brooklyn, NY 11201', 'capacity' => 50000, 'manager' => 'John Martinez'],
            ['name' => 'Los Angeles Warehouse', 'location' => 'Long Beach, CA 90801', 'capacity' => 45000, 'manager' => 'Sarah Johnson'],
            ['name' => 'Chicago Regional Hub', 'location' => 'Chicago, IL 60601', 'capacity' => 40000, 'manager' => 'Michael Chen'],
            ['name' => 'Atlanta Southeast Hub', 'location' => 'Atlanta, GA 30303', 'capacity' => 35000, 'manager' => 'Emma Rodriguez'],
            ['name' => 'Seattle Pacific Region', 'location' => 'Seattle, WA 98101', 'capacity' => 30000, 'manager' => 'David Park'],
        ];

        $warehouseIds = [];
        foreach ($warehouses as $wh) {
            $warehouse = Warehouse::firstOrCreate(
                ['name' => $wh['name']],
                $wh
            );
            $warehouseIds[] = $warehouse->id;
        }

        // Inventory Items
        $items = [
            ['sku' => 'CTRL-2024-A1', 'name' => 'Industrial Control Unit', 'description' => 'PLC-based industrial automation controller', 'category' => 'Electronics', 'quantity' => 245, 'reorderPoint' => 50, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 1250],
            ['sku' => 'SENS-HUM-PRO', 'name' => 'Humidity Sensor Pro', 'description' => 'High-precision humidity and temperature sensor', 'category' => 'Electronics', 'quantity' => 1205, 'reorderPoint' => 100, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 45],
            ['sku' => 'RELAY-48V-100A', 'name' => '48V Heavy Duty Relay', 'description' => 'Industrial relay for high-current switching', 'category' => 'Electronics', 'quantity' => 32, 'reorderPoint' => 75, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 175],
            ['sku' => 'CAP-ALUM-470UF', 'name' => 'Aluminum Electrolytic Capacitor 470µF', 'description' => 'High-capacity electrolytic capacitor for industrial use', 'category' => 'Electronics', 'quantity' => 5420, 'reorderPoint' => 500, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 12],
            ['sku' => 'DIODE-SCHOTT-1N4148', 'name' => 'Schottky Diode 1N4148', 'description' => 'Fast switching diode for high-frequency circuits', 'category' => 'Electronics', 'quantity' => 0, 'reorderPoint' => 2000, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 2.5],
            ['sku' => 'PUMP-HYD-100CC', 'name' => 'Hydraulic Pump 100cc', 'description' => 'Variable displacement hydraulic pump', 'category' => 'Hardware', 'quantity' => 12, 'reorderPoint' => 5, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 2800],
            ['sku' => 'BALL-BEARING-6310', 'name' => 'Ball Bearing 6310 (50x110x27mm)', 'description' => 'Deep groove ball bearing for high-speed applications', 'category' => 'Hardware', 'quantity' => 340, 'reorderPoint' => 50, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 35],
            ['sku' => 'MOTOR-STEP-NEMA23', 'name' => 'Stepper Motor NEMA 23', 'description' => 'High-torque stepper motor for CNC and robotics', 'category' => 'Hardware', 'quantity' => 67, 'reorderPoint' => 10, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 150],
            ['sku' => 'VALVE-SOLENOID-24V', 'name' => 'Solenoid Valve 24VDC', 'description' => '2/2 normally closed solenoid valve for fluid control', 'category' => 'Hardware', 'quantity' => 89, 'reorderPoint' => 20, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 125],
            ['sku' => 'ISO-ALCO-99.9', 'name' => 'Isopropyl Alcohol 99.9%', 'description' => 'High-purity isopropyl alcohol for cleaning and assembly', 'category' => 'Chemicals', 'quantity' => 450, 'reorderPoint' => 100, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 22],
            ['sku' => 'LUBR-SYNTH-500ML', 'name' => 'Synthetic Lubricant 500ml', 'description' => 'Advanced synthetic oil for machinery lubrication', 'category' => 'Chemicals', 'quantity' => 280, 'reorderPoint' => 50, 'warehouseId' => $warehouseIds[4], 'unitPrice' => 18],
            ['sku' => 'SOLDER-LEAD-500G', 'name' => 'Lead-based Solder Wire 500g', 'description' => 'High-quality solder for electronics assembly', 'category' => 'Chemicals', 'quantity' => 125, 'reorderPoint' => 30, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 35],
            ['sku' => 'BOX-CARDBOARD-12X8X6', 'name' => 'Cardboard Box 12x8x6 inches', 'description' => 'Standard corrugated cardboard shipping box', 'category' => 'Packaging', 'quantity' => 8920, 'reorderPoint' => 1000, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 0.85],
            ['sku' => 'FOAM-PACKING-SHEET', 'name' => 'Foam Packing Sheet (1/4 inch)', 'description' => 'Protective foam packing material', 'category' => 'Packaging', 'quantity' => 450, 'reorderPoint' => 100, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 3.5],
            ['sku' => 'TAPE-PACKING-2INCH', 'name' => 'Packing Tape 2 inch (36 rolls)', 'description' => 'Heavy-duty acrylic packing tape', 'category' => 'Packaging', 'quantity' => 180, 'reorderPoint' => 40, 'warehouseId' => $warehouseIds[4], 'unitPrice' => 28],
            ['sku' => 'ALU-EXTRUSION-20X20', 'name' => 'Aluminum Extrusion 20x20mm', 'description' => 'Industrial aluminum T-slot extrusion', 'category' => 'Raw Materials', 'quantity' => 2340, 'reorderPoint' => 500, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 8],
            ['sku' => 'STEEL-ROD-12MM', 'name' => 'Steel Rod 12mm Diameter', 'description' => 'High-carbon steel rod for machining', 'category' => 'Raw Materials', 'quantity' => 890, 'reorderPoint' => 200, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 15],
            ['sku' => 'COPPER-WIRE-AWG10', 'name' => 'Copper Wire AWG10', 'description' => 'Pure copper electrical wire', 'category' => 'Raw Materials', 'quantity' => 1250, 'reorderPoint' => 300, 'warehouseId' => $warehouseIds[2], 'unitPrice' => 4.5],
            ['sku' => 'PLASTIC-SHEET-ACRYLIC', 'name' => 'Acrylic Sheet Clear 1/4 inch', 'description' => 'Cast acrylic sheet for optical applications', 'category' => 'Raw Materials', 'quantity' => 45, 'reorderPoint' => 15, 'warehouseId' => $warehouseIds[3], 'unitPrice' => 65],
            ['sku' => 'LED-RGB-5MM', 'name' => 'RGB LED 5mm Common Anode', 'description' => 'Full-color LED for indicator applications', 'category' => 'Electronics', 'quantity' => 3240, 'reorderPoint' => 500, 'warehouseId' => $warehouseIds[4], 'unitPrice' => 0.35],
            ['sku' => 'COUPLING-FLEX-ALUMINUM', 'name' => 'Flexible Coupling Aluminum', 'description' => 'Aluminum flexible coupling for shaft alignment', 'category' => 'Hardware', 'quantity' => 156, 'reorderPoint' => 30, 'warehouseId' => $warehouseIds[1], 'unitPrice' => 95],
            ['sku' => 'FLUX-SOLDERING-25G', 'name' => 'Soldering Flux 25g', 'description' => 'Rosin-based soldering flux', 'category' => 'Chemicals', 'quantity' => 220, 'reorderPoint' => 40, 'warehouseId' => $warehouseIds[0], 'unitPrice' => 12],
        ];

        foreach ($items as $item) {
            InventoryItem::firstOrCreate(
                ['sku' => $item['sku']],
                $item
            );
        }

        // Transfers
        $allItems = InventoryItem::all();
        $transfers = [
            ['sourceWarehouse' => $warehouseIds[0], 'destinationWarehouse' => $warehouseIds[1], 'itemId' => $allItems[0]->id, 'itemName' => $allItems[0]->name, 'quantity' => 25, 'status' => 'completed', 'notes' => 'Regular stock redistribution'],
            ['sourceWarehouse' => $warehouseIds[1], 'destinationWarehouse' => $warehouseIds[2], 'itemId' => $allItems[1]->id, 'itemName' => $allItems[1]->name, 'quantity' => 150, 'status' => 'completed', 'notes' => 'Restocking Chicago hub'],
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
    }
}

