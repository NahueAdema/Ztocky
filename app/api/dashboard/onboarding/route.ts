import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await getPrisma().user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
