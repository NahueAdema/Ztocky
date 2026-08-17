import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { recordBulkPriceChanges } from "@/lib/price-history";
import { sendPriceChangesToSupplier } from "@/lib/mail";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { supplierId, rows, apply } = body;

  if (!supplierId || !rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Proveedor y lista de precios requeridos" }, { status: 400 });
  }

  const prisma = getPrisma();

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, workspaceId: user.workspaceId },
  });
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const existingCatalog = await prisma.catalogItems.findMany({
    where: { supplierId },
    include: { product: { select: { sku: true } } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingBySku = new Map<string, any>(existingCatalog.map((c) => [c.product.sku, c]));

  const skus = rows.map((r: { sku: string }) => r.sku).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { workspaceId: user.workspaceId, sku: { in: skus } },
    select: { id: true, sku: true, name: true },
  });
  const productBySku = new Map<string, { id: string; sku: string; name: string }>(products.map((p) => [p.sku, p]));

  const matchedNew: { sku: string; productName: string; unitPrice: number; minOrderQty: number }[] = [];
  const matchedUpdate: { sku: string; productName: string; unitPrice: number; minOrderQty: number; previousUnitPrice: number }[] = [];
  const unmatched: { sku: string; unitPrice: number }[] = [];

  for (const row of rows) {
    const sku = row.sku?.trim();
    const unitPrice = Number(row.unitPrice ?? row.precio ?? 0);
    const minOrderQty = Number(row.minOrderQty ?? row.minimo ?? 1);

    if (!sku || !unitPrice) continue;

    const product = productBySku.get(sku);
    if (!product) {
      unmatched.push({ sku, unitPrice });
      continue;
    }

    const existing = existingBySku.get(sku);
    if (existing) {
      matchedUpdate.push({
        sku,
        productName: product.name,
        unitPrice,
        minOrderQty,
        previousUnitPrice: Number(existing.unitPrice),
      });
    } else {
      matchedNew.push({
        sku,
        productName: product.name,
        unitPrice,
        minOrderQty,
      });
    }
  }

  if (apply) {
    const historyChanges: Array<{
      catalogItemId: string;
      productId: string;
      previousPrice: number | null;
      newPrice: number;
      previousMinQty: number | null;
      newMinQty: number | null;
      changeType: "CREATED" | "UPDATED";
    }> = [];

    for (const item of matchedNew) {
      const product = productBySku.get(item.sku)!;
      const existing = existingBySku.get(item.sku);

      if (existing) {
        await prisma.catalogItems.update({
          where: { supplierId_productId: { supplierId, productId: product.id } },
          data: { unitPrice: item.unitPrice, minOrderQty: item.minOrderQty },
        });
        historyChanges.push({
          catalogItemId: existing.id,
          productId: product.id,
          previousPrice: Number(existing.unitPrice),
          newPrice: item.unitPrice,
          previousMinQty: existing.minOrderQty,
          newMinQty: item.minOrderQty,
          changeType: "UPDATED",
        });
      } else {
        const created = await prisma.catalogItems.create({
          data: { supplierId, productId: product.id, unitPrice: item.unitPrice, minOrderQty: item.minOrderQty },
        });
        historyChanges.push({
          catalogItemId: created.id,
          productId: product.id,
          previousPrice: null,
          newPrice: item.unitPrice,
          previousMinQty: null,
          newMinQty: item.minOrderQty,
          changeType: "CREATED",
        });
      }
    }

    for (const item of matchedUpdate) {
      const product = productBySku.get(item.sku)!;
      const existing = existingBySku.get(item.sku)!;
      await prisma.catalogItems.update({
        where: { supplierId_productId: { supplierId, productId: product.id } },
        data: { unitPrice: item.unitPrice, minOrderQty: item.minOrderQty },
      });
      historyChanges.push({
        catalogItemId: existing.id,
        productId: product.id,
        previousPrice: item.previousUnitPrice,
        newPrice: item.unitPrice,
        previousMinQty: existing.minOrderQty,
        newMinQty: item.minOrderQty,
        changeType: "UPDATED",
      });
    }

    if (historyChanges.length > 0) {
      await recordBulkPriceChanges({
        supplierId,
        changedByUserId: user.id,
        changes: historyChanges,
      });

      if (supplier.contactEmail) {
        const emailChanges = historyChanges.map((c) => {
          const product = products.find((p) => p.id === c.productId);
          return {
            productName: product?.name || "N/A",
            productSku: product?.sku || "",
            previousPrice: c.previousPrice,
            newPrice: c.newPrice,
            changeType: c.changeType,
          };
        });

        const notificationPromise = (async () => {
          try {
            await sendPriceChangesToSupplier(
              supplier.contactEmail!,
              supplier.name,
              user.workspaceName || "Tu tienda",
              emailChanges,
            );
            await prisma.supplierNotification.create({
              data: {
                supplierId,
                workspaceId: user.workspaceId,
                type: "PRICE_CHANGE",
                subject: `Actualización de ${emailChanges.length} precio(s)`,
                message: `${user.workspaceName || "Tu tienda"} actualizó ${emailChanges.length} producto(s) en tu catálogo.`,
                changesSummary: emailChanges,
                emailSentAt: new Date(),
                emailTo: supplier.contactEmail,
              },
            });
          } catch {
            await prisma.supplierNotification.create({
              data: {
                supplierId,
                workspaceId: user.workspaceId,
                type: "PRICE_CHANGE",
                subject: `Actualización de ${emailChanges.length} precio(s)`,
                message: `${user.workspaceName || "Tu tienda"} actualizó ${emailChanges.length} producto(s) en tu catálogo.`,
                changesSummary: emailChanges,
                emailSentAt: null,
                emailTo: supplier.contactEmail,
              },
            });
          }
        })();
        notificationPromise.catch(() => {});
      }
    }
  }

  return NextResponse.json({
    preview: !apply,
    applied: !!apply,
    summary: {
      total: rows.length,
      matchedNew: matchedNew.length,
      matchedUpdate: matchedUpdate.length,
      unmatched: unmatched.length,
    },
    matchedNew,
    matchedUpdate,
    unmatched,
  });
}
