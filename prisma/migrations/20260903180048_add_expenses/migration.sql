-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'PAYROLL', 'SERVICES', 'SUPPLIES', 'MARKETING', 'TRANSPORT', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "payment_method" "ExpensePaymentMethod" NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_workspace_id_date_idx" ON "expenses"("workspace_id", "date");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
