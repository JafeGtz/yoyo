# Mapa de pantallas — App y SaaS Web

Inventario de pantallas de los dos productos, organizado por navegación.
Etiquetas de fase: **F1** = MVP, **F2/F3** = posterior.
Mecanismos de backend en [`backend-api.md`](./backend-api.md).

---

# 1. App móvil del CLIENTE (React Native — este repo `yoyo`)

Navegación: stack de entrada (auth) → tabs inferiores.

## 1.0 Entrada / Onboarding (stack)
| Pantalla | Fase | Propósito |
| --- | --- | --- |
| Splash | F1 | Carga inicial, decide sesión activa o no |
| Tour (3 slides) | F1 | "Escanea · Gana · Canjea" |
| Registro | F1 | Celular + nombre + cumpleaños + (opcional) código referido. Sin SMS (ADR-02) |
| Login social | F1 | Google / Apple |
| Aviso de privacidad | F1 | Aceptación LFPDPPP |

## 1.1 Tab INICIO
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Mis negocios | F1 | Lista de negocios con progreso (ya prototipada) | Directo |
| Detalle de negocio | F1 | Progreso, próximos beneficios, historial de visitas, info y catálogo del negocio | Directo |
| Descubrir / mapa | F3 | Negocios cercanos de la red | Directo |

## 1.2 Tab ESCANEAR  ⭐ (núcleo)
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Cámara QR | F1 | Escanear el QR del negocio | `registrar-visita` |
| Resultado de visita | F1 | "¡Visita #7! Te faltan 3…" + beneficios desbloqueados | — |
| Código de respaldo | F1 | Ingreso manual de 6 dígitos si falla la cámara | `registrar-visita` |
| Mini-juego (ruleta/rasca) | F2 | Si el negocio lo activó | Directo |

## 1.3 Tab BENEFICIOS  ⭐ (núcleo)
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Mis beneficios | F1 | Lista por estado (disponible/vencido/canjeado) con countdown | Directo |
| Detalle de beneficio | F1 | Info + botón "Usar" | Directo |
| Código de canje | F1 | Muestra el QR/código temporal + cuenta regresiva | `generar-codigo-canje` |
| Reseña post-canje | F1 | Estrellas + NPS tras canjear | Directo |

## 1.4 Tab RETOS / COMPETENCIA
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Cliente del mes / Top | F1 | Ranking básico por negocio | RPC |
| Rankings globales | F2 | Top de la red, temporadas | RPC |
| Retos y misiones | F2 | Lista de retos con progreso | Directo |
| Rifas | F2 | Rifas disponibles y resultados | Directo |

## 1.5 Tab PERFIL
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Mi perfil | F1 | Editar datos personales | Directo |
| Estatus global | F1 | Nivel Embajador, puntos, insignias | Directo |
| Mis referidos | F1 | Mi código + historial de invitados | Directo |
| Notificaciones | F1 | Lista de avisos | Directo |
| Configuración | F1 | Preferencias de notificación, idioma | Directo |
| Cerrar sesión / eliminar cuenta | F1 | Cumplimiento legal | Auth |

---

# 2. App del PERSONAL (versión ligera)

Mínima: solo confirma canjes. (Ver decisión pendiente abajo.)

| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Login personal | F1 | Acceso con permisos limitados | Auth |
| Escáner de canje | F1 | Escanea el código del cliente | `canjear-beneficio` |
| Confirmación de canje | F1 | Muestra beneficio + cliente, confirma | — |
| Canjes del día | F2 | Historial de lo validado | Directo |

---

# 3. SaaS Web del DUEÑO (Next.js — proyecto aparte)

Layout: sidebar + área de contenido.

## 3.0 Entrada
| Pantalla | Fase | Propósito |
| --- | --- | --- |
| Registro / login dueño | F1 | Email+password o Google |
| Onboarding (wizard) | F1 | Datos del negocio → modelo de acumulación → plan → plantilla → genera QR |

## 3.1 Operación diaria
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Dashboard | F1 | Métricas en tiempo real, gráficas, alertas de saturación | RPC |
| Clientes (CRM) | F1 | Lista + filtros | Directo |
| Ficha de cliente | F1 | Visitas, nivel, beneficios, historial, notas, edición manual | Directo |
| QR del negocio | F1 | Ver / descargar / regenerar | `rotar-qr` |

## 3.2 Configuración del programa
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Beneficios | F1 | CRUD de los 8 tipos | Directo |
| Control de capacidad | F1 | Cupos, horarios, stock, pausa rápida | Directo |
| Niveles de membresía | F1 | Crear niveles y sus beneficios | Directo |
| Catálogo / menú | F1 | Productos/servicios con precio y foto | Directo |
| Plantillas por industria | F1 | Elegir set pre-armado y ajustar | Cliente |

## 3.3 Engagement
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Reseñas | F1 | Ver privadas + NPS; aprobar las públicas (ADR-03) | Directo |
| Recordatorios / campañas | F1/F2 | Automáticos (inactividad) y manuales segmentados | Edge (push) |
| Gamificación | F2 | Leaderboards, retos, ruleta, rifas, insignias | Directo |
| Agenda de citas | F2 | Calendario, confirmaciones | Directo |

## 3.4 Cuenta
| Pantalla | Fase | Propósito | Backend |
| --- | --- | --- | --- |
| Personal | F1 | Alta de empleados con permisos | Directo |
| Reportes / exportación | F2 | Excel/CSV, PDF mensual | RPC/Directo |
| Facturación | F2 | Plan, pagos, facturas | Edge (Stripe) |
| Centro de ayuda | F1 | Tutoriales, FAQ, soporte | — |

---

# 4. Panel ADMIN de plataforma (interno) — F3

Negocios · Planes y precios · Métricas internas (MRR/churn/LTV) ·
Anunciantes · Moderación · Soporte · Auditoría.

---

# Resumen del MVP (F1) a construir

**App cliente (~18 pantallas):** onboarding (5) + inicio (2) + escanear (3) +
beneficios (4) + perfil (5) + competencia básica (1).
**App personal (~3 pantallas):** login + escáner + confirmación.
**Web dueño (~14 pantallas):** onboarding + dashboard + CRM + beneficios +
capacidad + membresías + catálogo + reseñas + personal + QR + ayuda.

⭐ El corazón son **Escanear** y **Beneficios** (app) — ya tienen backend real.

---

# Decisiones por confirmar antes de construir

1. **App del personal**: ¿app separada, el mismo `yoyo` con cambio de rol, o
   solo la web responsive del dueño? (Recomendado para MVP: el mismo `yoyo`
   detecta el rol y muestra el escáner de canje — menos esfuerzo.)
2. **Orden de construcción**: ¿empezamos por la app cliente o por la web del
   dueño? (Recomendado: app cliente, el ciclo escanear→canjear.)
3. **Web del dueño**: vive en un repo/proyecto aparte (Next.js). ¿Se crea
   ahora o después de la app?
