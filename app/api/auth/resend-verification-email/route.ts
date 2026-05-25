import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Ingresá tu correo." }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "No encontramos una cuenta con ese correo." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Tu email ya está verificado. Podés ingresar." });
    }

    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const origin = request.headers.get("origin") || undefined;
    await sendVerificationEmail(email, token, user.name, origin);

    return NextResponse.json({ message: "Reenviamos el link de verificación. Revisá tu bandeja de entrada." });
  } catch {
    return NextResponse.json({ error: "Error al reenviar. Intentalo de nuevo." }, { status: 500 });
  }
}
