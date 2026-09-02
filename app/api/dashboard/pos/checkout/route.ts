import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    items,
    paymentMethod,
    discountAmount,
    cashRegisterId,
    notes,
    customerId,
    amountPaid,
  } = body as {
    items: { productId: string; quantity: number; unitPrice: number; discountAmount?: number }[];
    paymentMethod: "CASH" | "CARD" | "TRANSFER" | "ACCOUNT";
    discountAmount?: number;
    cashRegisterId?: string;
    notes?: string;
    customerId?: string;
    amountPaid?: number;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  if (!paymentMethod) {
    return NextResponse.json({ error: "Método de pago requerido" }, { status: 400 });
  }

  if (paymentMethod === "ACCOUNT" && !customerId) {
    return NextResponse.json(
      { error: "Para cobrar a cuenta corriente debés seleccionar un cliente" },
      { status: 400 },
    );
  }

  if (amountPaid !== undefined && amountPaid < 0) {
    return NextResponse.json({ error: "El monto recibido no puede ser negativo" }, { status: 400 });
  }

  const prisma = getPrisma();

  try {
    if (customerId) {
      const customerExists = await prisma.customer.findFirst({
        where: { id: customerId, workspaceId: user.workspaceId },
      });
      if (!customerExists) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
      }
    }

    let amountPaidReported = 0;

    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, workspaceId: user.workspaceId },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }
        if (product.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}: ${product.currentStock} disponible, ${item.quantity} solicitado`);
        }
      }

      const maxSale = await tx.sale.findFirst({
        where: { workspaceId: user.workspaceId! },
        orderBy: { receiptNumber: "desc" },
        select: { receiptNumber: true },
      });
      const receiptNumber = (maxSale?.receiptNumber ?? 0) + 1;

      let totalAmount = 0;
      const saleItemsData = items.map((item) => {
        const product = productMap.get(item.productId)!;
        const itemDiscount = item.discountAmount ?? 0;
        const itemTotal = item.quantity * item.unitPrice - itemDiscount;
        totalAmount += itemTotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: itemDiscount,
          totalPrice: itemTotal,
        };
      });

      const finalDiscount = discountAmount ?? 0;
      const finalTotal = totalAmount - finalDiscount;

      const sale = await tx.sale.create({
        data: {
          workspaceId: user.workspaceId!,
          userId: user.id,
          receiptNumber,
          paymentMethod,
          discountAmount: finalDiscount,
          totalAmount: finalTotal,
          cashRegisterId: cashRegisterId || null,
          customerId: customerId || null,
          notes: notes || null,
          saleDate: new Date(),
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }

      const paidAmount = amountPaid && paymentMethod === "ACCOUNT" ? amountPaid : 0;
      amountPaidReported = paidAmount;
      if (paidAmount > 0 && customerId) {
        const señaNote = `Seña venta #${receiptNumber}${notes ? ` · ${notes}` : ""}`;
        await tx.accountPayment.create({
          data: {
            customerId,
            workspaceId: user.workspaceId!,
            userId: user.id,
            amount: paidAmount,
            note: señaNote,
          },
        });
      }

      return sale;
    });

    return NextResponse.json({
      success: true,
      sale: {
        id: result.id,
        receiptNumber: result.receiptNumber,
        totalAmount: Number(result.totalAmount),
        discountAmount: Number(result.discountAmount),
        paymentMethod: result.paymentMethod,
        amountPaid: result.paymentMethod === "ACCOUNT" ? Number(amountPaidReported) : Number(result.totalAmount),
        saleDate: result.saleDate.toISOString(),
        items: result.items.map((item) => ({
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          totalPrice: Number(item.totalPrice),
        })),
      },
    }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al procesar la venta";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
