import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`changepw:${ip}:${user.id}`, 3, 60_000);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Completá ambos campos." },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!dbUser?.passwordHash) {
    return NextResponse.json(
      { error: "No podés cambiar la contraseña. Usá el inicio de sesión con Google." },
      { status: 400 },
    );
  }

  const { verifyPassword } = await import("@/lib/auth");

  if (!verifyPassword(currentPassword, dbUser.passwordHash)) {
    return NextResponse.json(
      { error: "La contraseña actual no es correcta." },
      { status: 403 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true, message: "Contraseña actualizada." });
}
