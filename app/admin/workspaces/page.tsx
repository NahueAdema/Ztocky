import { getAdminWorkspaces } from "@/lib/data/admin";
import { AdminWorkspacesClient } from "@/components/admin/admin-workspaces-client";

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getAdminWorkspaces({
    page: params.page ? Number(params.page) : 1,
    search: params.q || "",
  });

  return <AdminWorkspacesClient workspaces={result.items} total={result.total} page={result.page} totalPages={result.totalPages} />;
}
