import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, permissionError } from "@/lib/permissions";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("workspace:members", user.role)) {
    return NextResponse.json(permissionError().json, { status: permissionError().status });
  }

  const { id: memberId } = await params;
  const body = await request.json();
  const { role } = body;

  if (!role || !["ADMIN", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const prisma = getPrisma();

  const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!member || member.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }
  if (member.role === "OWNER") {
    return NextResponse.json({ error: "No se puede cambiar el rol del propietario" }, { status: 403 });
  }

  await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("workspace:members", user.role)) {
    return NextResponse.json(permissionError().json, { status: permissionError().status });
  }

  const { id: memberId } = await params;
  const prisma = getPrisma();

  const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
  if (!member || member.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }
  if (member.role === "OWNER") {
    return NextResponse.json({ error: "No se puede eliminar al propietario" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}
