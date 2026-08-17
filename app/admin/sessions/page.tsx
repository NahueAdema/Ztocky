import { getAdminSessions } from "@/lib/data/admin";
import { AdminSessionsClient } from "@/components/admin/admin-sessions-client";

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getAdminSessions({
    page: params.page ? Number(params.page) : 1,
    search: params.q || "",
    status: params.status || "",
  });

  return <AdminSessionsClient sessions={result.items} total={result.total} page={result.page} totalPages={result.totalPages} />;
}
