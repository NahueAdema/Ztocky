import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

import { getLoginUrl } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("auth0_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5,
  });

  redirect(getLoginUrl(state, request));
}
