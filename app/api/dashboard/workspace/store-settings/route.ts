import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, permissionError } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });

  const prisma = getPrisma();

  let settings = await prisma.storeSettings.findUnique({
    where: { workspaceId: user.workspaceId },
  });

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: { workspaceId: user.workspaceId },
    });
  }

  return NextResponse.json({
    businessName: settings.businessName,
    cuit: settings.cuit,
    address: settings.address,
    city: settings.city,
    phone: settings.phone,
    contactEmail: settings.contactEmail,
    taxRegime: settings.taxRegime,
    saleConditions: settings.saleConditions,
    maxDiscountPct: settings.maxDiscountPct,
    voidPermission: settings.voidPermission,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  if (!can("store:settings", user.role)) {
    return NextResponse.json(permissionError("Solo el propietario o administrador puede editar la configuración de la tienda").json, { status: permissionError().status });
  }

  const body = await request.json();
  const prisma = getPrisma();

  const data: Record<string, unknown> = {};
  if (body.businessName !== undefined) data.businessName = body.businessName || null;
  if (body.cuit !== undefined) data.cuit = body.cuit || null;
  if (body.address !== undefined) data.address = body.address || null;
  if (body.city !== undefined) data.city = body.city || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail || null;
  if (body.taxRegime !== undefined) data.taxRegime = body.taxRegime || null;
  if (body.saleConditions !== undefined) data.saleConditions = body.saleConditions || null;
  if (body.maxDiscountPct !== undefined) data.maxDiscountPct = Math.max(0, Math.min(100, Number(body.maxDiscountPct)));
  if (body.voidPermission !== undefined) data.voidPermission = body.voidPermission;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios para guardar" }, { status: 400 });
  }

  const settings = await prisma.storeSettings.upsert({
    where: { workspaceId: user.workspaceId },
    create: { workspaceId: user.workspaceId, ...data },
    update: data,
  });

  return NextResponse.json({
    success: true,
    settings: {
      businessName: settings.businessName,
      cuit: settings.cuit,
      address: settings.address,
      city: settings.city,
      phone: settings.phone,
      contactEmail: settings.contactEmail,
      taxRegime: settings.taxRegime,
      saleConditions: settings.saleConditions,
      maxDiscountPct: settings.maxDiscountPct,
      voidPermission: settings.voidPermission,
    },
  });
}
