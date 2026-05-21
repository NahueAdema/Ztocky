import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getReorderRisksForDashboard } from "@/lib/data/inventory";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const risks = await getReorderRisksForDashboard(user.workspaceId);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source: process.env.DATABASE_URL ? "database" : "mock",
    risks,
  });
}
