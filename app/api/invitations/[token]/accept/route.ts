import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado", requireAuth: true }, { status: 401 });

  const { token } = await params;
  const prisma = getPrisma();

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invitación ya fue utilizada" }, { status: 410 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Invitación expirada" }, { status: 410 });
  }

  if (user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
    return NextResponse.json({ error: "Esta invitación es para otro usuario" }, { status: 403 });
  }

  const existingMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: invitation.workspaceId },
  });

  if (existingMember) {
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ success: true, message: "Ya eres miembro de este workspace" });
  }

  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: invitation.workspaceId,
      role: invitation.role as "ADMIN" | "MEMBER",
    },
  });

  await prisma.workspaceInvitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" },
  });

  return NextResponse.json({ success: true, workspaceId: invitation.workspaceId });
}
