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

  const [accountSales, totalPayments] = await Promise.all([
    prisma.sale.aggregate({
      where: { customerId: id, workspaceId: user.workspaceId, paymentMethod: "ACCOUNT" },
      _sum: { totalAmount: true },
    }),
    prisma.accountPayment.aggregate({
      where: { customerId: id, workspaceId: user.workspaceId },
      _sum: { amount: true },
    }),
  ]);

  const totalOwed = Number(accountSales._sum.totalAmount ?? 0);
  const totalPaid = Number(totalPayments._sum.amount ?? 0);
  const balance = totalOwed - totalPaid;

  return NextResponse.json({
    totalOwed,
    totalPaid,
    balance,
  });
}
