import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`reset:${ip}`, 5, 60_000);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Esperá un minuto." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");

  if (!token || !password) {
    return NextResponse.json(
      { error: "Faltan datos requeridos." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const vt = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!vt || vt.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Link inválido o expirado. Solicitá uno nuevo." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: vt.userId },
    data: { passwordHash: hashPassword(password) },
  });

  await prisma.verificationToken.delete({
    where: { id: vt.id },
  });

  return NextResponse.json({
    ok: true,
    message: "Contraseña restablecida correctamente. Ya podés ingresar.",
  });
}
