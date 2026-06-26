import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`forgot:${ip}`, 3, 60_000);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Esperá un minuto." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "Ingresá tu correo electrónico." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user || !user.passwordHash) {
    return NextResponse.json({
      ok: true,
      message: "Si el correo existe y tiene contraseña, recibirás un link.",
    });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const origin = request.headers.get("origin") || undefined;
  await sendPasswordResetEmail(email, token, user.name, origin);

  return NextResponse.json({
    ok: true,
    message: "Si el correo existe y tiene contraseña, recibirás un link.",
  });
}
