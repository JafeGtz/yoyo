# Arquitectura del proyecto (app `yoyo`)

App móvil del cliente/personal en **React Native + TypeScript**, con
**MVVM** sobre una **clean architecture** por capas. Decisiones en
[`decisiones-tecnicas.md`](./decisiones-tecnicas.md); trabajo en
[`backlog-mvp.md`](./backlog-mvp.md).

## Estructura de carpetas

```
src/
├── app/                      # Composición de la app
│   ├── App.tsx               # Raíz: providers globales
│   └── navigation/           # Navegación (RootNavigator)
├── core/                     # Núcleo transversal, sin UI
│   ├── config/               # env (Supabase URL/key, flags)
│   ├── di/                   # container: ensambla repos + casos de uso
│   ├── errors/               # AppError normalizado
│   └── result/               # Result<T> (éxito/error sin excepciones)
├── domain/                   # Reglas de negocio puras (sin RN ni Supabase)
│   ├── entities/             # Negocio, ProgresoNegocio, ...
│   ├── repositories/         # Interfaces (frontera hacia datos)
│   └── usecases/             # Casos de uso (ObtenerMisNegocios, ...)
├── data/                     # Implementación de datos
│   ├── supabase/             # supabaseClient (pendiente)
│   └── repositories/         # *Mock (dev) y *Supabase (real)
├── features/                 # Módulos verticales (MVVM por feature)
│   └── misNegocios/
│       ├── view/             # Pantallas/componentes (UI "tonta")
│       └── viewmodel/        # Hooks useXxxViewModel (estado + orquestación)
└── shared/                   # Reutilizable entre features
    ├── theme/                # colors, spacing, typography
    └── ui/                   # AppText, Screen, Card, ...
```

## Regla de dependencias (clean architecture)

Las dependencias apuntan **hacia adentro**. El dominio no conoce a nadie:

```
View → ViewModel → UseCase → Repository (interfaz) ← Repository (impl) → Supabase
        (MVVM)              └─────────── dominio ───────────┘     └──── data ────┘
```

- **View** solo lee el estado del **ViewModel** y dispara acciones. Sin
  lógica de negocio ni acceso a datos.
- **ViewModel** (hook `useXxxViewModel`) orquesta casos de uso y expone un
  estado de UI tipado. Sin JSX.
- **UseCase** contiene la lógica de negocio; depende de **interfaces** de
  repositorio, no de Supabase.
- **Repository (impl)** traduce datos externos a entidades de dominio.
- **DI container** (`core/di`) es el único que conoce implementaciones
  concretas y decide **mock vs Supabase** según `env.useMockData`.

## Rebanada de referencia: `misNegocios`

Vertical completo ya funcionando (con datos mock) que sirve de molde para
las demás features:

`MisNegociosScreen` → `useMisNegociosViewModel` → `ObtenerMisNegocios`
→ `NegocioRepository` → `NegocioRepositoryMock` (hoy) / `...Supabase` (luego).

Para crear una feature nueva, replicar ese flujo.

## Estado actual

- ✅ Estructura de capas y rebanada `misNegocios` corriendo con mock.
- ✅ La app arranca y lista negocios de ejemplo.
- ⏳ Sin backend real, navegación de una sola pantalla, sin auth.

## Dependencias a instalar en los siguientes pasos

| Cuándo | Paquete | Para |
| --- | --- | --- |
| Navegación (F0-4) | `@react-navigation/native` `@react-navigation/native-stack` `react-native-screens` `react-native-safe-area-context` | Stack/Tabs |
| Backend (F0-1/2) | `@supabase/supabase-js` `react-native-url-polyfill` `@react-native-async-storage/async-storage` | Datos + Auth |
| Push (F0-6) | `@react-native-firebase/app` `@react-native-firebase/messaging` | Notificaciones (FCM) |
| Entorno | `react-native-config` | Variables `.env` |

> Las que tienen módulo nativo requieren `pod install` (iOS) y rebuild de
> Gradle (Android) tras instalarse.

## Convenciones

- **TypeScript estricto**, sin `any`. Tipos de dominio como fuente única.
- Imports relativos por ahora (sin alias para no añadir config de Babel).
- Nombres de dominio en español (coinciden con los requerimientos).
- **Definition of Done** por historia: capas respetadas, sin lógica de
  negocio en la View, RLS verificada cuando toque Supabase, tests del
  dominio/ViewModel.
