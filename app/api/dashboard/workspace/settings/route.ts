import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (user.role !== "OWNER") {
    return NextResponse.json({ error: "Solo el propietario puede editar el nombre" }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const prisma = getPrisma();

  await prisma.workspace.update({
    where: { id: user.workspaceId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ success: true, name: name.trim() });
}
