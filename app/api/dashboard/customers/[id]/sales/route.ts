import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

async function getCustomerAndVerify(id: string, workspaceId: string) {
  const prisma = getPrisma();
  return prisma.customer.findFirst({
    where: { id, workspaceId },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const { id } = await params;
  const customer = await getCustomerAndVerify(id, user.workspaceId);
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const prisma = getPrisma();
  const sales = await prisma.sale.findMany({
    where: { customerId: id, workspaceId: user.workspaceId, paymentMethod: "ACCOUNT" },
    include: { items: true },
    orderBy: { saleDate: "desc" },
  });

  return NextResponse.json({
    sales: sales.map((s) => ({
      id: s.id,
      receiptNumber: s.receiptNumber,
      totalAmount: Number(s.totalAmount),
      saleDate: s.saleDate.toISOString(),
      itemCount: s.items.length,
    })),
  });
}
