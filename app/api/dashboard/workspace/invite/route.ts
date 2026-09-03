import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/mail";
import { can, permissionError } from "@/lib/permissions";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "No perteneces a un workspace" }, { status: 400 });
  if (!can("workspace:invite", user.role)) {
    return NextResponse.json(permissionError("No tienes permiso para invitar miembros").json, { status: permissionError().status });
  }

  const prisma = getPrisma();

  const body = await request.json();
  const { email, role } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const normalizedRole = role === "ADMIN" ? "ADMIN" : "MEMBER";

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findFirst({
      where: { userId: existingUser.id, workspaceId: user.workspaceId },
    });
    if (existingMember) {
      return NextResponse.json({ error: "Este usuario ya es miembro del workspace" }, { status: 409 });
    }
  }

  const existingInvitation = await prisma.workspaceInvitation.findFirst({
    where: {
      workspaceId: user.workspaceId,
      email: email.toLowerCase().trim(),
      status: "PENDING",
    },
  });
  if (existingInvitation) {
    return NextResponse.json({ error: "Ya hay una invitación pendiente para este email" }, { status: 409 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId: user.workspaceId,
      email: email.toLowerCase().trim(),
      role: normalizedRole as "ADMIN" | "MEMBER",
      token,
      invitedByUserId: user.id,
      expiresAt,
    },
  });

  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });

  sendInvitationEmail(
    email.toLowerCase().trim(),
    user.name,
    workspace?.name || "Mi negocio",
    token,
  ).catch(() => {});

  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
  }, { status: 201 });
}
