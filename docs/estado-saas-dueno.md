# Estado del SaaS del dueño vs requerimientos (sección 5)

Auditoría honesta de lo construido contra el documento. Leyenda:
✅ completo · 🟡 parcial (falta para MVP) · ⬜ pendiente F1 · ⏭️ fase posterior (F2/F3)

| § | Requerimiento | Estado | Qué falta |
| --- | --- | --- | --- |
| 5.1 | Onboarding del negocio | ✅ | dirección, teléfono, logo (Storage), descripción, plan + 2 meses gratis |
| 5.2 | Configuración de beneficios | ✅ | (solo falta foto opcional) |
| 5.3 | Control de capacidad | ✅ | cupos día/semana/mes, stock, horarios de canje, pausa global |
| 5.4 | Plantillas pre-validadas por industria | ✅ | 4 industrias, aplica beneficios + niveles de un clic |
| 5.5 | Sistema de membresías | ✅ | niveles + beneficios exclusivos + caducidad (flujo entre niveles = analítica, después) |
| 5.6 | Competencia y gamificación | ✅ | config (retos, rifas, ruleta/rasca, logros, toggles) + **MOTOR**: otorga insignias, niveles, puntos, progreso de retos, ranking, sorteo y giro — todo automático al escanear |
| 5.7 | Gestión de clientes (CRM) | ✅ | búsqueda, ficha, beneficios/historial/reseñas, notas, bloqueo, ajuste manual de visitas con auditoría |
| 5.8 | Dashboard y analíticas | ✅ | gráficas (visitas, top beneficios), alertas inteligentes, NPS, métricas Plus |
| 5.9 | Recordatorios y campañas | ✅* | campañas crean notificación in-app; *push (FCM) queda listo para conectar Firebase |
| 5.10 | Agenda de citas | ✅ | agendar, confirmar, cancelar, completar |
| 5.11 | Menú / catálogo | ✅ | categorías + items con foto (Storage) |
| 5.12 | Reportes y exportación | ✅ | export CSV de clientes y de canjes (PDF: después) |
| 5.13 | Gestión de personal | 🟡 | falta vista de auditoría (qué empleado validó cada canje — el dato ya se guarda) |
| 5.14 | Configuración y facturación | ⏭️ | datos fiscales, pagos, facturas (F2, requiere Stripe) |
| 5.15 | Centro de ayuda | ✅ | (faltan videos, menor) |

## Resumen

**SaaS del dueño: casi todo el alcance construido y verificado en vivo.**

Construido (✅): 5.1 Onboarding, 5.2 Beneficios, 5.3 Capacidad, 5.4 Plantillas,
5.5 Membresías, 5.6 Gamificación, 5.7 CRM, 5.8 Dashboard, 5.9 Campañas,
5.10 Citas, 5.11 Catálogo, 5.12 Reportes, 5.13 Personal, 5.15 Ayuda.

**Lo único pendiente:**
- **5.14 Facturación** — excluida a propósito (requiere Stripe/Conekta, F2).
- **Push (FCM)** — toda la lógica de notificaciones/campañas está lista; solo
  falta conectar Firebase para el envío push. Las campañas ya crean
  notificación in-app.
- **PDF** de reportes (CSV ya funciona).
