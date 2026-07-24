import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { registerUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados registros. Esperá un minuto." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const cuitCuil = String(body.cuitCuil ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const invitationToken = String(body.invitationToken ?? "").trim() || null;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Completá todos los campos obligatorios." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden." },
        { status: 400 },
      );
    }

    const user = await registerUser({ name, email, cuitCuil, password });

    const prisma = getPrisma();

    if (invitationToken) {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token: invitationToken },
      });

      if (invitation && invitation.status === "PENDING" && new Date() <= invitation.expiresAt) {
        await prisma.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: invitation.workspaceId,
            role: invitation.role as "ADMIN" | "MEMBER",
          },
        });
        await prisma.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });
      }
    }

    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const origin = request.headers.get("origin") || undefined;
    await sendVerificationEmail(email, token, name, origin);

    return NextResponse.json({
      ok: true,
      redirectTo: invitationToken ? "/dashboard" : "/check-email",
      invitationAccepted: !!invitationToken,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Ya existe una cuenta con ese correo."
        : "No pudimos crear la cuenta. Revisá la conexión con la base.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
