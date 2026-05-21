import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

export async function askGroq(prompt: string, systemPrompt?: string) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'Eres un asistente experto en gestión de inventario y cadena de suministro.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.3, // Más preciso para análisis
      max_tokens: 1024,
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Error en Groq:', error)
    throw error
  }
}

export default groq