const requiredEnvs = [
  'DATABASE_URL',
  'GROQ_API_KEY',
  'RESEND_API_KEY',
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
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'ztocky@example.com',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ztocky',
} as const
