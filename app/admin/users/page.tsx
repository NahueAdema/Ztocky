import { Search } from "lucide-react";

import { getAdminUsers } from "@/lib/data/admin";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getAdminUsers({
    page: params.page ? Number(params.page) : 1,
    search: params.q || "",
    role: params.role || "",
    status: params.status || "",
  });

  return <AdminUsersClient users={result.items} total={result.total} page={result.page} totalPages={result.totalPages} />;
}
