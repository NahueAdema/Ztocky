import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { getRequiredSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequiredSuperAdmin();

  if (!user) {
    redirect("/dashboard");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
