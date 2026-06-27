# Contrato de Backend

Mapa de **todas** las operaciones que la app (cliente/personal) y la web
(dueño/admin) usan del backend, y **por qué mecanismo** van.

## Los 3 mecanismos

| Mecanismo | Cuándo se usa | Seguridad |
| --- | --- | --- |
| **Directo (RLS)** | CRUD normal: leer/escribir filas que pertenecen al usuario o a su negocio. Es la **mayoría** de las operaciones. | Row Level Security (ya implementado). El cliente de Supabase pega directo a PostgREST. |
| **Edge Function** | Lógica sensible multi-paso que el cliente NO debe poder falsear (antifraude, firma de QR, validación de canje). | Corre con `service_role` en el servidor. Identifica al usuario por su JWT. |
| **RPC (función SQL)** | Agregaciones/consultas pesadas (rankings, métricas del dashboard). | Función Postgres `security definer`, expuesta vía RPC. |

> Regla mental: **si es "guardar/leer mis cosas" → directo con RLS. Si es
> "una operación que da dinero o se puede hacer trampa" → Edge Function.
> Si es "un número resumido de muchos registros" → RPC.**

---

## App del CLIENTE

| Interfaz / acción | Mecanismo | Detalle |
| --- | --- | --- |
| Registro / login | **Auth** | `supabase.auth` (sin verificación SMS — ADR-02) |
| Crear/editar perfil | Directo | insert/update `cliente` |
| Mis negocios + progreso | Directo | select `cliente_negocio` + `negocio` |
| Detalle de negocio + catálogo | Directo | select `negocio`, `catalogo_categoria/item` |
| Historial de visitas | Directo | select `visita` |
| Mis beneficios | Directo | select `beneficio_desbloqueado` |
| **Escanear QR / registrar visita** | **Edge** | `registrar-visita` (firma + antifraude 24h + geocerca + desbloqueo) |
| **Generar código de canje** | **Edge** | `generar-codigo-canje` (token temporal firmado) |
| Reseña post-canje (estrellas + NPS) | Directo | insert `resena` |
| Ranking / cliente del mes | **RPC** | `ranking_negocio(negocio_id)` *(pendiente)* |
| Insignias / logros | Directo | select `insignia_obtenida` + `logro` |
| Referidos | Directo + Edge | select `referido`; la completación ocurre dentro de `registrar-visita` |
| Notificaciones | Directo | select/update `notificacion` |
| Registrar token push | Directo | upsert `dispositivo_push` |
| Descubrimiento (mapa) | Directo | select `negocio` (estado activo) |

## App del PERSONAL

| Interfaz / acción | Mecanismo | Detalle |
| --- | --- | --- |
| Login | **Auth** | |
| **Escanear código de canje** | **Edge** | `canjear-beneficio` (valida token + marca canjeado + auditoría) |

## Web del DUEÑO

| Interfaz / acción | Mecanismo | Detalle |
| --- | --- | --- |
| Onboarding del negocio | Directo | insert `negocio` + `usuario_negocio` (RLS dueño fundador) |
| CRUD de beneficios | Directo | `beneficio` |
| Niveles de membresía | Directo | `nivel_membresia` |
| Control de capacidad (cupos/pausa/horarios) | Directo | update `beneficio` |
| **QR del negocio (generar/rotar)** | **Edge** | `rotar-qr`; luego select `negocio_qr` para mostrarlo |
| Plantillas por industria | Cliente | catálogo de plantillas en el front + inserts |
| CRM de clientes | Directo | select `cliente_negocio` + `cliente` |
| Edición manual de visitas | Directo | insert/update `visita` (RLS miembro) |
| **Dashboard / métricas** | **RPC** | `metricas_negocio(...)` *(pendiente)* |
| Reseñas (ver / aprobar pública) | Directo | select/update `resena` (ADR-03) |
| Gamificación (retos / ruleta / rifas) | Directo | `reto`, `rifa` |
| Campañas push | **Edge** | `enviar-campana` *(bloqueado: necesita FCM)* |
| Alta de personal | Directo | insert `usuario_negocio` (RLS miembro) |
| Catálogo / menú | Directo | `catalogo_*` |
| Citas | Directo | `cita` |
| Facturación / pagos | **Edge** | webhook Stripe/Conekta *(fase 2)* |

## Plataforma ADMIN

| Acción | Mecanismo |
| --- | --- |
| Gestión de negocios / planes | Directo (RLS admin) |
| Métricas internas (MRR, churn) | **RPC** *(pendiente)* |

## Tareas programadas (cron)

| Tarea | Mecanismo | Estado |
| --- | --- | --- |
| Rotar QR de todos los negocios cada 24h | Edge + cron | `rotar-qr` (modo masivo) *(siguiente)* |
| Recordatorios de vencimiento / inactividad | Edge + cron | *(bloqueado: FCM)* |

---

## Resumen: qué construye este "núcleo backend"

✅ **Edge Functions del ciclo central** (este entregable):
- `rotar-qr` — genera el QR firmado del negocio.
- `registrar-visita` — el escaneo del cliente (antifraude + desbloqueo).
- `generar-codigo-canje` — token temporal del cliente.
- `canjear-beneficio` — validación del canje por el personal.

⬜ **Pendiente / siguiente**: RPCs de ranking y métricas, rotación masiva por
cron, y todo lo de push (bloqueado hasta tener Firebase/FCM).

📌 **Lo demás (la mayoría)** son llamadas directas con RLS — no requieren
código de backend, solo que app y web usen el cliente de Supabase.
