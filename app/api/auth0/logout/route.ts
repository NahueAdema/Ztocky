import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { getLogoutUrl } from "@/lib/auth0";
import { clearSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await clearSession();
  redirect(getLogoutUrl(request));
}
