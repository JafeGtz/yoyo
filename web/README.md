# yoyo — SaaS web del dueño

Panel de administración para dueños de negocio del Sistema de Fidelización
Digital. **Next.js 16 + React 19 + Tailwind v4 + Supabase.**

Comparte la base de datos con la app móvil (`../yoyo` — React Native).
Documentación de producto en `../yoyo/docs/`.

## Correr en local

```bash
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

Variables en `.env.local` (ya configuradas → proyecto Supabase `yoyo`).

## Estructura

```
src/
├── app/
│   ├── login, registro, onboarding   # auth pública
│   └── (app)/                         # área privada (guard por sesión)
│       ├── layout.tsx                 # sidebar + redirección
│       ├── dashboard/                 # métricas (✅ funcional)
│       ├── beneficios/                # CRUD de beneficios (✅ funcional)
│       ├── clientes/                  # CRM lista (✅ funcional)
│       ├── qr/                        # genera QR vía Edge Function (✅ funcional)
│       └── capacidad, membresias, catalogo, resenas, personal, ayuda  # placeholders
├── components/{ui,layout}/
└── lib/
    ├── supabase/{client,server,middleware}.ts   # clientes browser/server + sesión
    └── session.ts                                # detección de negocio/rol
```

## Cómo funciona la sesión

- `proxy.ts` refresca la sesión y bloquea rutas privadas sin login.
- El layout de `(app)` exige negocio: sin sesión → `/login`; con sesión pero
  sin negocio → `/onboarding`.
- Todo el acceso a datos pasa por RLS (el dueño solo ve su negocio).

## Estado

✅ Auth, onboarding, dashboard, beneficios (CRUD), clientes, QR — funcionales
contra la base real. Resto de secciones: placeholders listos para llenar.

## Desplegar (Vercel)

```bash
# importar el repo en Vercel y definir las env NEXT_PUBLIC_SUPABASE_*
vercel
```
