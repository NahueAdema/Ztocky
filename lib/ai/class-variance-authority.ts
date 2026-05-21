import groq, { GROQ_MODEL } from './groq'
import { getPrisma } from '../db'

type SupplierCatalogItem = {
  unitPrice: unknown
  supplier: {
    name: string
    leadTime: number
    reliability: number
    shippingCost: unknown
  }
}

export async function analyzeBestSupplier(productId: string, urgency: 'normal' | 'urgent') {
  const prisma = getPrisma()
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      catalogItems: {
        include: {
          supplier: true
        }
      }
    }
  })

  if (!product) throw new Error('Producto no encontrado')

  const suppliers = (product.catalogItems as SupplierCatalogItem[]).map(item => ({
    name: item.supplier.name,
    price: item.unitPrice,
    leadTime: item.supplier.leadTime,
    reliability: item.supplier.reliability,
    shippingCost: item.supplier.shippingCost,
  }))

  const prompt = `Como experto en cadena de suministro, analiza estos proveedores para el producto "${product.name}":
  
  ${JSON.stringify(suppliers, null, 2)}
  
  Contexto: La urgencia es ${urgency === 'urgent' ? 'ALTA (necesitamos entrega rápida)' : 'NORMAL (priorizamos costo)'}.
  
  Recomienda el mejor proveedor y explica por qué. Formato JSON: { "supplier": "nombre", "reason": "explicación" }`

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en logística y cadena de suministro.'
      },
      { role: 'user', content: prompt }
    ],
    model: GROQ_MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0]?.message?.content || '{}')
}
