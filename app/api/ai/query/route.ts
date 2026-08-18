import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { askAI } from "@/lib/ai/groq";

type ProductItem = { quantity: number };
type CatalogItem = {
  unitPrice: number | { toString(): string };
  supplier: { name: string; leadTime: number | null };
};
type ProductRow = {
  name: string;
  sku: string;
  currentStock: number;
  sellingPrice: number | { toString(): string };
  costPrice: number | { toString(): string };
  category: string | null;
  saleItems: ProductItem[];
  catalogItems: CatalogItem[];
};
type SupplierRow = {
  name: string;
  leadTime: number | null;
  shippingCost: number | { toString(): string };
  reliability: number | null;
};
type AlertRow = {
  type: string;
  productId: string;
  message: string;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { query } = await request.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "Consulta requerida" }, { status: 400 });
  }

  const prisma = getPrisma();
  const where = { workspaceId: user.workspaceId };

  const [products, suppliers, alerts, orderCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        saleItems: {
          where: {
            sale: { saleDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          },
        },
        catalogItems: { include: { supplier: true } },
      },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.supplier.findMany({ where, orderBy: { name: "asc" } }),
    prisma.alert.findMany({
      where: { ...where, isResolved: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  const productSummary = (products as unknown as ProductRow[]).map((p) => {
    const sold = p.saleItems.reduce((s, item) => s + item.quantity, 0);
    const burnRate = sold / 30;
    const cheapest = p.catalogItems.length > 0
      ? Math.min(...p.catalogItems.map((c) => Number(c.unitPrice)))
      : 0;
    return {
      nombre: p.name,
      sku: p.sku,
      stock: p.currentStock,
      precioVenta: Number(p.sellingPrice),
      precioCosto: Number(p.costPrice),
      categoria: p.category,
      vendidoUltimos30Dias: sold,
      burnRate: Number(burnRate.toFixed(1)),
      diasRestantes: burnRate > 0 ? Math.floor(p.currentStock / burnRate) : "sin ventas",
      mejorPrecioProveedor: cheapest,
      proveedores: p.catalogItems.map((c) => ({
        nombre: c.supplier.name,
        precio: Number(c.unitPrice),
        leadTime: c.supplier.leadTime,
      })),
    };
  });

  const supplierSummary = (suppliers as unknown as SupplierRow[]).map((s) => ({
    nombre: s.name,
    leadTime: s.leadTime,
    costoEnvio: Number(s.shippingCost),
    confiabilidad: s.reliability,
  }));

  const alertSummary = (alerts as unknown as AlertRow[]).map((a) => ({
    tipo: a.type,
    producto: a.productId,
    mensaje: a.message,
  }));

  const context = {
    productos: productSummary,
    proveedores: supplierSummary,
    alertasPendientes: alertSummary,
    totalOrdenesCompra: orderCount,
    periodo: "últimos 30 días",
  };

  const systemPrompt = `Sos un asistente de inventario experto en logística y supply chain. Trabajas para Ztocky, un sistema de gestión de stock.

El usuario te va a hacer una pregunta sobre el negocio en lenguaje natural.
Tenes acceso a datos reales del workspace: productos, ventas, proveedores, alertas y órdenes.

Respondé SIEMPRE en español argentino, claro y profesional.
Si la pregunta requiere un número o cálculo, mostralo formateado con $ o unidades.
Si no tenés datos suficientes para responder algo, decilo honestamente.
Sé conciso: 3-4 párrafos máximo.
Si la pregunta es de análisis, incluí una recomendación accionable.
No inventes datos que no estén en el contexto que te pasamos.`;

  const prompt = `Contexto actual del inventario (en formato JSON):

${JSON.stringify(context, null, 2)}

Pregunta del usuario: "${query}"

Respondé analizando los datos reales del contexto. Si te preguntan por productos específicos, usa los nombres reales del contexto.`;

  try {
    const { answer } = await askAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error en IA:", error);
    return NextResponse.json({
      answer: "Lo siento, hubo un error al procesar tu consulta. Verificá que las API keys de IA estén configuradas correctamente.",
    });
  }
}
