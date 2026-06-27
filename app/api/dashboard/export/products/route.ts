import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const workspaceId = user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  }

  const products = await getPrisma().product.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      catalogItems: {
        include: { supplier: true },
      },
    },
  });

  const headers = [
    "Producto",
    "SKU",
    "Stock Actual",
    "Stock Mínimo",
    "Precio Costo",
    "Precio Venta",
    "Categoría",
    "Proveedores",
  ];

  const rows = products.map((p) => [
    escapeCsv(p.name),
    escapeCsv(p.sku),
    p.currentStock,
    p.minStock,
    Number(p.costPrice).toFixed(2),
    Number(p.sellingPrice).toFixed(2),
    escapeCsv(p.category ?? ""),
    escapeCsv(p.catalogItems.map((c) => c.supplier.name).join("; ")),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\r\n");

  const encoder = new TextEncoder();
  const bytes = encoder.encode("\uFEFF" + csv);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        `attachment; filename="inventario-ztocky-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
