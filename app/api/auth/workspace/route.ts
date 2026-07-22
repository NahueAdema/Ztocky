import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { workspaceId } = body;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const prisma = getPrisma();

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId },
  });

  if (!member) {
    return NextResponse.json({ error: "No perteneces a ese workspace" }, { status: 403 });
  }

  cookieStore.set("active_workspace", workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ success: true, workspaceId });
}
