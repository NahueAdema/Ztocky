import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { type, message, email } = body;

  if (!type || !message) {
    return NextResponse.json({ error: "type y message son obligatorios" }, { status: 400 });
  }

  if (typeof message !== "string" || message.trim().length < 10) {
    return NextResponse.json({ error: "El mensaje debe tener al menos 10 caracteres" }, { status: 400 });
  }

  if (message.trim().length > 2000) {
    return NextResponse.json({ error: "El mensaje no puede superar 2000 caracteres" }, { status: 400 });
  }

  const prisma = getPrisma();

  await prisma.feedback.create({
    data: {
      userId: user.id,
      workspaceId: user.workspaceId ?? null,
      type,
      message: message.trim(),
      email: email?.trim() || null,
    },
  });

  return NextResponse.json({ success: true });
}
