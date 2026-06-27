# Base de datos — Supabase

Esquema PostgreSQL del Sistema de Fidelización Digital. Cubre el modelo de
datos completo (requerimientos sección 11) con multi-tenant + RLS.

## Migraciones (orden de aplicación)

| Archivo | Contenido |
| --- | --- |
| `20260624090000_extensions_and_enums.sql` | `pgcrypto` + 22 tipos enum del dominio |
| `20260624090100_core_tables.sql` | Identidad multi-tenant + mecánica central (negocio, usuarios, cliente, visitas, beneficios, canje, QR) |
| `20260624090200_feature_tables.sql` | Competencia, referidos, reseñas, notificaciones, citas, catálogo, pagos, anuncios |
| `20260624090300_functions_and_triggers.sql` | Helpers de RLS (schema `private`) + triggers `actualizado_en` |
| `20260624090400_rls_policies.sql` | RLS activado en las 25 tablas + 56 políticas |
| `20260624090500_seed_logros.sql` | 10 insignias globales por defecto |

## Modelo de seguridad (RLS)

- **Cliente**: solo ve/edita sus propios datos.
- **Negocio (dueño/personal)**: datos de su negocio vía `private.es_miembro_negocio()`.
- **Admin de plataforma**: acceso global vía `private.es_admin()`.
- **Operaciones sensibles** (registro de visita con antifraude, canje,
  rotación de QR, envío de notificaciones, otorgar insignias) van por
  **Edge Functions con `service_role`**, que ignora RLS. Por eso varias
  tablas no tienen política de INSERT para clientes.
- **Onboarding**: el dueño fundador puede crear su negocio y auto-asignarse
  solo si el negocio aún no tiene miembros (`private.negocio_sin_miembros()`),
  cerrando la escalación a negocios ajenos.

> Validado con Postgres 15: las 6 migraciones aplican limpio y los tests de
> aislamiento multi-tenant y de anti-escalación pasan.

## Cómo correrlo localmente

```bash
# 1. Iniciar Supabase local (requiere Docker)
supabase start

# 2. Aplicar migraciones a la base local
supabase db reset      # recrea desde cero y corre todas las migraciones + seed

# 3. (Opcional) Generar tipos TypeScript para la app/web
supabase gen types typescript --local > ../src/core/types/database.types.ts
```

## Cómo subirlo a Supabase (nube)

```bash
supabase login
supabase link --project-ref <TU_PROJECT_REF>
supabase db push       # aplica las migraciones al proyecto remoto
```

## Edge Functions (núcleo backend) — desplegadas ✅

En `supabase/functions/`. Validadas end-to-end contra el proyecto en la nube
(ciclo escanea → desbloquea → genera código → canjea, incluyendo antifraude
24h y bloqueo de doble canje). Contrato completo en `docs/backend-api.md`.

| Función | Quién la llama | Qué hace |
| --- | --- | --- |
| `rotar-qr` | Dueño (web) | Genera el QR firmado del negocio (TTL 24h) |
| `registrar-visita` | Cliente (app) | Verifica firma + QR activo, antifraude 24h, geocerca, registra visita y desbloquea beneficios |
| `generar-codigo-canje` | Cliente (app) | Token temporal firmado (2 min) para canjear |
| `canjear-beneficio` | Personal (app) | Valida el código, marca canjeado, registra auditoría |

Secreto requerido (ya configurado en el proyecto): `QR_SIGNING_SECRET`.
Redesplegar: `supabase functions deploy <nombre> --project-ref <ref>`.

## Pendientes de la capa de datos (siguientes pasos)

- **RPCs**: `ranking_negocio()`, `metricas_negocio()` (agregaciones).
- **Cron**: rotación masiva de QR; recordatorios (bloqueado hasta tener FCM).
- **Auth trigger** opcional: crear fila `cliente`/`usuario_negocio` tras el
  signup según metadata.
- **Storage buckets**: logos de negocio, fotos de beneficios/catálogo.
- Conectar `NegocioRepositorySupabase` (en `src/data/repositories/`) y poner
  `useMockData = false` en `src/core/config/env.ts`.
