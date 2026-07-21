import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {
    workspaceId: user.workspaceId,
  };

  if (supplierId) where.supplierId = supplierId;

  const [items, total] = await Promise.all([
    prisma.supplierNotification.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.supplierNotification.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      supplierId: item.supplierId,
      supplierName: item.supplier.name,
      type: item.type,
      subject: item.subject,
      message: item.message,
      changesSummary: item.changesSummary,
      emailSentAt: item.emailSentAt?.toISOString() ?? null,
      emailTo: item.emailTo,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
