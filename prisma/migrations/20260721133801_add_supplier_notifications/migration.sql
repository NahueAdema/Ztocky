-- CreateTable
CREATE TABLE "supplier_notifications" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "changes_summary" JSONB,
    "email_sent_at" TIMESTAMP(3),
    "email_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_notifications_supplier_id_created_at_idx" ON "supplier_notifications"("supplier_id", "created_at");

-- CreateIndex
CREATE INDEX "supplier_notifications_workspace_id_idx" ON "supplier_notifications"("workspace_id");

-- AddForeignKey
ALTER TABLE "supplier_notifications" ADD CONSTRAINT "supplier_notifications_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
