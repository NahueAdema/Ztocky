import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

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

  console.log("[Feedback]", {
    userId: user.id,
    email: email || user.email,
    type,
    message: message.trim(),
    workspaceId: user.workspaceId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
