# Usar Supabase En Lugar De Neon

Ztocky ya funciona con PostgreSQL, así que Supabase puede reemplazar a Neon sin cambiar el modelo de datos.

## 1. Crear El Proyecto

1. Crear un proyecto en Supabase.
2. Ir a `Project Settings > Database`.
3. Copiar las connection strings.

## 2. Variables De Entorno

En `.env`, reemplazar la conexión Neon por Supabase:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

Notas:

- `DATABASE_URL` debería usar el pooler para la app.
- `DIRECT_URL` sirve para migraciones si querés separar conexión directa.
- En este proyecto hoy `prisma.config.ts` usa `DATABASE_URL` para migrar. Si querés usar `DIRECT_URL` para migraciones, hay que ajustar la config.

## 3. Prisma

Después de cambiar `.env`:

```bash
npx prisma generate
npx prisma migrate deploy
```

Para cargar datos base:

```bash
npm run seed
```

## 4. Auth

La auth actual de Ztocky es propia:

- `users`
- `sessions`
- `workspaces`
- `workspace_members`

No depende de Supabase Auth. Si más adelante querés usar Supabase Auth, habría que adaptar `lib/auth.ts` y decidir cómo mapear usuarios externos contra `workspaces`.

## 5. Storage Y Realtime

Supabase puede sumar valor más adelante para:

- logos o archivos de proveedores en Storage
- eventos realtime para alertas de stock
- auditoría con triggers SQL

Para la etapa actual, solo hace falta PostgreSQL.
