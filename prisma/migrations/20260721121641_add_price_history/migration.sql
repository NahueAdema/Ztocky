-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "catalog_item_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "previous_price" DECIMAL(65,30),
    "new_price" DECIMAL(65,30) NOT NULL,
    "previous_min_qty" INTEGER,
    "new_min_qty" INTEGER,
    "changeType" TEXT NOT NULL,
    "changed_by_user_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_supplier_id_created_at_idx" ON "price_history"("supplier_id", "created_at");

-- CreateIndex
CREATE INDEX "price_history_product_id_created_at_idx" ON "price_history"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "price_history_created_at_idx" ON "price_history"("created_at");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
