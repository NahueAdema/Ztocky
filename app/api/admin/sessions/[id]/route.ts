import { NextResponse } from "next/server";

import { getRequiredSuperAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getRequiredSuperAdmin();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;

  const session = await getPrisma().session.findUnique({ where: { id } });
  if (!session) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  await getPrisma().session.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
