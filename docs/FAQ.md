# FAQ — Preguntas Frecuentes

> Respuestas a las dudas más comunes sobre Ztocky: arquitectura, decisiones técnicas, escalabilidad y modelo de negocio.

---

## Arquitectura y Tecnología

### ¿Por qué un solo proyecto Next.js y no frontend + backend separados?

Porque Ztocky es un **sistema de gestión**, no una API pública con millones de requests. Next.js nos da backend (API routes) y frontend (React) en el mismo proyecto, lo que elimina:

- Duplicación de tipos TypeScript entre frontend y backend
- Tener que mantener dos repos, dos deploys, dos dominios
- Sincronizar validaciones lado cliente y lado servidor
- Lógica de autenticación duplicada

Los **Server Components** de Next.js nos permiten renderizar dashboards con cálculos pesados (burn rate, proyecciones) del lado del servidor, mandando HTML al cliente sin exponer lógica de negocio ni hacer múltiples llamadas API.

> **¿Cuándo separar?** Cuando necesitemos escalar API y frontend por separado, o agreguemos servicios asíncronos pesados (bots, workers de OCR). Ahí los ponemos aparte como microservicios, compartiendo los mismos tipos de Prisma desde un paquete común.

### ¿Esto escala para todo un país?

**Sí.** Next.js con Neon (PostgreSQL serverless) maneja escalado horizontal sin que toques infraestructura. Los cuellos de botella de Ztocky no están en el framework:

- La DB escala con Neon (auto-scaling serverless)
- Las queries pesadas se optimizan con índices (ya existen en `schema.prisma`)
- Si hace falta, se agrega caché con Redis y CDN para activos estáticos

Para un país con miles de comercios, el monolito Next.js sobra. Si llegás a millones, separás por módulos.

### ¿Por qué no usaste NextAuth.js?

Porque Ztocky necesitaba **multi-tenant con workspaces y roles personalizados** (OWNER/ADMIN/MEMBER por workspace, más USER/SUPER_ADMIN global). NextAuth.js está pensado para autenticación simple contra proveedores OAuth.

Preferimos una **solución propia con scrypt + cookies HTTP-only de 30 días** que nos da control total sobre:
- Sesiones multi-tenant
- Roles por workspace y globales
- Integración con Auth0 como alternativa (Google OAuth)

La autenticación propia no es más insegura si está bien implementada: passwords con salt scrypt, tokens con hash en DB, cookies Secure/HttpOnly/SameSite.

### ¿Por qué PostgreSQL y no MongoDB u otra?

Ztocky maneja **datos transaccionales** (stock, ventas, órdenes de compra). PostgreSQL nos da:

- **Transacciones ACID**: cuando se registra una venta, el stock se descuenta en la misma transacción. Si algo falla, todo se revierte.
- **Integridad referencial**: no podés tener una venta sin producto, ni una orden sin proveedor.
- **Joins eficientes**: el motor de reorden cruza ventas + productos + proveedores en una query.
- **Neon**: PostgreSQL serverless que escala a cero cuando no se usa y escala automáticamente bajo demanda.

NoSQL (MongoDB, Firestore) no ofrece consistencia transaccional fuerte sin capas extras de complejidad. Para un sistema que maneja stock de comercios reales, la consistencia no es negociable.

### ¿Y la IA con Groq?

La consola IA permite hacer consultas en lenguaje natural contra los datos del negocio. Usamos **Groq** porque ofrece inferencia ultrarrápida con Llama 3.3 70B, ideal para respuestas en tiempo real.

El flujo actual envía contexto del dashboard (productos, ventas, stock) al LLM para que responda con datos reales. El prompt está optimizado para español argentino y dominio de inventario.

A futuro, evolucionará a una arquitectura RAG o texto-a-SQL para consultas más complejas sin saturar el contexto del modelo.

---

## Modelo de Datos

### ¿Cómo funciona el multi-tenant?

Ztocky tiene dos niveles de organización:

| Nivel | Rol | Ámbito |
|---|---|---|
| **Global** | USER / SUPER_ADMIN | Toda la plataforma |
| **Por workspace** | OWNER / ADMIN / MEMBER | Un comercio específico |

Un usuario puede pertenecer a múltiples workspaces con distintos roles. Todos los datos (productos, ventas, proveedores, órdenes, alertas) están scoped al `workspace_id`. Un SUPER_ADMIN puede ver métricas globales pero no modificar datos de comercios.

### ¿Cómo funciona el stock transaccional?

Cada operación que afecta stock se ejecuta en una **transacción atómica de Prisma**:

| Operación | Efecto en stock |
|---|---|
| Crear venta | `currentStock -= quantity` |
| Editar venta (sube cantidad) | `currentStock -= diferencia` |
| Editar venta (baja cantidad) | `currentStock += diferencia` |
| Eliminar venta | `currentStock += quantity` |
| Orden recibida (RECEIVED) | `currentStock += quantity` |
| Sacar orden de RECEIVED | `currentStock -= quantity` |

Esto garantiza que el stock nunca quede inconsistente, incluso si dos usuarios operan al mismo tiempo.

### ¿Qué tipos de alertas genera el sistema?

| Tipo | Condición |
|---|---|
| `CRITICAL_STOCK` | stock < 5 unidades |
| `LOW_STOCK` | stock < mínimo sugerido (`min_stock`) |
| `STAGNANT_STOCK` | sin ventas en > 30 días |
| `PRICE_CHANGE` | cambio significativo en precio de catálogo |
| `SUPPLIER_RISK` | lead time + riesgo combinado |

Las alertas tienen deduplicación de 24h: no se genera la misma alerta para el mismo producto dos veces en 24 horas.

---

## Escalabilidad y Futuro

### ¿Cuándo debería separar frontend y backend?

Cuando al menos dos de estas condiciones se cumplan:

1. **La API necesita escalar independientemente** del frontend (ej: 10k req/s de API, 1k de frontend)
2. **Equipos grandes** necesitan deployar independiente (frontend y backend con ciclos distintos)
3. **Workers pesados** (procesamiento de imágenes, OCR, colas de trabajo) compiten por recursos con la app web
4. **Múltiples canales** (web, mobile app, API pública) con necesidades distintas

Hasta entonces, el monolito Next.js es más productivo y simple de operar.

### ¿Cómo se integrarán los bots y servicios externos?

En un **monorepo** con estructura tipo:

```
ztocky/
  apps/
    web/              ← Next.js (app principal)
    whatsapp-bot/     ← Servicio Node que escucha webhooks de Twilio
    price-importer/   ← Worker de procesamiento CSV/OCR
  packages/
    database/         ← Schema Prisma + tipos compartidos
    shared/           ← Utilidades, constantes, validaciones
```

Cada servicio comparte los tipos de Prisma desde `packages/database` y se deploya independientemente. La app principal se comunica con ellos vía webhooks, colas (RabbitMQ / Redis) o API interna.

### ¿Y la migración a Supabase?

Ya está documentada en [`docs/SUPABASE.md`](./SUPABASE.md). Como Ztocky usa PostgreSQL puro, migrar a Supabase es cambiar la connection string. No hay dependencias de Neon que lockeen. Supabase suma Storage, Realtime y Auth que podrían servir a futuro.

---

## Producto y Negocio

### ¿Para qué tipo de negocio sirve Ztocky?

Ztocky está pensado para **pequeños y medianos comercios** que manejan stock físicamente:

- Almacenes, dietéticas, supermercados de barrio
- Ferreterías, corralones
- Indumentaria, calzado
- Farmacias
- Cualquier negocio con +50 productos y múltiples proveedores

### ¿Qué lo diferencia de un Excel o un sistema tradicional?

Un Excel te dice "te quedan 5 unidades". Ztocky te dice:

> "Al ritmo actual, te quedarás sin stock el martes. El proveedor tarda 3 días. Deberías generar la orden hoy."

Además:
- Conecta automáticamente los precios de tus proveedores
- Proyecta escenarios de demanda
- Te alerta antes de que sea urgente
- Te deja consultar todo en lenguaje natural

### ¿El comercio necesita saber de tecnología?

**No.** La interfaz está diseñada para usuarios sin experiencia técnica:
- La consola IA permite preguntar en lenguaje natural
- El dashboard muestra indicadores claros con códigos de colores
- La importación de precios es subir un CSV y confirmar
- El escáner de barras funciona con la cámara del celular

### ¿Ztocky es solo un proyecto o está en producción?

Ztocky está en **desarrollo activo** con un MVP funcional completo. El roadmap está documentado en [`etapas.md`](../etapas.md). Las decisiones técnicas (Next.js, PostgreSQL, Groq, arquitectura monolítica) están tomadas pensando en producción real, no en un proyecto académico.

### ¿Cómo se financia? ¿Es open source?

Actualmente es un proyecto en fase de desarrollo. Las decisiones de monetización (suscripciones por workspace, plan gratuito limitado, etc.) se definirán en etapas posteriores.

---

## Dudas Técnicas Comunes

### ¿Se puede usar con MySQL?

El ORM es Prisma, que soporta PostgreSQL, MySQL, SQLite, SQL Server y MongoDB. Migrar a MySQL sería cambiar el `provider` en `schema.prisma` y ajustar tipos de datos (`DateTime` con `@db.Date`). No está en los planes inmediatos.

### ¿Hay tests automatizados?

Todavía no, pero está en el roadmap (ver [`etapas.md`](../etapas.md) — Hito técnico transversal). La prioridad fue validar el producto con usuarios reales primero.

### ¿Soporta múltiples monedas?

Hoy trabaja con una moneda por workspace (peso argentino por defecto). El modelo de datos usa `Decimal` que permite agregar moneda y tipo de cambio sin romper compatibilidad.

### ¿Los datos son del usuario o de Ztocky?

**Del usuario.** Cada workspace es dueño de sus datos. El SUPER_ADMIN solo ve métricas agregadas, no puede acceder a productos, ventas ni proveedores de un comercio específico.

### ¿Hay API pública para integraciones?

Las rutas `/api/dashboard/*` son privadas (requieren sesión). Una API pública con tokens de acceso está considerada para fases futuras (Fase 4 — Red de proveedores).
