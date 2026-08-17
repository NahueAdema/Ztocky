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
  const body = await request.json().catch(() => ({}));
  const role = String(body?.role || "");

  if (!["USER", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  if (id === admin.id && role === "USER") {
    return NextResponse.json(
      { error: "No podés quitarte tu propio rol de super admin." },
      { status: 400 },
    );
  }

  if (role === "USER") {
    const current = await getPrisma().user.findUnique({ where: { id } });
    const superAdminCount = await getPrisma().user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    });

    if (current?.role === "SUPER_ADMIN" && superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Debe quedar al menos un super admin activo." },
        { status: 400 },
      );
    }
  }

  await getPrisma().user.update({
    where: { id },
    data: { role: role as "USER" | "SUPER_ADMIN" },
  });

  return NextResponse.json({ ok: true, role });
}
