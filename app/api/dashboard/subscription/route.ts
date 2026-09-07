import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { computeAccessState, getOrCreateSubscription } from "@/lib/subscription";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const isSuperAdmin = user.globalRole === "SUPER_ADMIN";
  const subscription = user.workspaceId ? await getOrCreateSubscription(user.workspaceId) : null;

  const state = computeAccessState({ isSuperAdmin, subscription });

  return NextResponse.json(state);
}