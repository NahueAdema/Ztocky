import { NextResponse } from "next/server";

import { getRequiredSuperAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getRequiredSuperAdmin();

  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const notes = typeof body?.notes === "string" ? body.notes : null;

  if (notes === null) {
    return NextResponse.json({ error: "Notes field required" }, { status: 400 });
  }

  await getPrisma().user.update({
    where: { id },
    data: { supportNotes: notes || null },
  });

  return NextResponse.json({ ok: true });
}
