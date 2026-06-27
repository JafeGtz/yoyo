# Decisiones Técnicas (ADR)

Registro de decisiones de arquitectura del Sistema de Fidelización Digital.
Complementa a [`analisis-y-requerimientos-v2.md`](./analisis-y-requerimientos-v2.md).

Cada decisión: contexto → opciones → recomendación → consecuencias.

---

## Resumen de decisiones

| # | Decisión | Resolución | Estado |
| --- | --- | --- | --- |
| ADR-01 | App nativa vs PWA | App nativa (React Native) desde el día uno | ✅ Tomada |
| ADR-02 | Verificación por SMS | Registro sin verificar por ahora | ✅ Tomada |
| ADR-03 | Reseñas públicas | Curadas: solo las que el dueño elige mostrar | ✅ Tomada |
| ADR-04 | Hosting e infraestructura | Vercel + Supabase. Gratis para piloto, Pro al monetizar | ✅ Tomada |
| ADR-05 | Calculadora de impacto | Se elimina del alcance. Ambigua e inexacta, puede confundir al dueño | ✅ Tomada |
| — | Retención de datos al cancelar | Por definir | ⏳ Pendiente |
| — | Propiedad de la base de clientes | Por definir | ⏳ Pendiente |
| — | Revenue-sharing en cross-promotion | Por definir | ⏳ Pendiente |

---

## ADR-01 — App nativa (React Native) desde el día uno

**Contexto.** La app del cliente necesita cámara para escanear QR, notificaciones push y buena fluidez. La alternativa era arrancar con una PWA para reducir fricción de descarga.

**Decisión.** App **nativa** con React Native desde el inicio (este repo, `yoyo`).

**Consecuencias.**
- Acceso pleno a cámara, push (FCM) y APIs nativas de geolocalización.
- Distribución vía App Store / Play Store (no se hostea; se compila).
- Costo de fricción de descarga asumido; se mitiga con onboarding asistido en el local.

---

## ADR-02 — Registro sin verificación por SMS (por ahora)

**Contexto.** La verificación por SMS añade fricción y costo (Twilio/LabsMobile) en el momento más sensible: el primer registro.

**Decisión.** Registro **sin verificar** al inicio. Se evaluará activar SMS más adelante si aparece abuso.

**Consecuencias.**
- Onboarding más rápido, sin costo de SMS en el piloto.
- Riesgo de cuentas duplicadas/falsas → se controla con las reglas anti-fraude existentes (1 visita por cliente/negocio cada 24 h, QR firmado).
- El diseño de datos debe permitir agregar verificación después sin migración dolorosa.

---

## ADR-03 — Reseñas públicas curadas por el dueño

**Contexto.** En el MVP las reseñas son privadas (solo dueño) + NPS. Al activar reseñas públicas (fase 3) existe el riesgo de reseñas dañinas.

**Decisión.** Cuando se activen, las reseñas públicas serán **curadas**: solo se publican las que el dueño aprueba explícitamente.

**Consecuencias.**
- Protege al negocio de reseñas negativas no gestionadas.
- Sesga la percepción pública (solo se ven positivas) → aceptable en esta etapa.
- El modelo de datos de `Reseña` ya contempla el flag `pública/privada`; basta añadir un estado de aprobación del dueño.

---

## ADR-04 — Hosting e infraestructura: Vercel + Supabase

**Contexto.** "El SaaS" no es una sola pieza. Hay que ubicar cada componente y validar si el plan gratuito alcanza para el piloto (5-10 negocios).

**Decisión.** Stack **Vercel + Supabase** (el recomendado en la sección 10 del doc de requerimientos). Plan **gratuito durante el piloto**, migrar a **Pro antes de cobrar** a negocios reales.

### Dónde vive cada pieza

| Pieza | ¿Vercel? | Dónde va |
| --- | --- | --- |
| Panel web del dueño (Next.js) | ✅ Sí | Vercel |
| App móvil nativa (`yoyo`, React Native) | ❌ No | App Store / Play Store (se compila) |
| Backend / API + Base de datos + Auth + Storage | ❌ No | Supabase |

**Punto clave:** Vercel corre funciones serverless efímeras (frontend Next.js), **no es servidor con estado ni base de datos**. PostgreSQL, Auth, Storage y la lógica de QR rotativo/anti-fraude viven en **Supabase**.

### Límites del plan gratuito

**Vercel (Hobby/gratis):**
- Es **solo para uso no comercial**. Un SaaS que cobra suscripciones requiere **plan Pro** (~$20/usuario/mes) según sus términos. Para *probar* sin cobrar, el gratis funciona; al monetizar, hay que pasar a Pro.
- 100 GB de ancho de banda/mes — suficiente para un piloto.

**Supabase (gratis):**
- 500 MB de base de datos, 1 GB de storage, 50,000 usuarios activos/mes.
- **Límite real:** el proyecto se **pausa tras 7 días de inactividad**; solo 2 proyectos gratis.

### Recomendación por etapa

- **Piloto / prueba (ahora):** Vercel Hobby + Supabase Free. **Viable y gratis.**
- **Antes de cobrar a negocios reales:** Vercel Pro + Supabase Pro (~$45/mes combinados) — por los términos de licencia de Vercel y para evitar el auto-pausado de Supabase.

**Consecuencias.**
- Costo cero para validar el MVP con los negocios piloto.
- La app móvil no depende de Vercel; su límite real es el ciclo de publicación en las tiendas.
- Punto de decisión claro de cuándo subir a planes Pro (al iniciar cobro o superar límites de Supabase).

---

## ADR-05 — Se elimina la Calculadora de impacto

**Contexto.** El doc original (sección 5.2) la marcaba como requerimiento crítico: proyectar canjes esperados y costo antes de publicar un beneficio.

**Decisión.** **Se elimina del alcance.** La proyección depende de predecir comportamiento humano futuro (frecuencia de visita, tasa de canje, estacionalidad) y nunca es exacta; mostrar un número puntual da una falsa sensación de precisión y **puede confundir o engañar al dueño**.

**Mitigación del riesgo que cubría** (configurar beneficios irrealistas):
- Plantillas pre-validadas por industria (5.4).
- Límites de cupo / stock / horarios (control de capacidad, 5.3).
- Alertas tempranas de saturación en el dashboard (5.8).

**Consecuencias.**
- Se simplifica el onboarding del beneficio (un paso menos).
- La protección del negocio se apoya en límites duros y plantillas, no en una predicción difusa.
- Si en el futuro se quiere reintroducir, debería ser como **rango histórico real** ("negocios similares dieron ~X canjes"), no como predicción.

---

## Pendientes (sin resolver)

- **Retención de datos si un negocio cancela su suscripción.**
- **Propiedad de la base de clientes** (¿el dueño puede exportarla?).
- **Revenue-sharing en cross-promotion** entre negocios de la red.
