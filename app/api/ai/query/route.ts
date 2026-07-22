import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import groq, { GROQ_MODEL } from "@/lib/ai/groq";

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
        sales: {
          where: { saleDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
        catalogItems: { include: { supplier: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({ where, orderBy: { name: "asc" } }),
    prisma.alert.findMany({
      where: { ...where, isResolved: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  const productSummary = products.map((p) => {
    const sold = p.sales.reduce((s, sale) => s + sale.quantity, 0);
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

  const supplierSummary = suppliers.map((s) => ({
    nombre: s.name,
    leadTime: s.leadTime,
    costoEnvio: Number(s.shippingCost),
    confiabilidad: s.reliability,
  }));

  const alertSummary = alerts.map((a) => ({
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
    const answer = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content = answer.choices[0]?.message?.content || "No pude procesar la consulta.";

    return NextResponse.json({ answer: content });
  } catch (error) {
    console.error("Error en Groq:", error);
    return NextResponse.json({
      answer: "Lo siento, hubo un error al procesar tu consulta. Verificá que la API key de Groq esté configurada correctamente.",
    });
  }
}
