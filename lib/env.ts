const requiredEnvs = [
  'DATABASE_URL',
  'GROQ_API_KEY',
] as const
export function validateEnv(): boolean {
  const missing = requiredEnvs.filter(env => !process.env[env])

  if (missing.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`)
    return false
  }

  console.log('✅ Todas las variables de entorno configuradas')
  return true
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ztocky',
} as const
