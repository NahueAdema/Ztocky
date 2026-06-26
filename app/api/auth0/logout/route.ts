import { redirect } from "next/navigation";

import { getLogoutUrl } from "@/lib/auth0";
import { clearSession } from "@/lib/auth";

export async function GET() {
  await clearSession();
  redirect(getLogoutUrl());
}
