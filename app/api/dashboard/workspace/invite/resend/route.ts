import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "No perteneces a un workspace" }, { status: 400 });

  const prisma = getPrisma();

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: user.workspaceId },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "No tienes permiso para invitar miembros" }, { status: 403 });
  }

  const body = await request.json();
  const { invitationId } = body;

  if (!invitationId) {
    return NextResponse.json({ error: "Falta el ID de la invitación" }, { status: 400 });
  }

  const invitation = await prisma.workspaceInvitation.findFirst({
    where: {
      id: invitationId,
      workspaceId: user.workspaceId,
      status: "PENDING",
    },
    include: {
      workspace: { select: { name: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada o ya utilizada" }, { status: 404 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Invitación expirada. Creá una nueva invitación." }, { status: 410 });
  }

  sendInvitationEmail(
    invitation.email,
    user.name,
    invitation.workspace.name,
    invitation.token,
  ).catch(() => {});

  return NextResponse.json({ success: true, message: "Invitación reenviada" });
}
