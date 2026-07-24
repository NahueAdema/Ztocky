-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'VOIDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "opening_amount" DECIMAL(10,2) NOT NULL,
    "closing_amount" DECIMAL(10,2),
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
    "expected_cash" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "notes" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- Step 1: Add new nullable columns to sales
ALTER TABLE "sales" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "sales" ADD COLUMN "user_id" TEXT;
ALTER TABLE "sales" ADD COLUMN "cash_register_id" TEXT;
ALTER TABLE "sales" ADD COLUMN "customer_id" TEXT;
ALTER TABLE "sales" ADD COLUMN "receipt_number" INTEGER;
ALTER TABLE "sales" ADD COLUMN "payment_method" "PaymentMethod" DEFAULT 'CASH';
ALTER TABLE "sales" ADD COLUMN "status" "SaleStatus" DEFAULT 'COMPLETED';
ALTER TABLE "sales" ADD COLUMN "discount_amount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "sales" ADD COLUMN "notes" TEXT;

-- Step 2: Migrate existing data - infer workspace_id from product
UPDATE "sales" SET "workspace_id" = (
  SELECT "workspace_id" FROM "products" WHERE "products"."id" = "sales"."product_id"
);

-- Step 3: Assign to workspace owner for existing sales
UPDATE "sales" SET "user_id" = (
  SELECT wm."user_id" FROM "workspace_members" wm
  WHERE wm."workspace_id" = "sales"."workspace_id" AND wm."role" = 'OWNER'
  LIMIT 1
);

-- Step 4: Generate sequential receipt_number per workspace
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at) AS rn
  FROM "sales" WHERE workspace_id IS NOT NULL
)
UPDATE "sales" SET "receipt_number" = n.rn
FROM numbered n WHERE "sales".id = n.id;

-- Step 5: Make required columns NOT NULL after data migration
ALTER TABLE "sales" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "receipt_number" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "payment_method" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "status" SET NOT NULL;

-- Step 6: Create unique constraint
CREATE UNIQUE INDEX "sales_workspace_id_receipt_number_key" ON "sales"("workspace_id", "receipt_number");

-- Step 7: Add indexes
CREATE INDEX "cash_registers_workspace_id_status_idx" ON "cash_registers"("workspace_id", "status");
CREATE INDEX "cash_registers_opened_by_idx" ON "cash_registers"("opened_by");
CREATE INDEX "customers_workspace_id_idx" ON "customers"("workspace_id");
CREATE INDEX "sales_user_id_idx" ON "sales"("user_id");
CREATE INDEX "sales_cash_register_id_idx" ON "sales"("cash_register_id");

-- Step 8: Add foreign keys
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 9: Create sale_items from existing sales data
INSERT INTO "sale_items" ("id", "sale_id", "product_id", "quantity", "unit_price", "discount_amount", "total_price")
SELECT
  gen_random_uuid()::text,
  id,
  "product_id",
  "quantity",
  "unit_price",
  0,
  "total_amount"
FROM "sales";

-- Step 10: Drop old columns (after sale_items are created)
ALTER TABLE "sales" DROP COLUMN "product_id";
ALTER TABLE "sales" DROP COLUMN "quantity";
ALTER TABLE "sales" DROP COLUMN "unit_price";

-- Step 11: Adjust total_amount precision
ALTER TABLE "sales" ALTER COLUMN "total_amount" TYPE DECIMAL(10,2);
