CREATE TABLE "activity_logs" ("id" integer primary key autoincrement not null, "userId" integer, "action" varchar not null, "subjectType" varchar, "subjectId" varchar, "details" text, "ipAddress" varchar, "created_at" datetime not null default CURRENT_TIMESTAMP, foreign key("userId") references "users"("id") on delete set null);

CREATE TABLE "alert_acknowledgements" ("id" integer primary key autoincrement not null, "alertId" varchar not null, "userId" integer, "acknowledgedAt" datetime not null, foreign key("userId") references "users"("id") on delete set null);

CREATE TABLE "app_notifications" ("id" integer primary key autoincrement not null, "userId" integer, "title" varchar not null, "message" text not null, "type" varchar not null default 'info', "read" tinyint(1) not null default '0', "created_at" datetime, "updated_at" datetime, foreign key("userId") references "users"("id") on delete cascade);

CREATE TABLE "borrow_records" ("id" integer primary key autoincrement not null, "itemId" integer not null, "borrowedBy" integer, "borrowerName" varchar not null, "quantity" integer not null, "quantityReturned" integer not null default '0', "borrowedAt" date not null, "expectedReturnAt" date not null, "returnedAt" datetime, "status" varchar not null default 'borrowed', "notes" text, "created_at" datetime, "updated_at" datetime, foreign key("itemId") references "inventory_items"("id") on delete restrict, foreign key("borrowedBy") references "users"("id") on delete set null);

CREATE TABLE "cache" ("key" varchar not null, "value" text not null, "expiration" integer not null, primary key ("key"));

CREATE TABLE "cache_locks" ("key" varchar not null, "owner" varchar not null, "expiration" integer not null, primary key ("key"));

CREATE TABLE "categories" ("id" integer primary key autoincrement not null, "name" varchar not null, "color" varchar not null default '#3B82F6', "created_at" datetime, "updated_at" datetime);

CREATE TABLE "failed_jobs" ("id" integer primary key autoincrement not null, "uuid" varchar not null, "connection" varchar not null, "queue" varchar not null, "payload" text not null, "exception" text not null, "failed_at" datetime not null default CURRENT_TIMESTAMP);

CREATE TABLE "inventory_items" ("id" integer primary key autoincrement not null, "sku" varchar not null, "name" varchar not null, "description" text, "category" varchar not null, "unit" varchar not null default ('pcs'), "quantity" integer not null default ('0'), "reorderPoint" integer not null default ('0'), "warehouseId" integer, "storageLocation" varchar, "unitPrice" numeric not null default ('0'), "lastRestocked" date, "status" varchar not null default ('unassigned'), "created_at" datetime, "updated_at" datetime, "zone" varchar, "rack" varchar, "shelf" varchar, "assignedAt" datetime, "expiryDate" date, "maxStock" integer not null default ('0'), "supplierId" varchar, foreign key("warehouseId") references warehouses("id") on delete restrict on update no action);

CREATE TABLE "job_batches" ("id" varchar not null, "name" varchar not null, "total_jobs" integer not null, "pending_jobs" integer not null, "failed_jobs" integer not null, "failed_job_ids" text not null, "options" text, "cancelled_at" integer, "created_at" integer not null, "finished_at" integer, primary key ("id"));

CREATE TABLE "jobs" ("id" integer primary key autoincrement not null, "queue" varchar not null, "payload" text not null, "attempts" integer not null, "reserved_at" integer, "available_at" integer not null, "created_at" integer not null);

CREATE TABLE "migrations" ("id" integer primary key autoincrement not null, "migration" varchar not null, "batch" integer not null);

CREATE TABLE "password_reset_tokens" ("email" varchar not null, "token" varchar not null, "created_at" datetime, primary key ("email"));

CREATE TABLE "reorder_requests" ("id" integer primary key autoincrement not null, "itemId" integer not null, "supplierId" integer, "quantity" integer not null, "status" varchar not null default 'pending', "estimatedDelivery" date, "notes" text, "created_at" datetime, "updated_at" datetime, foreign key("itemId") references "inventory_items"("id") on delete cascade, foreign key("supplierId") references "suppliers"("id") on delete set null);

CREATE TABLE "sessions" ("id" varchar not null, "user_id" integer, "ip_address" varchar, "user_agent" text, "payload" text not null, "last_activity" integer not null, primary key ("id"));

CREATE TABLE "stock_transactions" ("id" integer primary key autoincrement not null, "itemId" integer not null, "warehouseId" integer not null, "transactionType" varchar not null, "quantity" integer not null, "expirationDate" date, "notes" text, "createdAt" datetime, "created_at" datetime, "updated_at" datetime, "supplierId" varchar, "purpose" varchar, "referenceNumber" varchar, "processedBy" varchar, "unitCost" numeric not null default '0', foreign key("itemId") references "inventory_items"("id") on delete cascade, foreign key("warehouseId") references "warehouses"("id") on delete restrict);

CREATE TABLE "suppliers" ("id" integer primary key autoincrement not null, "name" varchar not null, "contact" varchar, "email" varchar, "phone" varchar, "created_at" datetime, "updated_at" datetime);

CREATE TABLE "system_settings" ("id" integer primary key autoincrement not null, "section" varchar not null, "payload" text not null, "created_at" datetime, "updated_at" datetime);

CREATE TABLE "transfers" ("id" integer primary key autoincrement not null, "sourceWarehouse" integer not null, "destinationWarehouse" integer not null, "itemId" integer not null, "itemName" varchar not null, "quantity" integer not null, "status" varchar not null default 'pending', "notes" text, "createdAt" datetime, "completedAt" datetime, "created_at" datetime, "updated_at" datetime, "fromZone" varchar, "fromRack" varchar, "fromShelf" varchar, "toZone" varchar, "toRack" varchar, "toShelf" varchar, "requestedBy" varchar, "approvedBy" varchar, foreign key("sourceWarehouse") references "warehouses"("id") on delete restrict, foreign key("destinationWarehouse") references "warehouses"("id") on delete restrict, foreign key("itemId") references "inventory_items"("id") on delete cascade);

CREATE TABLE "users" ("id" integer primary key autoincrement not null, "name" varchar not null, "email" varchar not null, "email_verified_at" datetime, "password" varchar not null, "remember_token" varchar, "created_at" datetime, "updated_at" datetime, "role" varchar not null default 'staff', "permission" varchar not null default 'manage', "avatar" varchar, "department" varchar, "last_login" datetime, "active" tinyint(1) not null default '1', "api_token" varchar, "token_expires_at" datetime);

CREATE TABLE "warehouses" ("id" integer primary key autoincrement not null, "name" varchar not null, "location" varchar not null, "capacity" integer not null default '0', "used" integer not null default '0', "manager" varchar, "created_at" datetime, "updated_at" datetime, "address" varchar, "zones" text);

CREATE INDEX "activity_logs_action_index" on "activity_logs" ("action");

CREATE INDEX "activity_logs_created_at_index" on "activity_logs" ("created_at");

CREATE INDEX "activity_logs_subjecttype_subjectid_index" on "activity_logs" ("subjectType", "subjectId");

CREATE UNIQUE INDEX "alert_acknowledgements_alertid_unique" on "alert_acknowledgements" ("alertId");

CREATE INDEX "borrow_records_itemid_status_index" on "borrow_records" ("itemId", "status");

CREATE INDEX "borrow_records_status_expectedreturnat_index" on "borrow_records" ("status", "expectedReturnAt");

CREATE INDEX "borrow_records_status_index" on "borrow_records" ("status");

CREATE INDEX "cache_expiration_index" on "cache" ("expiration");

CREATE INDEX "cache_locks_expiration_index" on "cache_locks" ("expiration");

CREATE UNIQUE INDEX "categories_name_unique" on "categories" ("name");

CREATE INDEX "failed_jobs_connection_queue_failed_at_index" on "failed_jobs" ("connection", "queue", "failed_at");

CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs" ("uuid");

CREATE UNIQUE INDEX "inventory_items_sku_warehouseid_unique" on "inventory_items" ("sku", "warehouseId");

CREATE INDEX "jobs_queue_index" on "jobs" ("queue");

CREATE INDEX "sessions_last_activity_index" on "sessions" ("last_activity");

CREATE INDEX "sessions_user_id_index" on "sessions" ("user_id");

CREATE UNIQUE INDEX "stock_transactions_referencenumber_unique" on "stock_transactions" ("referenceNumber");

CREATE UNIQUE INDEX "suppliers_name_unique" on "suppliers" ("name");

CREATE UNIQUE INDEX "system_settings_section_unique" on "system_settings" ("section");

CREATE UNIQUE INDEX "users_api_token_unique" on "users" ("api_token");

CREATE UNIQUE INDEX "users_email_unique" on "users" ("email");

-- Development seed accounts. Passwords below are bcrypt hashes.
INSERT INTO users (name, email, password, role, permission, avatar, department, active, created_at, updated_at) VALUES
('Errol Miranda', 'adminmiranda@gmail.com', '$2y$12$/jR792aRWWD8trOLVOntUOHezzQ9gruhritTNByGEATLYqvVtMyfG', 'admin', 'manage', 'EM', 'Administration', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Jesreel Domaanis', 'jes@gmail.com', '$2y$12$3wSdMc2ol2TlN.864UmBPOstMGdG/eBUhiNgNpfiAhOBLqfoouBiC', 'staff', 'manage', 'JD', 'Inventory', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Employee Viewer', 'employee@gmail.com', '$2y$12$dKFCXH2ivPmydfHt4kJVl.W.ExQDqE8Wt0/CACyhOwzahQ2hY0nVa', 'viewer', 'view', 'EV', 'School', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
