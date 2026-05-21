import groq from './groq'
import { getPrisma } from '../db/index'

export async function analyzeBurnRate(productId: string) {
  const prisma = getPrisma()
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      sales: {
        where: {
          saleDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      }
    }
  })

  if (!product) throw new Error('Producto no encontrado')

  const totalSales = product.sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const dailyRate = totalSales / 30
  const daysUntilStockout = dailyRate > 0 
    ? Math.floor(product.currentStock / dailyRate) 
    : 999

  return {
    product: product.name,
    currentStock: product.currentStock,
    dailyBurnRate: dailyRate,
    daysUntilStockout,
    status: daysUntilStockout < 7 ? 'CRITICAL' : daysUntilStockout < 14 ? 'WARNING' : 'OK'
  }
}

export async function queryInventoryWithAI(userQuery: string) {
  // La IA traduce el lenguaje natural a lógica de negocio
  const systemPrompt = `Eres un asistente de inventario. Analiza la pregunta del usuario y genera una respuesta JSON con la acción a realizar.
  
  Tipos de acciones disponibles:
  - getLowStock: Productos con stock bajo
  - getStagnantProducts: Productos sin ventas
  - getTopProducts: Productos más vendidos
  - getProfitAnalysis: Análisis de rentabilidad
  - getSupplierComparison: Comparar proveedores
  
  Responde SOLO con JSON: { "action": "nombreAccion", "parameters": {} }`

  const response = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery }
    ],
    model: 'llama-3.1-8b-instant', // Modelo rápido para comandos
    temperature: 0.1,
    max_tokens: 150,
  })

  try {
    const aiResponse = JSON.parse(response.choices[0]?.message?.content || '{}')
    return aiResponse
  } catch {
    return { action: 'error', message: 'No pude entender la consulta' }
  }
}
