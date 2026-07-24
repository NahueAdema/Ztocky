import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { saleId, reason } = body as { saleId: string; reason?: string };

  if (!saleId) {
    return NextResponse.json({ error: "saleId requerido" }, { status: 400 });
  }

  const prisma = getPrisma();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          id: saleId,
          workspaceId: user.workspaceId!,
          status: "COMPLETED",
        },
        include: { items: true },
      });

      if (!sale) {
        throw new Error("Venta no encontrada o ya anulada");
      }

      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      const updated = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "VOIDED",
          notes: reason ? `Anulada: ${reason}` : "Anulada por el usuario",
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      sale: {
        id: result.id,
        status: result.status,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al anular la venta";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
