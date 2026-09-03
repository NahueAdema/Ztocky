-- AlterTable
ALTER TABLE "cash_registers" ADD COLUMN     "device_id" TEXT;

-- CreateIndex
CREATE INDEX "cash_registers_device_id_idx" ON "cash_registers"("device_id");
