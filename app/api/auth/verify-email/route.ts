import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=token-invalido", request.url));
  }

  try {
    const prisma = getPrisma();
    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.redirect(new URL("/login?error=token-expirado", request.url));
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.delete({
        where: { id: record.id },
      }),
    ]);

    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=error-verificacion", request.url));
  }
}
