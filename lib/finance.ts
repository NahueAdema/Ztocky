import { getPrisma } from "@/lib/prisma";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  return { from, to };
}

/**
 * Calcula los totales financieros de un mes: ingresos por ventas, egresos
 * manuales, compras y ganancia neta. Reutilizado por el reporte y el cierre mensual.
 */
export async function computeMonth(workspaceId: string, month: string) {
  const prisma = getPrisma();
  const { from, to } = monthRange(month);

  const [sales, manualExpenses, purchases] = await Promise.all([
    prisma.sale.aggregate({
      where: { workspaceId, status: "COMPLETED", saleDate: { gte: from, lt: to } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { workspaceId, date: { gte: from, lt: to } },
      select: { amount: true, category: true },
    }),
    prisma.stockReceipt.aggregate({
      where: { workspaceId, createdAt: { gte: from, lt: to } },
      _sum: { totalAmount: true },
    }),
  ]);

  const revenue = Number(sales._sum.totalAmount ?? 0);
  const purchasesTotal = Number(purchases._sum.totalAmount ?? 0);
  const manualTotal = manualExpenses.reduce((a, e) => a + Number(e.amount), 0);
  const expensesTotal = manualTotal + purchasesTotal;

  return {
    revenue,
    purchasesTotal,
    manualTotal,
    expensesTotal,
    netProfit: revenue - expensesTotal,
    byCategory: manualExpenses.reduce(
      (acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
        return acc;
      },
      {}
    ),
  };
}

/**
 * Verifica si un mes ya fue cerrado (archivado) en el workspace.
 */
export async function isMonthClosed(workspaceId: string, month: string) {
  const prisma = getPrisma();
  const close = await prisma.monthlyClose.findUnique({
    where: { workspaceId_month: { workspaceId, month } },
  });
  return Boolean(close);
}

/**
 * Cierra (congela) un mes: calcula el resultado actual y lo archiva en MonthlyClose.
 * Devuelve null si el mes ya estaba cerrado.
 */
export async function closeMonth(workspaceId: string, month: string, closedById: string) {
  const prisma = getPrisma();
  const existing = await prisma.monthlyClose.findUnique({
    where: { workspaceId_month: { workspaceId, month } },
  });
  if (existing) return null;

  const totals = await computeMonth(workspaceId, month);
  const created = await prisma.monthlyClose.create({
    data: {
      workspaceId,
      month,
      revenue: totals.revenue,
      manualExpenses: totals.manualTotal,
      purchases: totals.purchasesTotal,
      netProfit: totals.netProfit,
      closedById,
    },
  });
  return created;
}

/**
 * Devuelve el listado de cierres mensuales de un workspace, ordenado por mes.
 */
export async function listMonthlyCloses(workspaceId: string) {
  const prisma = getPrisma();
  return prisma.monthlyClose.findMany({
    where: { workspaceId },
    orderBy: { month: "desc" },
  });
}

/**
 * Devuelve los gastos recurrentes que vencen dentro de los próximos `days` días.
 * Un gasto recurrente se considera "próximo a vencer" si el día del mes en que
 * fue registrado cae dentro de la ventana [hoy, hoy + days].
 */
export async function getUpcomingRecurringExpenses(workspaceId: string, days = 7) {
  const prisma = getPrisma();
  const today = new Date();
  const target = new Date();
  target.setDate(target.getDate() + days);

  const recurring = await prisma.expense.findMany({
    where: { workspaceId, recurring: true },
  });

  return recurring.filter((e) => {
    const dayOfMonth = e.date.getDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dayOfMonth >= today.getDate() && dayOfMonth <= target.getDate();
  });
}

/**
 * Genera alertas in-app de tipo RECURRING_EXPENSE_DUE para los gastos
 * recurrentes que vencen próximamente y que aún no tienen una alerta activa.
 * Evita duplicados reusando la ventana de dedupe.
 */
export async function generateRecurringExpenseAlerts(workspaceId: string) {
  const prisma = getPrisma();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcoming = await getUpcomingRecurringExpenses(workspaceId, 7);

  const existing = await prisma.alert.findMany({
    where: {
      workspaceId,
      isResolved: false,
      type: "RECURRING_EXPENSE_DUE",
    },
    select: { metadata: true },
  });

  const existingSet = new Set(
    existing.map((a) => {
      const m = a.metadata as { expenseId?: string } | null;
      return m?.expenseId ?? "";
    })
  );

  let created = 0;
  for (const expense of upcoming) {
    if (existingSet.has(expense.id)) continue;

    const dueDay = expense.date.getDate();
    const description = expense.description || "Gasto recurrente";
    const message = `${description} vence el día ${dueDay} de este mes. Monto: $${Number(expense.amount)}.`;

    await prisma.alert.create({
      data: {
        workspaceId,
        type: "RECURRING_EXPENSE_DUE",
        title: "Vencimiento recurrente",
        message,
        href: "/dashboard/expenses",
        metadata: {
          expenseId: expense.id,
          amount: Number(expense.amount),
          dueDay,
          category: expense.category,
        },
      },
    });
    created++;
  }

  return created;
}

/**
 * Favorece el desglose del panel financiero: ingresos por método de pago,
 * desglose de egresos (manual por categoría + compras), ticket promedio y
 * margen sobre venta. Complementa a computeMonth con métricas de control diario.
 */
export async function computeFinanceOverview(workspaceId: string, month: string) {
  const prisma = getPrisma();
  const { from, to } = monthRange(month);

  const [sales, manualExpenses, purchases] = await Promise.all([
    prisma.sale.findMany({
      where: { workspaceId, status: "COMPLETED", saleDate: { gte: from, lt: to } },
      select: { totalAmount: true, paymentMethod: true },
    }),
    prisma.expense.findMany({
      where: { workspaceId, date: { gte: from, lt: to } },
      select: { amount: true, category: true, paymentMethod: true },
    }),
    prisma.stockReceipt.aggregate({
      where: { workspaceId, createdAt: { gte: from, lt: to } },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalSales = sales.reduce((a, s) => a + Number(s.totalAmount), 0);
  const transactionCount = sales.length;
  const purchasesTotal = Number(purchases._sum.totalAmount ?? 0);
  const manualTotal = manualExpenses.reduce((a, e) => a + Number(e.amount), 0);

  const revenueByMethod: Record<string, number> = {};
  for (const s of sales) {
    revenueByMethod[s.paymentMethod] = (revenueByMethod[s.paymentMethod] ?? 0) + Number(s.totalAmount);
  }

  const expensesByCategory = manualExpenses.reduce(
    (acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    },
    {}
  );

  const expensesByPayment = manualExpenses.reduce(
    (acc: Record<string, number>, e) => {
      acc[e.paymentMethod] = (acc[e.paymentMethod] ?? 0) + Number(e.amount);
      return acc;
    },
    {}
  );

  const expensesTotal = manualTotal + purchasesTotal;

  return {
    revenue: totalSales,
    transactionCount,
    averageTicket: transactionCount > 0 ? totalSales / transactionCount : 0,
    purchasesTotal,
    manualTotal,
    expensesTotal,
    netProfit: totalSales - expensesTotal,
    margin: totalSales > 0 ? ((totalSales - expensesTotal) / totalSales) * 100 : 0,
    revenueByMethod,
    expensesByCategory,
    expensesByPayment,
  };
}

/**
 * Devuelve una serie de `months` meses (históricos + actual) con { month, revenue,
 * expenses, netProfit } para gráficos de tendencia. Útil para el panel financiero.
 */
export async function getFinanceTrend(workspaceId: string, months = 6) {
  const now = new Date();
  const result: { month: string; revenue: number; expenses: number; netProfit: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const totals = await computeMonth(workspaceId, month);
    result.push({
      month,
      revenue: totals.revenue,
      expenses: totals.expensesTotal,
      netProfit: totals.netProfit,
    });
  }

  return result;
}
