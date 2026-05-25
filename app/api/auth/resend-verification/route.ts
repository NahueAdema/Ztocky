import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (dbUser.emailVerified) {
    return NextResponse.json({ message: "Tu email ya está verificado." });
  }

  // Invalidar tokens anteriores
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
  await sendVerificationEmail(dbUser.email, token, dbUser.name, origin);

  return NextResponse.json({ message: "Email de verificación reenviado." });
}
