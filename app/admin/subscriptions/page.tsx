import { AdminSubscriptionsClient } from "@/components/admin/admin-subscriptions-client";
import { getAdminSubscriptions } from "@/lib/data/admin";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getAdminSubscriptions({
    page: params.page ? Number(params.page) : 1,
    search: params.q || "",
  });

  const plans = await getPlans();

  return (
    <AdminSubscriptionsClient
      subscriptions={result.items}
      plans={plans}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      q={params.q || ""}
    />
  );
}

async function getPlans() {
  const { getPrisma } = await import("@/lib/prisma");
  const prisma = getPrisma();
  const items = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" as const },
  });
  return items.map((p) => ({
    id: p.id,
    tier: p.tier as string,
    name: p.name,
    priceUsd: Number(p.priceUsd),
  }));
}