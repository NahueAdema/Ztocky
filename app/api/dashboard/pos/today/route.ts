import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySales = await prisma.sale.findMany({
    where: {
      workspaceId: user.workspaceId!,
      saleDate: { gte: today, lt: tomorrow },
      status: "COMPLETED",
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { name: true } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const señaPayments = await prisma.accountPayment.findMany({
    where: {
      workspaceId: user.workspaceId!,
      createdAt: { gte: today, lt: tomorrow },
      note: { startsWith: "Seña venta" },
    },
    select: { amount: true },
  });

  let totalRevenue = 0;
  let cashTotal = 0;
  let cardTotal = 0;
  let transferTotal = 0;
  let accountTotal = 0;
  let totalItems = 0;
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

  for (const sale of todaySales) {
    const amount = Number(sale.totalAmount);
    totalRevenue += amount;

    switch (sale.paymentMethod) {
      case "CASH": cashTotal += amount; break;
      case "CARD": cardTotal += amount; break;
      case "TRANSFER": transferTotal += amount; break;
      case "ACCOUNT": accountTotal += amount; break;
    }

    for (const item of sale.items) {
      totalItems += item.quantity;
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = { name: item.product.name, quantity: 0, revenue: 0 };
      }
      productSales[key].quantity += item.quantity;
      productSales[key].revenue += Number(item.totalPrice);
    }
  }

  cashTotal += señaPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({
    summary: {
      totalRevenue,
      transactionCount: todaySales.length,
      totalItems,
      cashTotal,
      cardTotal,
      transferTotal,
      accountTotal,
      topProducts,
      recentSales: todaySales.slice(0, 20).map((s) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        totalAmount: Number(s.totalAmount),
        paymentMethod: s.paymentMethod,
        itemCount: s.items.length,
        seller: s.user.name,
        customer: s.customer?.name ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    },
  });
}
