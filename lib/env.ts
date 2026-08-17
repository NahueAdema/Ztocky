const requiredEnvs = [
  'DATABASE_URL',
  'GROQ_API_KEY',
] as const

const auth0Envs = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
] as const

export function validateEnv(): boolean {
  const missing = requiredEnvs.filter(env => !process.env[env])

  if (missing.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`)
    return false
  }

  const auth0Missing = auth0Envs.filter(env => !process.env[env])
  if (auth0Missing.length > 0 && auth0Missing.length < auth0Envs.length) {
    console.warn(`⚠️ Auth0 configurado parcialmente: faltan ${auth0Missing.join(', ')}`)
  }

  if (auth0Missing.length === 0) {
    console.log('✅ Auth0 configurado')
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
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_EMAIL: process.env.VAPID_EMAIL || 'notificaciones@ztocky.app',
} as const
