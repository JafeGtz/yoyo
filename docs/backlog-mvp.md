# Backlog — Sistema de Fidelización Digital

Backlog de producto derivado de [`analisis-y-requerimientos-v2.md`](./analisis-y-requerimientos-v2.md) y [`decisiones-tecnicas.md`](./decisiones-tecnicas.md).

## Convenciones

- **Épica** → agrupa funcionalidad. **Historia (HU)** → unidad entregable con criterios de aceptación.
- **Prioridad fase:** `F1` = MVP (mes 1-3), `F2` = Diferenciación (mes 4-6), `F3` = Red/monetización, `F4` = Ecosistema.
- **Plataforma:** `APP` (React Native cliente/personal), `WEB` (Next.js dueño), `BE` (backend/Supabase), `INFRA`.

## Stack y arquitectura de referencia

| Capa | Tecnología |
| --- | --- |
| App móvil (cliente + personal) | React Native + TypeScript |
| Panel web del dueño | Next.js + React + TypeScript + Tailwind |
| Backend / BD / Auth / Storage | Supabase (PostgreSQL, RLS, Edge Functions) |
| Hosting web | Vercel |
| Notificaciones push | Firebase Cloud Messaging (FCM) |
| Cobros | Stripe o Conekta (F2+) |

**Arquitectura aplicada en todas las épicas:**
- **MVVM** en la app (View → ViewModel → Model/Repository) y separación equivalente en la web (componentes → hooks/viewmodels → servicios).
- **Clean code / Clean architecture**: capas desacopladas (UI / dominio / datos), dependencias hacia adentro, repositorios como frontera a Supabase.
- **TypeScript estricto** en componentes, tipos compartidos del modelo de datos, sin `any`.
- **Multi-tenant** con Row Level Security (RLS) por `negocio_id` desde el día uno.

---

# Épica 0 — Fundaciones técnicas (INFRA / BE) · F1

Base sobre la que se construye todo. Debe ir primero.

| ID | Historia | Plataforma | Notas |
| --- | --- | --- | --- |
| F0-1 | ✅ Configurar proyecto Supabase: schema inicial, RLS multi-tenant por `negocio_id` | BE | Hecho — `supabase/migrations/`, validado en PG15 |
| F0-2 | ✅ Modelar todas las tablas (25) del modelo de datos con migraciones versionadas | BE | Hecho — ver `supabase/README.md` |
| F0-3 | Definir tipos TypeScript compartidos generados del schema (Supabase codegen) | BE/APP/WEB | `supabase gen types` → `src/core/types/database.types.ts` |
| F0-4 | Bootstrap app React Native: estructura MVVM, navegación, theming, capa de repositorios | APP | Sobre este repo `yoyo` |
| F0-5 | Bootstrap web Next.js + Tailwind, layout base, capa de servicios, deploy en Vercel | WEB | |
| F0-6 | Integrar Firebase Cloud Messaging (registro de tokens, capa de envío) | APP/BE | |
| F0-7 | Pipeline CI (lint, typecheck, tests), eslint/prettier estrictos | INFRA | |
| F0-8 | Capa de manejo de errores, logging estructurado y observabilidad (Sentry) | APP/WEB/BE | NFR 8.7 |

---

# Épica 1 — Identidad y acceso (Auth) · F1

Decisión ADR-02: registro **sin verificación SMS** por ahora.

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| AUTH-1 | Registro de cliente (celular + nombre + cumpleaños), sin verificación SMS | APP | Acepta aviso privacidad LFPDPPP |
| AUTH-2 | Login social cliente (Google / Apple) | APP | |
| AUTH-3 | Registro/login dueño (email+password o Google) | WEB | |
| AUTH-4 | Roles y permisos diferenciados (dueño, personal, admin) vía RLS + JWT | BE | NFR 8.1 |
| AUTH-5 | Alta de personal con permisos limitados (solo confirmar canjes) | WEB | Sección 5.13 |
| AUTH-6 | Login personal en app ligera | APP | |
| AUTH-7 | Cierre de sesión y eliminación de cuenta/datos (derechos ARCO) | APP | NFR 8.2 |
| AUTH-8 | Aviso de privacidad y consentimientos (notificaciones, geolocalización) | APP | |

---

# Épica 2 — QR y registro de visitas (mecánica central) · F1

Corazón del sistema. Modelo híbrido (sección 3.2).

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| QR-1 | Generación de QR del negocio firmado criptográficamente (JWT) | BE | Rotación 12-24h |
| QR-2 | Servicio de rotación temporal del token QR | BE | Edge Function programada |
| QR-3 | QR personalizado con logo, descargable/imprimible | WEB | Sección 5.1 |
| QR-4 | Escaneo del QR del negocio desde la app del cliente (cámara nativa) | APP | < 2s (NFR 8.3) |
| QR-5 | Validación backend del escaneo: firma + antifraude (1 visita/cliente/negocio/24h) | BE | Sección 3.2.1 |
| QR-6 | Geolocalización opcional configurable, validada en backend | APP/BE | Tratar como señal, no barrera |
| QR-7 | Modo respaldo: código numérico de 6 dígitos (registro manual) | APP | |
| QR-8 | Confirmación visual de visita + progreso actualizado | APP | "Visita #7. Te faltan 3…" |

---

# Épica 3 — Beneficios y canje · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| BEN-1 | CRUD de beneficios (8 tipos), condición de desbloqueo por visitas | WEB | Sección 3.3 |
| BEN-2 | Activar / pausar / archivar beneficio sin eliminar | WEB | |
| BEN-3 | Motor de desbloqueo: al registrar visita, evaluar y crear beneficio-desbloqueado | BE | Con vigencia |
| BEN-4 | Vista "Mis beneficios" con estado y countdown de vencimiento | APP | Sección 4.3.2 |
| BEN-5 | Generar código de canje temporal (QR único, válido por minutos) | APP | Un solo uso |
| BEN-6 | App personal: escanear código de canje, validar y marcar canjeado | APP | Registra empleado |
| BEN-7 | Modo respaldo de canje (código numérico tecleado por personal) | APP | |
| BEN-8 | Confirmación de canje a ambas partes + auditoría de empleado | APP/BE | Sección 5.13 |

---

# Épica 4 — Progreso y membresías · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| PRO-1 | Vista de progreso por negocio (visitas, nivel, próximos beneficios) | APP | Sección 4.3.1 |
| PRO-2 | Historial de visitas con fecha/hora | APP | |
| PRO-3 | Sistema de membresías: niveles configurables con nombre y visitas mínimas | WEB | Sección 5.5 |
| PRO-4 | Beneficios exclusivos por nivel + visualización de flujo entre niveles | WEB | |
| PRO-5 | Lista de negocios del cliente con estado actual | APP | Sección 4.11 |

---

# Épica 5 — Control de capacidad (protección del negocio) · F1

Reemplaza a la calculadora de impacto (ver ADR-05).

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| CAP-1 | Cupos por día/semana/mes por beneficio | WEB/BE | Sección 5.3 |
| CAP-2 | Horarios de canje (días/horas permitidas) | WEB/BE | |
| CAP-3 | Stock total por beneficio | WEB/BE | |
| CAP-4 | Pausa rápida del programa completo (modo emergencia) | WEB | |
| CAP-5 | Reflejo de estados de cupo/agotado/pausado en la app | APP | |

---

# Épica 6 — Onboarding y plantillas del negocio · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| ONB-1 | Asistente de alta de negocio (datos, logo, tipo) < 15 min | WEB | Sección 5.1 |
| ONB-2 | Selección de Modelo de acumulación (Básico en F1; Plus en F2) | WEB | |
| ONB-3 | Plantillas pre-validadas por industria (beneficios/niveles sugeridos) | WEB | Sección 5.4 |
| ONB-4 | Tour inicial de 3 pantallas en la app del cliente | APP | Sección 4.1 |

---

# Épica 7 — Notificaciones y recordatorios (FCM) · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| NOT-1 | Infraestructura de notificaciones push (FCM) + preferencias por tipo | APP/BE | |
| NOT-2 | Recordatorios de vencimiento (al desbloquear, 3d, 1d, mismo día, post) | BE | Tabla sección 4.4 |
| NOT-3 | Recordatorios de inactividad (7, 14, 30 días) | BE | |
| NOT-4 | Notificación de cumpleaños y de referido completado | BE | |
| NOT-5 | Job programado de evaluación y envío de recordatorios | BE | Edge Function cron |

---

# Épica 8 — Competencia básica y referidos · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| COM-1 | Cliente del mes + Top 5 por negocio | APP/BE | Versión básica (14.3) |
| COM-2 | Sistema básico de referidos (código único, ambos ganan) | APP/BE | Sección 4.7 |
| COM-3 | Historial de referidos y notificación al completar primera visita | APP | |
| COM-4 | Anti-manipulación de ranking (reglas anti-fraude reutilizando QR-5) | BE | Riesgo sección 13 |

---

# Épica 9 — Reseñas privadas (NPS) · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| REV-1 | Post-canje: pregunta de experiencia (1-5★ + comentario) | APP | Sección 4.8.1 |
| REV-2 | NPS (0-10) | APP | |
| REV-3 | Panel de reseñas privadas para el dueño + alerta por calificación baja | WEB | |
| REV-4 | Sugerir compartir en Google Reviews si calificación alta | APP | |

---

# Épica 10 — Dashboard y CRM del dueño · F1

| ID | Historia | Plataforma | Criterios clave |
| --- | --- | --- | --- |
| DSH-1 | Dashboard con métricas en tiempo real (visitas, activos, retorno) | WEB | Sección 5.8 |
| DSH-2 | Gráficas básicas (visitas por periodo, nuevos vs recurrentes, por nivel) | WEB | |
| DSH-3 | Alertas inteligentes de saturación ("45 clientes a 1-2 visitas de…") | WEB/BE | |
| DSH-4 | CRM: lista de clientes con buscador y filtros | WEB | Sección 5.7 |
| DSH-5 | Ficha de cliente (visitas, nivel, beneficios, historial, notas) | WEB | |
| DSH-6 | Edición manual de visitas con auditoría + bloqueo de clientes | WEB | |
| DSH-7 | Menú/catálogo del negocio (CRUD) visible en la app | WEB/APP | Sección 5.11 |

---

# Fases posteriores (resumen)

Se detallarán cuando se cierre el MVP.

## F2 — Diferenciación (mes 4-6)
- **Modelo Plus** (visitas + monto) en planes superiores.
- Gamificación completa: ruleta, rasca y gana, rifas, logros expandidos.
- Competencia robusta: rankings globales, retos, puntos globales, niveles de Embajador, temporadas.
- Referidos escalonados y top referidores.
- Agenda de citas; campañas manuales segmentadas.
- Analíticas avanzadas y exportación; cross-promotion básico.
- Cobros automatizados de suscripción (Stripe/Conekta).

## F3 — Red y monetización (mes 7-12)
- Plataforma publicitaria completa.
- **Reseñas públicas curadas por el dueño** (ADR-03).
- Multi-sucursal; WhatsApp Business; descubrimiento de negocios.
- Panel administrativo interno (gestión global, métricas MRR/churn/LTV, moderación).

## F4 — Ecosistema (mes 12+)
- Feed social ligero, perfiles públicos, compartir logros, APIs públicas.

---

# Notas de implementación transversales

- **Seguridad (NFR 8.1):** TLS, JWT + refresh, RLS, rate limiting en endpoints sensibles, auditoría de acciones críticas. Aplica como criterio de aceptación en toda épica con BE.
- **Privacidad (NFR 8.2):** datos no se comparten entre negocios; consentimiento explícito; ARCO. Validar especialmente en Auth y CRM.
- **Rendimiento (NFR 8.3):** escaneo < 2s, dashboard < 3s.
- **Definition of Done** por historia: tipos TS sin `any`, capas MVVM/clean respetadas, RLS verificada, tests de la lógica de dominio, sin secretos en cliente.
