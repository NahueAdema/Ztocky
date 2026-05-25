import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, cuitCuil: true, role: true, emailVerified: true },
  });

  return NextResponse.json({
    ...user,
    cuitCuil: dbUser?.cuitCuil ?? null,
    emailVerified: dbUser?.emailVerified ?? false,
    globalRole: dbUser?.role ?? "USER",
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const prisma = getPrisma();

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.cuitCuil !== undefined && { cuitCuil: body.cuitCuil || null }),
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
