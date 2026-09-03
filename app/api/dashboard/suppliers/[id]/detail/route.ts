import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupplierDetail } from "@/lib/data/supplier-detail";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const detail = await getSupplierDetail(id, user.workspaceId);
  if (!detail) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  return NextResponse.json({ supplier: detail });
}
