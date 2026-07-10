-- MySQL sample database for Enhance ERP Inventory System
-- Replace database name / user as needed.

-- Create schema (optional)
-- CREATE DATABASE IF NOT EXISTS inventory_tracking;
-- USE inventory_tracking;

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id           VARCHAR(32) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  location     VARCHAR(255) NOT NULL,
  capacity     INT NOT NULL,
  used         INT NOT NULL DEFAULT 0,
  manager      VARCHAR(255) NOT NULL,
  status       VARCHAR(32) NOT NULL,
  created_at   DATETIME NOT NULL
) ENGINE=InnoDB;

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory (
  id             VARCHAR(32) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  sku            VARCHAR(64) NOT NULL UNIQUE,
  category       VARCHAR(64) NOT NULL,
  warehouse_id   VARCHAR(32) NOT NULL,
  qty            INT NOT NULL DEFAULT 0,
  reorder_point INT NOT NULL DEFAULT 0,
  unit           VARCHAR(32) NOT NULL,
  cost           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes          TEXT NOT NULL,
  status         VARCHAR(32) NOT NULL,
  created_at     DATETIME NOT NULL,
  updated_at     DATETIME NULL,
  CONSTRAINT fk_inventory_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Transfers
CREATE TABLE IF NOT EXISTS transfers (
  id                VARCHAR(32) PRIMARY KEY,
  item_id           VARCHAR(32) NOT NULL,
  item_name         VARCHAR(255) NOT NULL,
  from_warehouse_id VARCHAR(32) NOT NULL,
  to_warehouse_id   VARCHAR(32) NOT NULL,
  qty               INT NOT NULL,
  transfer_date    DATE NOT NULL,
  status            VARCHAR(32) NOT NULL,
  initiator         VARCHAR(255) NOT NULL,
  notes             TEXT NOT NULL,
  created_at        DATETIME NOT NULL,
  updated_at        DATETIME NULL,
  INDEX idx_transfers_item_id (item_id),
  CONSTRAINT fk_transfers_from_wh
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transfers_to_wh
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Seed sample data (mirrors the current Supabase Hono sample objects)

INSERT INTO warehouses (id, name, location, capacity, used, manager, status, created_at)
VALUES
  ('WH-ALPHA', 'Alpha Distribution Center', 'Portland, OR', 12000, 8734, 'Sarah Chen', 'active', NOW()),
  ('WH-BETA',  'Beta Fulfillment Hub',      'Chicago, IL',  8500,  5210, 'Marcus Webb', 'active', NOW()),
  ('WH-GAMMA', 'Gamma Cold Storage',       'Dallas, TX',    5000,  4780, 'Priya Nair',  'near_full', NOW()),
  ('WH-DELTA', 'Delta Overflow Unit',      'Newark, NJ',    3000,   420, 'Tom Russo',   'active', NOW())
ON DUPLICATE KEY UPDATE
  name=VALUES(name), location=VALUES(location), capacity=VALUES(capacity), used=VALUES(used), manager=VALUES(manager), status=VALUES(status);

INSERT INTO inventory (id, name, sku, category, warehouse_id, qty, reorder_point, unit, cost, notes, status, created_at, updated_at)
VALUES
  ('INV-001', 'Circuit Board v3.2',    'CB-3200',  'Electronics',      'WH-ALPHA', 2847, 500, 'pcs',    42.50, '', 'in_stock',    NOW(), NULL),
  ('INV-002', 'Hydraulic Pump 12V',    'HP-012V',  'Hardware',         'WH-BETA',   134, 200, 'units', 189.00, '', 'low_stock',   NOW(), NULL),
  ('INV-003', 'Isopropyl Alcohol 99%', 'IPA-99',   'Chemicals',        'WH-ALPHA',     0, 100, 'liters',  8.75, '', 'out_of_stock',NOW(), NULL),
  ('INV-004', 'Bubble Wrap Roll 50m',  'BW-050',   'Packaging',        'WH-GAMMA',   892, 150, 'rolls',  14.20, '', 'in_stock',    NOW(), NULL),
  ('INV-005', 'Steel Rod 6mm × 3m',    'SR-6300',  'Raw Materials',    'WH-BETA',    312, 100, 'rods',    6.90, '', 'in_stock',    NOW(), NULL),
  ('INV-006', 'LED Strip 5050 RGB',    'LED-5050', 'Electronics',      'WH-ALPHA',    67, 200, 'meters',  3.40, '', 'low_stock',   NOW(), NULL),
  ('INV-007', 'Epoxy Resin 2-Part',    'ER-2PT',   'Chemicals',        'WH-GAMMA',   441,  80, 'kg',     22.00, '', 'in_stock',    NOW(), NULL),
  ('INV-008', 'Servo Motor MG996R',    'SM-MG996', 'Electronics',      'WH-ALPHA',     0,  50, 'pcs',    11.50, '', 'out_of_stock',NOW(), NULL),
  ('INV-009', 'Aluminum Sheet 1mm',    'AS-01MM',  'Raw Materials',    'WH-BETA',    650, 100, 'sheets', 18.00, '', 'in_stock',    NOW(), NULL),
  ('INV-010', 'Power Supply 24V 10A',  'PS-24V10', 'Electronics',      'WH-ALPHA',   203,  50, 'units',  55.00, '', 'in_stock',    NOW(), NULL)
ON DUPLICATE KEY UPDATE
  name=VALUES(name), sku=VALUES(sku), category=VALUES(category), warehouse_id=VALUES(warehouse_id),
  qty=VALUES(qty), reorder_point=VALUES(reorder_point), unit=VALUES(unit), cost=VALUES(cost),
  notes=VALUES(notes), status=VALUES(status), updated_at=VALUES(updated_at);

INSERT INTO transfers (id, item_id, item_name, from_warehouse_id, to_warehouse_id, qty, transfer_date, status, initiator, notes, created_at, updated_at)
VALUES
  ('TRF-2847', 'INV-001', 'Circuit Board v3.2',   'WH-BETA',  'WH-ALPHA', 200, '2026-07-09', 'completed', 'S. Chen', '', NOW(), NULL),
  ('TRF-2846', 'INV-004', 'Bubble Wrap Roll 50m', 'WH-ALPHA', 'WH-GAMMA',  50, '2026-07-09', 'in_transit','M. Webb', '', NOW(), NULL),
  ('TRF-2845', 'INV-005', 'Steel Rod 6mm × 3m',   'WH-GAMMA', 'WH-BETA',   100, '2026-07-08', 'in_transit','P. Nair', '', NOW(), NULL),
  ('TRF-2844', 'INV-006', 'LED Strip 5050 RGB',   'WH-ALPHA', 'WH-DELTA',   30, '2026-07-08', 'pending',   'T. Russo', '', NOW(), NULL),
  ('TRF-2843', 'INV-007', 'Epoxy Resin 2-Part',   'WH-BETA',  'WH-GAMMA',   75, '2026-07-07', 'completed', 'S. Chen', '', NOW(), NULL),
  ('TRF-2842', 'INV-002', 'Hydraulic Pump 12V',   'WH-ALPHA', 'WH-BETA',    20, '2026-07-07', 'cancelled', 'M. Webb', '', NOW(), NULL)
ON DUPLICATE KEY UPDATE
  item_id=VALUES(item_id), item_name=VALUES(item_name), from_warehouse_id=VALUES(from_warehouse_id),
  to_warehouse_id=VALUES(to_warehouse_id), qty=VALUES(qty), transfer_date=VALUES(transfer_date),
  status=VALUES(status), initiator=VALUES(initiator), notes=VALUES(notes), updated_at=VALUES(updated_at);

-- Notes:
-- - This SQL is a starting point for a MySQL backend.
-- - The current repo still uses Supabase KV + seed endpoint; wiring this SQL into Laravel is the next step.

