import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFinanceTrend } from "@/lib/finance";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const months = Math.min(Math.max(parseInt(searchParams.get("months") ?? "6", 10) || 6, 2), 12);

  const trend = await getFinanceTrend(user.workspaceId, months);
  return NextResponse.json({ trend });
}
