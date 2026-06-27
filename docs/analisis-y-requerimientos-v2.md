# Sistema de Fidelización Digital

**Análisis y Requerimientos del Sistema**
**Versión 2 — Ampliada**

- Web de administración para dueños de negocio
- Aplicación móvil para clientes consumidores

*Documento técnico*

---

## 1. Introducción

### 1.1 Objetivo del documento

Este documento describe los requerimientos funcionales, no funcionales y técnicos del sistema de fidelización digital, integrado por dos productos complementarios: una aplicación móvil para los clientes consumidores y una plataforma web de administración para los dueños de negocio.

El propósito es servir como base para el diseño, desarrollo y construcción del MVP, así como guía para fases posteriores.

### 1.2 Cambios respecto a la versión anterior

Esta versión amplía y precisa la primera entrega con los siguientes aportes:

- Definición clara del mecanismo de registro de visitas (modelo híbrido: cliente escanea QR del negocio para registrar visita, negocio escanea código temporal del cliente para canjear beneficio).
- Modelo dual de acumulación: por visitas (default) o por consumo monetario (plan Plus opcional).
- Catálogo expandido de tipos de beneficios (8 categorías).
- Sistema de competencia entre usuarios robusto: rankings, retos, puntos globales, temporadas.
- Sistema de reseñas privadas (NPS) en MVP, públicas en fase posterior.
- Plataforma publicitaria interna como nueva línea de ingreso (fase 2-3).
- Estrategia detallada de recordatorios de vencimiento.

### 1.3 Actores del sistema

- **Cliente consumidor:** usuario final que descarga la app, escanea el QR del negocio, acumula visitas y canjea beneficios.
- **Dueño del negocio:** administrador principal del negocio en la plataforma web.
- **Personal del negocio:** usuario operativo con permisos limitados, principalmente para confirmar canjes.
- **Anunciante (fase 2+):** negocio o marca que paga para promocionarse dentro de la app.
- **Administrador de plataforma:** equipo interno con acceso a la gestión global del sistema.

---

## 2. Visión general del sistema

### 2.1 Arquitectura conceptual

- **App móvil del cliente:** iOS y Android.
- **App ligera del personal** (o web responsive): para escanear códigos de canje de clientes.
- **Panel web del dueño:** configuración, analíticas, gestión.
- **Panel administrativo interno:** para el equipo operador.
- **Plataforma publicitaria** (fase posterior): para anunciantes.

### 2.2 Principios de diseño

- **Simplicidad extrema:** el dueño configura su negocio en menos de 15 minutos. El cliente escanea sin instrucciones.
- **Configurable:** el dueño personaliza todo (nombres, premios, niveles, costos, modelo de acumulación).
- **Protección del negocio:** el sistema previene activamente errores de configuración que expongan al dueño.
- **Anti-fraude por defecto:** QR rotativo, código temporal de canje, geolocalización opcional, validaciones múltiples.
- **Competencia sana:** los clientes son incentivados a regresar también por estatus, no solo por premios.
- **Mobile-first** para el cliente, **desktop-first** para el dueño.

---

## 3. Mecánica central del sistema

Esta sección define cómo funciona la mecánica fundamental: cómo se registra una visita, cómo se canjea un beneficio, y cómo se acumulan recompensas.

### 3.1 Modelo de acumulación (clave del negocio)

El sistema soporta dos modelos. El dueño elige cuál usar al configurar su negocio.

#### 3.1.1 Modelo Básico — por visitas

Cada visita registrada equivale a una unidad de progreso. Ideal para negocios donde la frecuencia importa más que el ticket: barberías, cafeterías, tienditas, tortillerías, lavados.

Ejemplos de configuración:

- Visita 5 = lavado gratis
- Visita 10 = 15% de descuento
- Visita 20 = corte completo gratis

#### 3.1.2 Modelo Plus — por visitas + monto

Cada visita acumula también un monto monetario. El dueño puede crear beneficios basados en visitas, en monto acumulado, o en una combinación de ambos. Ideal para negocios con tickets variables: restaurantes, spas, clínicas, gasolineras, talleres.

Ejemplos de configuración:

- Acumula $2,000 en consumo = postre gratis
- Visita 5 + monto mínimo $500 = beneficio premium
- Cada $100 de consumo = 1 punto canjeable

**Captura del monto:** el personal teclea el monto al confirmar la visita o el canje. En fases posteriores, integración con punto de venta.

> **Decisión de modelo de monetización**
> El Modelo Plus (visitas + consumo) está disponible solo en planes superiores. Esto permite ofrecer dos versiones del producto a distintos precios y atender negocios con necesidades diferentes.

### 3.2 Registro de visitas — modelo híbrido

Para garantizar simplicidad y seguridad simultáneamente, el sistema usa dos mecanismos distintos: uno para registrar visitas (rápido y masivo) y otro para canjear beneficios (seguro y controlado).

#### 3.2.1 Registro de visita: cliente escanea el QR del negocio

- **Mecanismo:** el QR del negocio está visible en el local. El cliente abre su app, escanea, queda registrada la visita.
- **QR rotativo:** el código se regenera periódicamente (cada 12 o 24 horas) para evitar que alguien le tome foto y lo comparta para escanear remotamente.
- **Geolocalización opcional:** el sistema verifica que el celular está dentro de un radio configurable del local (ej. 100m). El dueño activa o desactiva esta validación.
- **Restricción anti-doble-escaneo:** máximo 1 visita registrada por cliente por negocio cada 24 horas.
- **Confirmación:** la app muestra inmediatamente la visita registrada y el progreso actualizado.
- **Modo respaldo:** código numérico de 6 dígitos que el cliente puede teclear si la cámara no funciona o el QR está dañado.

#### 3.2.2 Canje de beneficio: el negocio escanea al cliente

- **Mecanismo:** cuando el cliente está listo para usar su beneficio, su app genera un código de canje temporal (QR de un solo uso, válido por minutos).
- El personal escanea ese código desde su app o web. El sistema valida, marca el beneficio como canjeado, y muestra confirmación a ambos.
- **Ventajas:** imposible falsificar el canje, el dueño confirma físicamente cada beneficio dado, queda registro de qué empleado lo validó.
- **Modo respaldo:** el cliente muestra un código numérico y el personal lo teclea en su app.

> **Por qué dos mecanismos distintos**
> El registro de visitas debe ser ultra rápido y sin fricción (el cliente lo hace solo). El canje involucra costo real para el negocio y debe estar validado por personal. Separar ambos mecanismos protege al dueño sin estorbar al cliente.

### 3.3 Tipos de beneficios

El sistema soporta 8 tipos de beneficios. El dueño elige el tipo al crear cada beneficio, y la app del cliente lo presenta visualmente diferenciado.

| Tipo de beneficio | Descripción y ejemplo |
| --- | --- |
| Producto físico gratis | Un artículo del catálogo regalado. Ej: café americano, cerveza, postre del día. |
| Servicio gratis | Un servicio completo regalado. Ej: corte de cabello, lavado, masaje express. |
| Descuento porcentual | Porcentaje fijo aplicado al ticket. Ej: 15% en la próxima visita. |
| Descuento fijo | Monto exacto descontado. Ej: $100 menos en tu próximo consumo de $300 o más. |
| Upgrade gratis | Mejora sin costo extra. Ej: tamaño grande pagando chico, suite con tarifa de habitación estándar. |
| Combo o 2x1 | Promoción condicionada. Ej: lleva 3 paga 2, segundo café gratis. |
| Acceso exclusivo | Privilegio sin costo monetario. Ej: reservación prioritaria, entrada VIP, fila preferente. |
| Regalo sorpresa | El dueño decide al momento. Ideal para experimentar. Ej: "obsequio especial al canjear". |

---

## 4. Aplicación móvil del cliente

**Plataforma:** iOS y Android. **Idioma principal:** español.

### 4.1 Registro y onboarding

- Registro por número celular con verificación por SMS o registro vía Google/Apple.
- Datos mínimos: nombre, fecha de cumpleaños, foto opcional.
- Aceptación de aviso de privacidad (cumplimiento LFPDPPP).
- Tour inicial de 3 pantallas explicando: escanea, gana, canjea.
- Campo opcional de código de referido ANTES de la primera visita.

### 4.2 Escaneo y registro de visita

- Cámara nativa para lectura del QR del negocio.
- Validación criptográfica del QR (anti-falsificación).
- Validación de geolocalización si el negocio la activó.
- Restricción de 1 escaneo por cliente por negocio cada 24 horas.
- Confirmación visual con resumen de progreso: "Visita #7. Te faltan 3 para tu lavado gratis."
- Activación automática de mini juego (ruleta/rasca) si el negocio lo configuró.
- Modo respaldo: ingreso manual del código numérico del negocio.

### 4.3 Mi progreso y beneficios

#### 4.3.1 Vista de progreso por negocio

- Contador de visitas totales y del periodo en curso.
- Monto acumulado (si el negocio usa Modelo Plus).
- Nivel de membresía actual y siguiente con barra de progreso.
- Próximos beneficios a desbloquear con visitas o monto faltante.
- Historial completo de visitas con fecha y hora.

#### 4.3.2 Mis beneficios

- Listado de beneficios activos con tipo identificable visualmente y countdown de vencimiento.
- Estado del beneficio: disponible, agotado por cupo del día, pausado, vencido, ya canjeado.
- Botón "Usar beneficio" que genera el código de canje temporal (QR único) que el personal escanea.
- Botón "Reservar" para beneficios premium que requieren cita previa.

### 4.4 Recordatorios y notificaciones inteligentes

Estrategia escalonada para maximizar el canje sin saturar al usuario:

| Momento | Mensaje sugerido |
| --- | --- |
| Al desbloquear beneficio | "¡Desbloqueaste un corte gratis! Tienes 3 días para usarlo." |
| 3 días antes de vencer | "Tu corte gratis está esperándote. Vence el viernes." |
| 1 día antes de vencer | "Mañana vence tu corte gratis. ¡No lo dejes ir!" |
| Día del vencimiento | "Hoy es el último día para tu corte gratis." |
| 24 horas después de vencer | "Tu beneficio venció, pero sigues sumando. Ya casi desbloqueas el siguiente." |
| Inactividad 7 días | "Hace una semana que no nos vemos. Te esperamos." |
| Inactividad 14 días | "Tu lugar sigue aquí. Vuelve y suma visita." |
| Inactividad 30 días | "Te extrañamos. Tienes un beneficio especial esperándote." |
| Cumpleaños | "¡Feliz cumpleaños! Aquí va un regalo especial para ti." |
| Referido completado | "Tu amigo Juan acaba de unirse. ¡Ambos ganaron beneficio!" |

### 4.5 Sistema de competencia entre usuarios

Esta es una pieza central para generar enganche más allá del premio inmediato. Los humanos respondemos a estatus tanto como a recompensas materiales.

#### 4.5.1 Rankings y leaderboards

- **Top 10 del mes por negocio:** ranking público dentro de cada negocio. El cliente ve su posición y la de los demás (con apodo o nombre).
- **Top global de la red:** ranking entre todos los usuarios activos en la plataforma.
- **Ranking entre amigos:** comparativa con clientes invitados por referido.
- **Posición visible siempre:** el cliente ve su lugar ("estás en el #14, te faltan 3 visitas para subir al top 10").

#### 4.5.2 Retos y misiones

El dueño puede activar retos pre-armados o crear los suyos. Ejemplos:

- "Visita 5 veces este mes y desbloquea X"
- "Visita en 3 días seguidos"
- "Trae a 2 amigos en 30 días"
- "Visita 3 negocios distintos de la red esta semana"

Completar un reto otorga: puntos extra, insignia especial, entrada a rifa, o beneficio adicional.

#### 4.5.3 Sistema de puntos globales (transversal a la red)

- Cada visita acumula puntos en la red completa, no solo en un negocio.
- Niveles de "Embajador" globales: Bronce, Plata, Oro, Platino, Diamante.
- Cada nivel global da privilegios en TODA la red: invitaciones a rifas exclusivas, eventos especiales, beneficios de bienvenida en nuevos negocios.
- Este sistema crea un activo que viaja con el cliente y refuerza la red.

#### 4.5.4 Temporadas (estilo videojuegos)

- Cada mes hay una "temporada" con un ranking que se reinicia.
- Al final de la temporada, los top 3 globales reciben premios patrocinados por la red.
- Temporadas temáticas: "Temporada de Verano", "Temporada Decembrina".

#### 4.5.5 Logros e insignias

- 10 insignias por defecto: Primera Visita, Veterano (50 visitas), Centenario (100 visitas), Madrugador, Nocturno, Referidor, Cumpleañero, etc.
- El dueño puede activar, editar o agregar insignias propias del negocio.
- Compartibles en redes sociales.

### 4.6 Gamificación adicional

- **Ruleta "Gira y Gana":** animación al recibir un giro. Premios y probabilidades configurados por el dueño. Siempre se gana algo.
- **Rasca y gana digital:** se activa aleatoriamente al escanear, según frecuencia configurada.
- **Rifas mensuales:** el cliente ve rifas disponibles, si califica, y cuándo se sortea. Notificación automática del ganador.
- **Cliente del mes:** indicador de su posición en el ranking del mes en cada negocio.

### 4.7 Sistema de referidos ampliado

- Código único por cliente, compartible vía WhatsApp, redes sociales o enlace.
- Al escanear por primera vez con código de referido, AMBOS ganan beneficio.
- Historial de referidos: cuántos invitó, cuántos completaron primera visita.
- **Referidos escalonados (nuevo):** referir 3 amigos desbloquea beneficio especial; referir 10 desbloquea nivel VIP; referir 20 desbloquea premio mayor.
- **Top referidores del mes (nuevo):** ranking público de quién ha invitado más, con premio mensual.
- Notificación al cliente cuando su referido completa la primera visita.

### 4.8 Reseñas y feedback (modelo privado en MVP)

El sistema de reseñas se implementa en dos etapas para proteger a los negocios mientras se valida el modelo.

#### 4.8.1 Fase MVP — reseñas privadas para el dueño

- Después de cada canje de beneficio, la app le pregunta al cliente: "¿Cómo fue tu experiencia?" (1 a 5 estrellas + comentario opcional).
- NPS estándar: "¿Qué tan probable es que recomiendes este negocio? (0-10)"
- Las respuestas se envían al panel del dueño, no son públicas.
- Si la calificación es alta (4-5 estrellas), la app sugiere al cliente compartirla en Google Reviews y le facilita el enlace.
- Si la calificación es baja, el dueño recibe alerta y puede contactar al cliente para resolver.

#### 4.8.2 Fase posterior — reseñas públicas

- Una vez que la plataforma tenga masa crítica de usuarios y un sistema de moderación, se activarán reseñas públicas con respuesta del dueño.
- Esto se evaluará caso por caso, idealmente con consentimiento del dueño.

### 4.9 Información del negocio en la app

- Perfil: logo, nombre, descripción, dirección con mapa, teléfono, horarios.
- Menú o catálogo con precios y fotos.
- Botón de contacto directo (WhatsApp, llamada, indicaciones).
- Agenda de citas si el negocio la activó.
- Calificación promedio del negocio (cuando reseñas sean públicas).

### 4.10 Descubrimiento de negocios

- Mapa de negocios cercanos en la red.
- Búsqueda por categoría (barbería, café, restaurante).
- Recomendaciones: "Otros clientes como tú también visitan..."
- Negocios destacados (espacio publicitario monetizable, ver sección 6).

### 4.11 Perfil del usuario

- Edición de datos personales.
- Lista de todos los negocios donde es cliente con estado actual.
- Vista de estatus global (nivel de Embajador, puntos totales, insignias).
- Configuración de notificaciones por tipo.
- Cierre de sesión y eliminación de cuenta (cumplimiento legal).

---

## 5. Plataforma web del dueño

**Plataforma:** web responsive. **Idioma principal:** español.

### 5.1 Onboarding del negocio

- Registro con email y contraseña, o cuenta Google.
- Captura de datos: nombre, tipo de negocio, dirección, teléfono, logo, descripción.
- Selección del Modelo de acumulación: Básico (solo visitas) o Plus (visitas + monto).
- Selección de plan de suscripción con periodo gratuito de 2 meses.
- Asistente paso a paso, configuración mínima en menos de 15 minutos.
- Generación automática del QR personalizado con logo.

### 5.2 Configuración de beneficios

- Crear, editar, archivar beneficios.
- Por cada beneficio: nombre, descripción, foto opcional, tipo (uno de los 8 definidos), condición de desbloqueo (visitas, monto o combinación), vigencia en días, valor monetario estimado, cupos.
- Activar o pausar sin eliminar.

### 5.3 Control de capacidad

- Cupos por día/semana/mes: límites configurables de canjes.
- Horarios de canje: beneficio canjeable solo en ciertos días u horas.
- Stock total: ej. 50 cervezas para regalar este mes.
- Pausa rápida del programa completo (modo emergencia).
- Reserva obligatoria para beneficios premium.

### 5.4 Plantillas pre-validadas

El sistema ofrece plantillas pre-armadas por tipo de negocio (barbería, cafetería, salón, restaurante, gimnasio, lavado de autos, veterinaria, farmacia, etc.) con beneficios, niveles, costos y proyecciones recomendadas. El dueño elige una y luego ajusta.

### 5.5 Sistema de membresías

- Niveles con nombre personalizado (no genérico).
- Visitas mínimas para alcanzar cada nivel.
- Beneficios exclusivos por nivel.
- Caducidad opcional (renovación anual).
- Visualización del flujo de clientes entre niveles.

### 5.6 Configuración de competencia y gamificación

- Activar/desactivar leaderboards (top del mes por negocio).
- Crear retos personalizados con condiciones, duración y recompensas.
- Configurar ruleta: premios y probabilidades. Sistema valida que sumen 100% y advierte si un premio caro tiene probabilidad alta.
- Configurar rasca y gana: frecuencia y premios.
- Configurar rifas: premio, fecha, criterio de participación.
- Configurar cliente del mes: premio mensual automático.
- Logros e insignias: activar/editar las 10 por defecto, agregar propias.

### 5.7 Gestión de clientes (CRM)

- Lista completa con buscador y filtros.
- Ficha individual: visitas totales, monto acumulado (si Plus), última visita, nivel, beneficios activos, historial, logros, notas privadas.
- Edición manual de visitas con registro de auditoría.
- Bloqueo de clientes problemáticos.
- Acceso a reseñas/calificaciones que el cliente dio al negocio.

### 5.8 Dashboard y analíticas

- Métricas en tiempo real: visitas hoy/semana/mes, clientes activos, nuevos del mes, tasa de retorno, cliente del mes.
- Gráficas: visitas por periodo, nuevos vs recurrentes, distribución por nivel, beneficios más canjeados, mejores días y horarios.
- Métricas del Modelo Plus: ticket promedio, monto total acumulado, top clientes por consumo.
- Comparativos: mes vs mes, año vs año.
- Alertas inteligentes: "45 clientes están a 1-2 visitas de desbloquear corte gratis. Prepárate."
- Resumen de reseñas: calificación promedio, NPS, comentarios recientes, alertas por reseñas bajas.

### 5.9 Recordatorios y campañas

- Recordatorios automáticos a clientes inactivos (7, 14, 30 días).
- Campañas manuales a segmentos definidos.
- Programación de campañas a fecha futura.
- Métricas de apertura y respuesta por campaña.

### 5.10 Agenda de citas (módulo opcional)

- Configuración de horarios, duración de servicios, descansos.
- Calendario diario, semanal, mensual.
- Confirmación, edición y cancelación.
- Recordatorio automático al cliente 24h antes.

### 5.11 Menú o catálogo del negocio

- Crear, editar, ordenar categorías de servicios o productos.
- Por elemento: nombre, descripción, precio, foto.
- Visible en la app del cliente.

### 5.12 Reportes y exportación

- Descarga de base de clientes en Excel/CSV.
- Reportes mensuales en PDF.
- Reporte de canjes por beneficio.
- Reporte fiscal/contable básico.

### 5.13 Gestión de personal

- Agregar usuarios con permisos limitados (solo confirmación de canjes).
- Auditoría de qué empleado validó cada canje.

### 5.14 Configuración y facturación

- Datos del negocio, plan contratado, historial de pagos.
- Método de pago y datos fiscales.
- Descarga de facturas.

### 5.15 Centro de ayuda

- Tutoriales en video.
- Preguntas frecuentes.
- Chat con soporte o WhatsApp directo.

---

## 6. Plataforma publicitaria interna

Cuando el sistema alcance volumen suficiente de usuarios activos (estimado: 10,000+), se habilita una capa publicitaria que se convierte en línea adicional de ingresos. Esta sección define los formatos y reglas.

### 6.1 Cuándo se activa

- **Versión interna** (cross-promotion entre negocios de la red): desde fase 2.
- **Versión completa** (con anunciantes externos opcionalmente): fase 3.

### 6.2 Formatos publicitarios

| Formato | Descripción | Precio sugerido/mes |
| --- | --- | --- |
| Banner patrocinado | Aparece en pantalla principal de la app | $300 a $800 |
| Negocio destacado | Aparece arriba en el directorio o mapa | $500 a $1,500 |
| Notificación patrocinada | Push enviado a usuarios cercanos o segmento (por envío) | $500 a $1,500 c/u |
| Cross-promotion | Un negocio de la red patrocina visibilidad en otro negocio aliado | Variable |
| Featured de la semana | Slot rotativo destacado por una semana | $1,000 a $2,500 |

### 6.3 Reglas y restricciones

- Los anuncios SOLO se muestran al cliente, NUNCA al dueño en su panel.
- Todo contenido patrocinado debe estar claramente identificado como "Patrocinado".
- Frecuencia de anuncios limitada para no saturar al usuario.
- Anunciantes deben pertenecer a categorías permitidas (no contenido adulto, no apuestas, no productos prohibidos).
- Usuario puede silenciar tipos de anuncios pero no eliminarlos por completo (excepto en planes premium del usuario, si se implementa).

---

## 7. Panel administrativo interno

Herramienta para el equipo que opera la plataforma. Acceso restringido.

- Gestión de negocios: alta, baja, modificación, suspensión por falta de pago.
- Gestión de planes y precios: cambios, descuentos, periodos gratuitos extendidos.
- Gestión de anunciantes (fase posterior): alta, aprobación de campañas, facturación, métricas.
- Monitoreo de salud del sistema: negocios activos, en riesgo de cancelación, métricas globales.
- Soporte: vista de cuenta del negocio para resolver dudas.
- Métricas de negocio interno: MRR, churn, LTV, conversión de prueba a pago.
- Moderación: revisión de reseñas reportadas, contenido inapropiado.
- Auditoría: registro de acciones críticas.

---

## 8. Requerimientos no funcionales

### 8.1 Seguridad

- Cifrado de datos en tránsito (HTTPS/TLS 1.2+).
- Cifrado en reposo de datos sensibles (contraseñas con bcrypt).
- Autenticación con tokens JWT y refresh tokens.
- Doble factor opcional para dueños.
- Roles y permisos diferenciados.
- QR firmado criptográficamente, rotativo (anti-falsificación).
- Códigos de canje temporales de un solo uso.
- Rate limiting en endpoints sensibles.
- Auditoría de acciones críticas.

### 8.2 Privacidad y cumplimiento

- Aviso de privacidad conforme LFPDPPP de México.
- Derechos ARCO implementados.
- Eliminación de cuenta y datos por el usuario.
- Consentimiento explícito para notificaciones y geolocalización.
- Política clara: los datos del cliente pertenecen al usuario y al negocio donde se registró; no se comparten entre negocios.
- Datos agregados anónimos pueden usarse para estadísticas y publicidad segmentada.

### 8.3 Rendimiento

- Escaneo y registro de visita: menor a 2 segundos.
- Carga de dashboard con hasta 5,000 clientes: menor a 3 segundos.
- Disponibilidad: 99.5% mensual.
- Capacidad inicial: 100 negocios, 100,000 clientes activos.

### 8.4 Escalabilidad

- Arquitectura multi-tenant.
- Base de datos preparada para 10,000+ negocios.
- Servicios desacoplados (escaneo, notificaciones, analíticas, anuncios).

### 8.5 Usabilidad

- Interfaz en español, multi-idioma a futuro.
- App del cliente accesible para usuarios con bajo nivel tecnológico.
- Panel del dueño: configuración en menos de 15 minutos.
- Accesibilidad mínima (contraste AA, tamaños ajustables).

### 8.6 Compatibilidad

- App móvil: iOS 14+ y Android 8+.
- Panel web: Chrome, Safari, Firefox, Edge en últimas dos versiones.
- Responsive en tablet y móvil.

### 8.7 Mantenibilidad y monitoreo

- Logs estructurados.
- Monitoreo de errores en producción (Sentry o equivalente).
- Alertas automáticas ante caídas.
- Backups diarios con retención de 30 días.
- Plan de recuperación ante desastres documentado.

---

## 9. Flujos de usuario clave

### 9.1 Cliente — primera visita

1. Descarga la app, registra número, verifica con SMS.
2. Completa perfil mínimo, acepta privacidad.
3. (Opcional) ingresa código de referido.
4. Llega al negocio, le indican el QR.
5. Escanea desde la app. Se valida criptografía, geolocalización (si aplica) y antifraude.
6. Confirmación: "¡Bienvenido a [Negocio]! Esta es tu visita #1."
7. Ve su primer beneficio próximo y nivel objetivo.

### 9.2 Cliente — canje de beneficio

1. Recibe notificación de beneficio disponible o por vencer.
2. Visita el negocio, abre "Mis beneficios".
3. Toca "Usar". La app genera código de canje temporal (válido por minutos).
4. Muestra el código al personal.
5. El personal lo escanea desde su app.
6. Sistema valida y marca como canjeado. Ambos reciben confirmación.
7. La app le pregunta al cliente cómo fue su experiencia (estrellas + NPS).

### 9.3 Dueño — configuración inicial

1. Crea cuenta con email.
2. Captura datos del negocio.
3. Elige Modelo de acumulación (Básico o Plus).
4. Selecciona plantilla por industria.
5. Revisa beneficios sugeridos, ajusta lo que considere.
6. Confirma y publica.
7. Descarga e imprime el QR personalizado.
8. Coloca el QR visible en el local.

### 9.4 Personal del negocio — confirmar canje

1. Inicia sesión en su app con permisos limitados.
2. El cliente le muestra el código de canje desde su app.
3. Escanea el código con la cámara.
4. Sistema valida y muestra el beneficio que se está canjeando.
5. Personal confirma y el sistema cierra el canje.

### 9.5 Dueño — día con saturación inesperada

1. Recibe alerta: "Hoy llevas 12 canjes, doble del promedio."
2. Entra al panel, va a "Beneficios activos".
3. Pausa el beneficio que se está disparando.
4. Sistema confirma: los clientes ya no podrán solicitar este beneficio hasta reanudación.
5. Reanuda al día siguiente cuando esté listo.

---

## 10. Stack tecnológico recomendado

Recomendación basada en velocidad de desarrollo, costo y escalabilidad. Sujeta a validación con el equipo técnico.

| Componente | Tecnología sugerida |
| --- | --- |
| App móvil cliente y personal | React Native (iOS + Android con código compartido) |
| Panel web del dueño | Next.js con React y Tailwind CSS |
| Backend / API | Node.js (Fastify o NestJS); API REST |
| Base de datos | PostgreSQL (vía Supabase para acelerar MVP) |
| Autenticación | Supabase Auth o Auth0; JWT |
| Almacenamiento | Supabase Storage o AWS S3 |
| Notificaciones push | Firebase Cloud Messaging (FCM) |
| SMS | Twilio o LabsMobile (México) |
| Hosting | Vercel + Supabase |
| Cobros | Stripe o Conekta (México) |
| Monitoreo | Sentry, PostHog o Mixpanel |
| Generación de QR | Biblioteca QR con firma criptográfica (JWT embebido) y rotación temporal |
| Geolocalización | APIs nativas de iOS y Android, validación en backend |

---

## 11. Modelo de datos (entidades principales)

- **Negocio:** id, nombre, tipo, dirección, logo, modelo de acumulación (Básico/Plus), plan, estado, datos fiscales.
- **Dueño/Usuario admin:** id, email, contraseña, rol, negocio.
- **Personal:** id, nombre, permisos, negocio.
- **Cliente:** id, celular, nombre, cumpleaños, foto, fecha de registro, código de referido propio, puntos globales, nivel de Embajador.
- **Cliente-Negocio (relación):** id, cliente, negocio, total de visitas, monto acumulado, nivel, primera visita, última visita.
- **Visita:** id, cliente, negocio, fecha y hora, ubicación opcional, monto opcional (si Plus), empleado que validó canje si aplica.
- **Beneficio:** id, negocio, nombre, descripción, foto, tipo (uno de los 8), condición (visitas/monto/combo), vigencia, valor estimado, cupos, estado.
- **Beneficio-desbloqueado (instancia):** id, cliente, beneficio, fecha desbloqueo, fecha vencimiento, estado.
- **Canje:** id, beneficio-desbloqueado, fecha, empleado que validó, código temporal usado.
- **Nivel de membresía:** id, negocio, nombre, visitas mínimas, beneficios asociados.
- **Reto:** id, negocio o global, nombre, condiciones, recompensa, vigencia.
- **Reto-progreso:** id, cliente, reto, progreso actual, estado.
- **Logro:** id, negocio o global, nombre, descripción, ícono, condición.
- **Insignia obtenida:** id, cliente, logro, fecha.
- **Rifa:** id, negocio, nombre, premio, fecha cierre, criterio participación, ganador.
- **Reseña:** id, cliente, negocio, estrellas, comentario, NPS, fecha, pública/privada.
- **Referido:** id, referidor, referido, código usado, fecha, estado.
- **Notificación:** id, cliente, tipo, contenido, fecha, leída.
- **Cita:** id, cliente, negocio, servicio, fecha y hora, estado.
- **Pago de suscripción:** id, negocio, monto, fecha, método, estado.
- **Anuncio (fase posterior):** id, anunciante, formato, contenido, segmentación, presupuesto, fechas, métricas.
- **QR del negocio:** id, negocio, token criptográfico actual, próxima rotación.

---

## 12. Roadmap de desarrollo

### 12.1 Fase 1 — MVP esencial (mes 1 a 3)

Objetivo: tener algo funcional para 5-10 negocios piloto.

- Registro de cliente y dueño.
- Escaneo del QR del negocio (rotativo + firmado) y registro de visitas.
- App ligera de personal para escanear códigos de canje.
- Beneficios con vencimiento, 8 tipos soportados.
- Modelo Básico (solo visitas).
- Membresías básicas.
- Cupos, pausa, horarios de canje (control de capacidad).
- Plantillas pre-validadas por industria.
- Cliente del mes y top 5 por negocio (versión básica de competencia).
- Sistema básico de referidos.
- Reseñas privadas con estrellas y NPS.
- Recordatorios de vencimiento (3 días, 1 día, mismo día, post-vencimiento).
- Recordatorios de inactividad (7, 14, 30 días).
- Dashboard básico con métricas en tiempo real.
- Gestión de clientes (CRM).
- Notificaciones push.
- QR personalizado con logo.

### 12.2 Fase 2 — Diferenciación (mes 4 a 6)

- Modelo Plus (visitas + monto).
- Gamificación completa: ruleta, rasca, logros expandidos, rifas.
- Sistema de competencia robusto: rankings globales, retos, puntos globales, niveles de Embajador, temporadas.
- Referidos escalonados y top referidores.
- Agenda de citas.
- Campañas manuales segmentadas.
- Analíticas avanzadas y comparativos.
- Exportación de datos.
- Cross-promotion básico entre negocios de la red.
- Geolocalización opcional configurable.
- Cobros automatizados de suscripción.

### 12.3 Fase 3 — Red y monetización adicional (mes 7 a 12)

- Plataforma publicitaria completa (banners, notificaciones patrocinadas, featured, anunciantes externos).
- Reseñas públicas con moderación.
- Multi-sucursal.
- Integración con WhatsApp Business.
- Descubrimiento de negocios cercanos en la app.
- Reportes ejecutivos personalizables.
- Add-ons monetizables: white-label, marketing avanzado.
- Optimizaciones de rendimiento.

### 12.4 Fase 4 — Ecosistema y red social (mes 12+)

- Feed social ligero ("Juan visitó la Barbería X y desbloqueó Centenario").
- Perfiles públicos opcionales de usuarios.
- Compartir logros en redes sociales.
- Alianzas estratégicas y APIs públicas.
- Datos agregados para insights de mercado.

---

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Fraude por escaneo doble | 1 escaneo por cliente por negocio cada 24 hrs + geolocalización opcional |
| Foto del QR compartida remotamente | QR rotativo cada 12-24 hrs + firma criptográfica + geolocalización opcional |
| Canje fraudulento de beneficio | Código de canje temporal de un solo uso, escaneado por personal |
| Dueño configura beneficios irrealistas | Plantillas pre-validadas por industria + límites de cupo/stock + alertas tempranas de saturación |
| Saturación operativa por canjes simultáneos | Cupos, horarios, reserva obligatoria para premium, pausa rápida |
| Bajo onboarding de clientes (no descargan app) | Incentivo de primera visita + WebApp como alternativa (fase 2) + onboarding asistido |
| Reseñas públicas dañinas para negocios | Modelo privado en MVP + moderación cuando se activen públicas + derecho a respuesta |
| Manipulación del ranking (escaneos falsos para liderar) | Validaciones anti-fraude robustas + detección de patrones anómalos + revisión manual de podio |
| Saturación publicitaria que aleje usuarios | Frecuencia limitada + posibilidad de silenciar tipos + análisis de retención post-anuncios |
| Caídas del sistema en horas pico | Arquitectura escalable + monitoreo proactivo + caché |
| Pérdida o filtración de datos personales | Cifrado + backups + auditorías + cumplimiento LFPDPPP estricto |

---

## 14. Consideraciones finales

### 14.1 Lo que define el éxito técnico del MVP

- El cliente puede escanear y ver su visita registrada en menos de 3 segundos.
- El dueño puede configurar su negocio completo en menos de 15 minutos.
- El sistema previene activamente que el dueño cometa errores costosos.
- El canje de beneficios es imposible de falsificar.
- Los rankings y elementos de competencia son confiables y libres de manipulación.
- Ningún negocio pierde clientes o datos por fallas técnicas.

### 14.2 Lo que NO debe incluir el MVP

- Modelo Plus (visitas + monto) — entra en fase 2.
- Geocercas y notificaciones por proximidad.
- Pagos dentro de la app entre cliente y negocio.
- Plataforma publicitaria completa — entra en fase 3.
- Feed social y reseñas públicas — entran en fase posterior.
- WhatsApp Business integrado.
- Integración con punto de venta.
- Soporte multi-idioma.

### 14.3 Decisiones tomadas

| Decisión | Resolución |
| --- | --- |
| Modelo de reseñas en MVP | Privadas (visibles solo al dueño) + NPS. Públicas en fase 3. |
| Mecanismo de registro de visita | Cliente escanea QR del negocio (rotativo y firmado) |
| Mecanismo de canje de beneficio | Personal escanea código temporal del cliente |
| Beneficios por consumo | Sí, opcional, en Modelo Plus (planes superiores) |
| Validación por geolocalización | Opcional, configurable por el dueño |
| Anuncios desde MVP | No. Cross-promotion básico en fase 2, plataforma completa en fase 3 |
| Sistema de competencia en MVP | Versión básica (cliente del mes + top 5). Versión robusta en fase 2 |
| App nativa vs PWA | App **nativa** (React Native) desde el día uno |
| Verificación de número por SMS | No obligatoria por ahora. Registro sin verificar al inicio (se evaluará SMS más adelante) |
| Reseñas públicas | Sí, pero **curadas**: solo se publican las que el dueño elige mostrar (aprobación explícita por reseña) |

### 14.4 Decisiones aún por validar

- ¿Política de retención de datos si un negocio cancela su suscripción?
- ¿Política de propiedad de la base de clientes? (El dueño puede exportarla.)
- ¿Modelo exacto de revenue-sharing en cross-promotion entre negocios?

---

*— Fin del documento —*
