-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('MONOTRIBUTO', 'RESPONSABLE_INSCRIPTO', 'EXENTO');

-- CreateEnum
CREATE TYPE "VoidPermission" AS ENUM ('ONLY_OWNER', 'OWNER_ADMIN', 'ALL');

-- CreateTable
CREATE TABLE "store_settings" (
    "workspace_id" TEXT NOT NULL,
    "business_name" TEXT,
    "cuit" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "contact_email" TEXT,
    "tax_regime" "TaxRegime",
    "sale_conditions" TEXT,
    "max_discount_pct" INTEGER NOT NULL DEFAULT 0,
    "void_permission" "VoidPermission" NOT NULL DEFAULT 'ONLY_OWNER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("workspace_id")
);

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
