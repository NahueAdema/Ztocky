import { getPrisma } from "./prisma";

type ChangeType = "CREATED" | "UPDATED" | "DELETED" | "IMPORTED";

interface RecordPriceChangeParams {
  catalogItemId: string;
  supplierId: string;
  productId: string;
  previousPrice?: number | null;
  newPrice: number;
  previousMinQty?: number | null;
  newMinQty?: number | null;
  changeType: ChangeType;
  changedByUserId?: string | null;
  notes?: string | null;
}

export async function recordPriceChange(params: RecordPriceChangeParams) {
  const prisma = getPrisma();

  return prisma.priceHistory.create({
    data: {
      catalogItemId: params.catalogItemId,
      supplierId: params.supplierId,
      productId: params.productId,
      previousPrice: params.previousPrice ?? null,
      newPrice: params.newPrice,
      previousMinQty: params.previousMinQty ?? null,
      newMinQty: params.newMinQty ?? null,
      changeType: params.changeType,
      changedByUserId: params.changedByUserId ?? null,
      notes: params.notes ?? null,
    },
  });
}

interface RecordBulkPriceChangesParams {
  supplierId: string;
  changedByUserId?: string | null;
  changes: Array<{
    catalogItemId: string;
    productId: string;
    previousPrice?: number | null;
    newPrice: number;
    previousMinQty?: number | null;
    newMinQty?: number | null;
    changeType: ChangeType;
    notes?: string | null;
  }>;
}

export async function recordBulkPriceChanges(params: RecordBulkPriceChangesParams) {
  const prisma = getPrisma();

  const data = params.changes.map((change) => ({
    catalogItemId: change.catalogItemId,
    supplierId: params.supplierId,
    productId: change.productId,
    previousPrice: change.previousPrice ?? null,
    newPrice: change.newPrice,
    previousMinQty: change.previousMinQty ?? null,
    newMinQty: change.newMinQty ?? null,
    changeType: change.changeType,
    changedByUserId: params.changedByUserId ?? null,
    notes: change.notes ?? null,
  }));

  return prisma.priceHistory.createMany({ data });
}
