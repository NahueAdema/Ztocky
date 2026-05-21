import { NextResponse } from "next/server";

import { authenticateUser, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Ingresá correo y contraseña." },
      { status: 400 },
    );
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 },
    );
  }

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    redirectTo: user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard",
  });
}
