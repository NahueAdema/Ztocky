import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const prisma = getPrisma();

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invitación ya fue utilizada", status: invitation.status }, { status: 410 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Invitación expirada" }, { status: 410 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    workspaceName: invitation.workspace.name,
    workspaceId: invitation.workspace.id,
    expiresAt: invitation.expiresAt.toISOString(),
    userExists: !!existingUser,
  });
}
