import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getRequiredSuperAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getRequiredSuperAdmin();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const form = await request.formData();
  const status = String(form.get("status"));

  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (id === admin.id && status === "SUSPENDED") {
    return NextResponse.json(
      { error: "No podés suspender tu propia cuenta admin." },
      { status: 400 },
    );
  }

  await getPrisma().user.update({
    where: { id },
    data: { status: status as "ACTIVE" | "SUSPENDED" },
  });

  redirect("/admin/users");
}
