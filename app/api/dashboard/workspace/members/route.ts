import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });

  const prisma = getPrisma();

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const invitations = await prisma.workspaceInvitation.findMany({
    where: { workspaceId: user.workspaceId, status: "PENDING" },
    include: {
      invitedByUser: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    })),
    invitations: invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      invitedBy: inv.invitedByUser?.name || "Desconocido",
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    })),
    workspaces: memberships.map((m) => ({
      id: m.workspaceId,
      name: m.workspace.name,
      role: m.role,
    })),
    activeWorkspaceId: user.workspaceId,
  });
}
