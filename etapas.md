# Etapas de desarrollo — Ztocky

> Progreso del proyecto, fase por fase.
> Cada ítem tiene un checkbox `[ ]` (pendiente) o `[x]` (completado).
> Los ítems sin checkbox son notas o definiciones de alcance.

---

## Fase 1 — Subir listas (MVP)

**Objetivo:** El proveedor sube un CSV/Excel con precios, el sistema matchea automáticamente por SKU, muestra diff y el store acepta o rechaza los cambios.

### Estado actual — MVP funcional ✅

- [x] CRUD completo de productos (crear, editar, eliminar, buscar)
- [x] CRUD completo de proveedores
- [x] Catálogo de proveedores (catalog_items) con precio + cantidad mínima por producto
- [x] Importación de precios desde CSV con flujo de previsualización y confirmación
- [x] Búsqueda de producto por SKU (para el escáner y matching)
- [x] Exportación de productos a CSV
- [x] Dashboard con KPIs, tabla de agotamientos y acciones recomendadas
- [x] Motor de burn rate y reorder-check
- [x] Alertas automáticas (LOW_STOCK, CRITICAL_STOCK, STAGNANT_STOCK)
- [x] Stock transaccional (ventas descuentan, editar ajusta, eliminar restaura, orden recibida incrementa)
- [x] Órdenes de compra con ciclo completo de estados (DRAFT → SENT → CONFIRMED → SHIPPED → RECEIVED)
- [x] Multi-tenant con workspaces y roles (OWNER/ADMIN/MEMBER)
- [x] Autenticación propia (scrypt + cookies 30 días)
- [x] Auth0 Google OAuth listo
- [x] Seed realista (10 productos, 3 proveedores, 90 días de ventas)
- [x] Simulador de escenarios de demanda
- [x] Búsqueda global multi-entidad
- [x] Escáner de código de barras (cámara + manual)
- [x] Panel de administración (usuarios, sesiones, workspaces)
- [x] Importación CSV de ventas y proveedores
- [ ] **Diff visual en importación de catálogo** — mostrar claramente qué precios cambiaron, qué productos son nuevos y qué quedó sin cambios (actualmente solo muestra preview plana)
- [ ] **Importación desde Excel (.xlsx)** — hoy solo soporta CSV
- [ ] **Notificaciones al proveedor** cuando el store rechaza o acepta sus precios
- [ ] **Historial de cambios** de precios en el catálogo (traceability)

---

## Fase 1.5 — Feedback de usuarios & IA explicativa

**Objetivo:** Dar herramientas al comercio para comunicarse con el admin, y hacer que la IA sea comprensible para cualquier usuario sin experiencia técnica.

### Feedback del comercio → Admin

- [ ] **Sistema de quejas y sugerencias** — formulario simple en el dashboard donde el usuario puede reportar problemas o pedir features
- [ ] **Panel admin de feedback** — listado de todos los mensajes con estado (nuevo / en revisión / resuelto / cerrado)
- [ ] **Categorías de feedback**: error / sugerencia / duda / solicitud de actualización / otro
- [ ] **Notificaciones al admin** cuando llega un feedback nuevo (email y/o in-app)
- [ ] **Respuesta del admin** al comercio desde el panel
- [ ] **Historial completo** de la conversación por ticket

### IA explicativa y accesible

- [ ] **Tooltips informativos** en todo el dashboard explicando KPIs, métricas y acciones en lenguaje simple ("¿Qué significa esto?")
- [ ] **Onboarding interactivo** para nuevos usuarios (tour guiado por el dashboard al primer login)
- [ ] **Consultas guiadas en la Consola IA** — botones predefinidos para preguntas comunes, el usuario no necesita saber qué preguntar
- [ ] **Mejora del prompt de sistema** de Groq para respuestas más claras, con ejemplos y unidades en contexto
- [ ] **Glosario de términos** accesible desde cualquier página (stock crítico, burn rate, lead time, etc.)
- [ ] **Vista "explicación simplificada"** en el simulador y en las alertas (ocultar números complejos, mostrar emojis/colores y texto claro)
- [ ] **Modo "no técnico"** toggle en la Consola IA que da respuestas más coloquiales y menos tabulares

### POS — Sistema de ventas en linea

> Convertir Ztocky en el sistema de caja (Point of Sale) del comercio, no solo en el gestor de stock. Esto elimina la carga manual de ventas y da datos en tiempo real.

- [ ] **Interfaz tipo caja registradora** en `/dashboard/pos` con layout tactile para pantalla táctil
- [ ] **Carrito de compras** con agregar/scanner de productos, modificar cantidades y eliminar items
- [ ] **Cobro múltiple**: efectivo, tarjeta, transferencia, cuenta corriente (registra el método de pago)
- [ ] **Ticket / comprobante** — vista previa del ticket antes de finalizar e impresión (PDF térmico 80mm)
- [ ] **Apertura y cierre de caja** — control de efectivo inicial/final, diferencia del día
- [ ] **Cliente frecuente** vinculado a la venta (sin obligación de registrar cliente)
- [ ] **Descuentos por item y por total** con porcentaje o monto fijo
- [ ] **Devolución** — seleccionar una venta y devolver items (restaura stock y anula el ingreso)
- [ ] **Historial de ventas del día** en vivo con total acumulado
- [ ] **Cobro parcial / seña** — registrar anticipos y saldar después
- [ ] **Modo offline** — vender sin internet y sincronizar cuando vuelva la conexión (critical para ferias/mercados)
- [ ] **Base de clientes** con historial de compras, deuda y datos de contacto
- [ ] **Múltiples puntos de venta** — una misma cuenta puede tener varias cajas abiertas simultáneamente

### Mejoras de UX/UI generales

- [ ] **Página de ayuda / FAQ** dentro de la app
- [ ] **Mensajes de error amigables** en formularios (sin códigos técnicos)
- [ ] **Estado vacío** ilustrado en todas las secciones (cuando no hay datos, mostrar qué hacer)
- [ ] **Confirmaciones con undo** en acciones destructivas (eliminar producto, etc.)
- [ ] **Atajos de teclado** para acciones frecuentes

---

## Fase 2 — Link de precios (2-3 semanas)

**Objetivo:** El store genera un link público para su proveedor. El proveedor abre el link, ve los productos que ya compra la tienda, ingresa precio + cantidad mínima. Sin registro, sin cuenta, sin app. Barrera bajísima para el proveedor.

- [ ] **Generación de link único** por proveedor desde el dashboard del store
- [ ] **Página pública** protegida por token (no requiere autenticación)
- [ ] Vista de productos del store para ese proveedor (solo los que ya compra)
- [ ] Formulario para ingresar precio unitario + cantidad mínima por producto
- [ ] Envío del formulario → se crean/actualizan catalog_items automáticamente
- [ ] **Confirmación visual** al proveedor de que sus precios se cargaron
- [ ] **Notificación al store** cuando el proveedor actualiza precios vía link
- [ ] **Caducidad del link** (configurable: 7 días, 30 días, sin expiración)
- [ ] **Regenerar link** si expira o se quiere invalidar el anterior
- [ ] **Diseño mobile-first** para que el proveedor pueda usarlo desde el celular
- [ ] **Opción multi-idioma** (español + portugués como mínimo para expandir a proveedores de la región)
- [ ] **Validación del lado del servidor** (precios positivos, cantidades enteras)
- [ ] **Protección contra spam** (rate-limiting por token, captcha opcional)

### UX del link público

- [ ] La página muestra el nombre del store y un mensaje de bienvenida
- [ ] Los productos aparecen en una tabla limpia con SKU, nombre, precio anterior (si existe) y campo para nuevo precio
- [ ] El proveedor puede guardar como borrador y volver después
- [ ] Barra de progreso mostrando cuántos productos faltan completar
- [ ] Confirmación por email opcional al proveedor (si ingresa su email voluntariamente)

---

## Fase 3 — Precios por WhatsApp (3-4 semanas)

**Objetivo:** El proveedor manda "Actualización de precios" al WhatsApp del negocio. Un bot (Twilio / WhatsApp API) parsea el mensaje y actualiza automáticamente.

- [ ] **Integración con WhatsApp Business API** (Twilio / Meta WABA)
- [ ] **Número de WhatsApp dedicado** para recibir actualizaciones
- [ ] **Parser de mensajes** que identifica el formato:
  - [ ] Texto plano con SKU + precio
  - [ ] Foto de lista de precios (OCR con IA)
  - [ ] PDF adjunto con tabla de precios (extracción con IA)
- [ ] **Matching automático** por SKU o por nombre si no hay SKU
- [ ] **Confirmación al proveedor** vía WhatsApp: "Recibimos X productos, Y se actualizaron, Z no se encontraron"
- [ ] **Notificación al store** de que hubo una actualización vía WhatsApp
- [ ] **Panel de revisión** en el dashboard para que el store acepte/rechace cambios antes de aplicar
- [ ] **Historial de mensajes** de WhatsApp asociados al proveedor
- [ ] **Manejo de errores**: formato no reconocido → responder pidiendo que reenvíe en formato válido
- [ ] **Soporte para múltiples proveedores** en un mismo número (identificación por teléfono)
- [ ] **Registro del proveedor** en el sistema al recibir su primer mensaje (creación automática)

### OCR / Extracción con IA

- [ ] Integración con servicio de OCR (Google Vision, Tesseract, etc.) para fotos de listas
- [ ] Limpieza y estructuración del texto extraído
- [ ] Fallback manual si la IA no puede interpretar la imagen
- [ ] Pipeline de extracción de PDFs (pdf.parse, tabulas, o solución similar)

---

## Fase 4 — Red de proveedores (el moonshot)

**Objetivo:** Los proveedores tienen su propio perfil en Ztocky. Publican su catálogo completo con precios. Las tiendas se "suscriben" a proveedores. Cuando el proveedor actualiza un precio, **todas las tiendas** lo ven al instante. **Marketplace inverso** — el proveedor mantiene sus precios, la tienda decide de quién comprar.

### Perfil de proveedor

- [ ] **Registro de proveedor** como usuario en Ztocky (con rol PROVEEDOR)
- [ ] **Perfil público** del proveedor: nombre, contacto, categorías, rating
- [ ] **Dashboard de proveedor** con estadísticas de sus productos y qué tiendas los compran
- [ ] **Catálogo completo** que el proveedor gestiona desde su perfil
- [ ] **Carga masiva** de productos al catálogo (CSV/Excel/subida manual)

### Suscripción de tiendas

- [ ] Las tiendas buscan y descubren proveedores (directorio / buscador)
- [ ] **Suscripción** a un proveedor → el catálogo del proveedor aparece en la tienda automáticamente
- [ ] **Catálogo vivo**: cuando el proveedor actualiza un precio, todas las tiendas suscritas ven el cambio al instante
- [ ] **Notificación** a las tiendas cuando hay cambios de precio en proveedores a los que están suscritas
- [ ] **Comparador de proveedores** por producto (mismo producto, distintos precios según proveedor)
- [ ] **Historial de precios** por proveedor para ver tendencias

### Marketplace inverso

- [ ] **Motor de recomendación** de proveedores basado en productos que la tienda ya compra
- [ ] **Solicitud de cotización**: la tienda pide precio a múltiples proveedores desde un solo lugar
- [ ] **Sistema de rating y reseñas** de proveedores por parte de las tiendas
- [ ] **Módulo de contratos** (condiciones comerciales, plazos de pago, etc.)
- [ ] **Feed de novedades** de proveedores (nuevos productos, promociones, cambios de precio)
- [ ] **Búsqueda inversa**: dada una categoría, mostrar todos los proveedores que venden ese tipo de producto

### Gobernanza y seguridad

- [ ] **Verificación de proveedor** (documentación, identidad) supervisada por admin
- [ ] **Límites de catálogo** según plan del proveedor
- [ ] **Reportes** de actividad para ambas partes (tienda y proveedor)
- [ ] **API pública** para que proveedores puedan integrar su sistema con Ztocky

---

## Hito técnico transversal

> Estas tareas no pertenecen a una fase específica pero son necesarias para la madurez del producto.

- [ ] Tests automatizados (unitarios + integración)
- [ ] CI/CD pipeline
- [ ] Monitoreo y logging (Sentry, etc.)
- [ ] Auditoría de seguridad
- [ ] Optimización de performance (caching, queries N+1)
- [ ] Documentación de API actualizada
- [ ] Modo offline / PWA para mobile
- [ ] Infraestructura multi-región
- [ ] Migración a cola de tareas (procesamiento async de imports pesados)
