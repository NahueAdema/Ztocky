import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  const auth: string | undefined = body?.keys?.auth;
  const p256dh: string | undefined = body?.keys?.p256dh;

  if (!endpoint || !auth || !p256dh) {
    return NextResponse.json(
      { error: "endpoint, keys.auth y keys.p256dh son obligatorios" },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: user.id,
      endpoint,
      authSecret: auth,
      p256dh,
      userAgent: request.headers.get("user-agent"),
    },
    update: {
      userId: user.id,
      authSecret: auth,
      p256dh,
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint es obligatorio" }, { status: 400 });
  }

  const prisma = getPrisma();
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
