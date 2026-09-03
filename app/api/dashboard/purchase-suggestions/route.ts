import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPurchaseSuggestions, createOrdersFromSuggestions } from "@/lib/data/purchase-suggestion";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const result = await getPurchaseSuggestions(user.workspaceId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const groups = body.groups;

  if (!Array.isArray(groups) || groups.length === 0) {
    return NextResponse.json({ error: "No se proporcionaron grupos para crear" }, { status: 400 });
  }

  try {
    const created = await createOrdersFromSuggestions(user.workspaceId!, groups);
    const message = created.length > 0
      ? `${created.length} orden${created.length > 1 ? "es" : ""} de compra creada${created.length > 1 ? "s" : ""} para: ${created.map((o) => o.supplierName).join(", ")}`
      : "No se pudo generar ninguna orden";

    return NextResponse.json({ orders: created, message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear las órdenes de compra" }, { status: 500 });
  }
}
