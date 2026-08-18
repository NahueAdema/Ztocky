import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, adminReply } = body;

  const prisma = getPrisma();

  const feedback = await prisma.feedback.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(adminReply !== undefined && { adminReply: adminReply || null }),
    },
  });

  return NextResponse.json({ feedback });
}
