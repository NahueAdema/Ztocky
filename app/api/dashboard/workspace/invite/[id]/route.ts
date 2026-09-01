import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "No perteneces a un workspace" }, { status: 400 });

  const prisma = getPrisma();

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: user.workspaceId },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "No tienes permiso para cancelar invitaciones" }, { status: 403 });
  }

  const { id: invitationId } = await params;
  const invitation = await prisma.workspaceInvitation.findFirst({
    where: { id: invitationId, workspaceId: user.workspaceId },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  await prisma.workspaceInvitation.delete({ where: { id: invitationId } });

  return NextResponse.json({ success: true });
}
