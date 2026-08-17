import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { type, records } = body;

  if (!type || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "Tipo y registros son obligatorios" }, { status: 400 });
  }

  const prisma = getPrisma();
  let created = 0;
  const errors: string[] = [];

  if (type === "products") {
    for (const record of records) {
      try {
        await prisma.product.create({
          data: {
            name: record.name,
            sku: record.sku,
            description: record.description ?? null,
            currentStock: Number(record.currentStock) ?? 0,
            minStock: Number(record.minStock) ?? 10,
            costPrice: Number(record.costPrice) ?? 0,
            sellingPrice: Number(record.sellingPrice) ?? 0,
            category: record.category ?? null,
            isActive: record.isActive !== "false" && record.isActive !== false,
            workspaceId: user.workspaceId,
          },
        });
        created++;
      } catch (e: unknown) {
        errors.push(`SKU ${record.sku}: ${(e as Error).message}`);
      }
    }
  } else if (type === "suppliers") {
    for (const record of records) {
      try {
        await prisma.supplier.create({
          data: {
            name: record.name,
            contactEmail: record.contactEmail ?? null,
            contactPhone: record.contactPhone ?? null,
            leadTime: Number(record.leadTime) ?? 7,
            shippingCost: Number(record.shippingCost) ?? 0,
            reliability: Number(record.reliability) ?? 4.5,
            notes: record.notes ?? null,
            workspaceId: user.workspaceId,
          },
        });
        created++;
      } catch (e: unknown) {
        errors.push(`Proveedor ${record.name}: ${(e as Error).message}`);
      }
    }
  } else if (type === "sales") {
    for (const record of records) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            AND: [
              { OR: [{ sku: record.sku }, { id: record.productId }] },
              { workspaceId: user.workspaceId },
            ],
          },
        });

        if (!product) {
          errors.push(`Producto no encontrado: ${record.sku ?? record.productId}`);
          continue;
        }

        const quantity = Number(record.quantity);
        const unitPrice = Number(record.unitPrice);
        const totalAmount = quantity * unitPrice;

        const maxSale = await prisma.sale.findFirst({
          where: { workspaceId: user.workspaceId },
          orderBy: { receiptNumber: "desc" },
        });
        const receiptNumber = (maxSale?.receiptNumber ?? 0) + 1;

        await prisma.sale.create({
          data: {
            workspaceId: user.workspaceId,
            userId: user.id,
            receiptNumber,
            paymentMethod: "CASH",
            totalAmount,
            saleDate: new Date(record.saleDate),
            items: {
              create: {
                productId: product.id,
                quantity,
                unitPrice,
                totalPrice: totalAmount,
              },
            },
          },
        });
        created++;
      } catch (e: unknown) {
        errors.push(`Venta: ${(e as Error).message}`);
      }
    }
  } else {
    return NextResponse.json({ error: "Tipo de importacion no soportado" }, { status: 400 });
  }

  return NextResponse.json({
    created,
    total: records.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
