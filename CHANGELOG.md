# Changelog
Historial técnico y cronológico del proyecto.

---

## 📊 Resumen Consolidado de Historias de Usuario (Velocity & Tracking)

> Métricas acumuladas del proyecto basadas en estimaciones por especialidad (UX, Design, Frontend, Backend, QA) en escala Planning Poker / Fibonacci (`0, 1, 2, 3, 5, 8, 10, 13, 20, 40, 70`) con equivalencia **1 Story Point = 1 Hora Ideal de Desarrollo**.

| US ID | Historia de Usuario | Sprint | Estado | UX | Design | Front | Back | QA | Puntos (SP) | Horas Est. |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **US-01** | Setup Inicial, Infraestructura, Supabase DDL & RLS | Sprint 1 | ✅ Done | 1 | 3 | 5 | 20 | 3 | **32 pts** | 32 h |
| **US-02** | Autenticación, Route Guard, Login Zod y Shell Admin | Sprint 1 | ✅ Done | 3 | 3 | 8 | 8 | 3 | **25 pts** | 25 h |
| **US-03** | Maestro de Flota y Choferes (useDrivers, useTransports, ADR-05 5m) | Sprint 2 | ✅ Done | 5 | 5 | 13 | 10 | 3 | **36 pts** | 36 h |
| **US-04** | Maestro de Recintos y Sedes (useVenues, ADR-05 TTL 30m, Maps) | Sprint 2 | ✅ Done | 3 | 3 | 8 | 8 | 3 | **25 pts** | 25 h |
| **US-05** | Creación, Publicación de Viajes y Tarifas (Events & Package Tiers) | Sprint 2 | ✅ Done | 8 | 5 | 13 | 13 | 5 | **44 pts** | 44 h |
| **US-06** | Gestión Integral de Edición: QuickPriceModal (<10s) & Edición Completa | Sprint 2 | ✅ Done | 5 | 3 | 13 | 10 | 5 | **36 pts** | 36 h |
| **TOTAL** | **Total Acumulado Final Sprint 2 (US-01 a US-06)** | — | **Completado** | **25** | **22** | **60** | **69** | **22** | **198 pts** | **198 h** |

---

## [2026-10-01 16:30] - v0.8.0

### Summary
Implementación completa de la Gestión Integral de Edición de Salidas y Precios (Sprint 2 - US-06): arquitectura de modificación en dos niveles que combina micro-edición de precios ultrarrápida (`QuickPriceModal.vue`) en menos de 10 segundos directamente desde la grilla operativa, y macro-edición en la ruta `/admin/viajes/[id]/editar.vue` para modificación integral de los 4 pasos del viaje (espectáculo, recinto, flota, chofer, políticas y tarifas); extensión de `useEvents` con métodos atómicos `updatePackageTiers`, `fetchEventById` y orquestador transaccional `updateEventWithTiers` con reconciliación en cascada de `package_tiers` (insert, update, delete) y sincronización reactiva in-place de la memoria global ADR-05.

### Changes
- **Backend / Composables:**
  - Se extendió [`app/composables/useEvents.ts`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/composables/useEvents.ts) con:
    - `fetchEventById(id)`: resolución instantánea a 0 ms desde la caché reactiva en memoria con fallback a Supabase.
    - `updatePackageTiers(eventId, tiers)`: actualización atómica de precios, disponibilidad y preventa por lote en `package_tiers` con mutación reactiva in-place.
    - `updateEventWithTiers(eventId, eventPayload, tiersPayload)`: orquestador transaccional que actualiza el evento y reconcilia de forma inteligente las opciones de paquetes (detecta nuevos tiers, actualiza existentes y elimina los descartados por el operador), re-consultando y actualizando la entidad en caché.
- **Frontend / Componentes:**
  - Se creó el componente [`app/components/QuickPriceModal.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/components/QuickPriceModal.vue): modal reactivo con presets de ajuste rápido (`-$1k`, `+$1k`, `+$5k`), inputs numéricos formateados en ARS, toggles de disponibilidad y preventa, atajo `Enter` para guardar y confirmación en menos de 10 segundos.
  - Se implementó la vista dinámica [`app/pages/admin/viajes/[id]/editar.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/viajes/[id]/editar.vue): precarga hidratada del viaje y sus 4 pasos, consumo reactivo de recintos y transportes en memoria, repeater dinámico de tarifas, banners de estado y validación Zod con `eventFormSchema`.
  - Se integraron los disparadores en [`app/pages/admin/viajes/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/viajes/index.vue): botón directo en la columna de tarifas (`i-heroicons-banknotes`) para abrir el `QuickPriceModal` y botón de edición completa (`i-heroicons-pencil-square`) en la columna de acciones.
- **Calidad & Compilación:**
  - Compilación verificada en Nuxt 4 (`npm run build`) con código de salida 0.

---

## [2026-10-01 11:30] - v0.7.0

### Summary
Implementación completa del módulo de Gestión y Publicación de Salidas y Viajes (Sprint 2 - US-05): creación del composable `useEvents` bajo arquitectura ADR-05 con consultas relacionales hacia recintos, flota con choferes y tarifas; diseño de tipos compuestos `EventWithRelations`; asistente de publicación multi-bloque en `/admin/viajes/nuevo` con selector instantáneo de recintos y transportes en caché; repetidor reactivo de opciones de paquetes (`package_tiers`); generador algorítmico de slugs canónicos; tablero administrativo en `/admin/viajes` con cálculo dinámico de KPIs de salidas y selector ágil de estado operativo.

### Changes
- **Backend / Composables:**
  - Se creó `app/composables/useEvents.ts` implementando el estándar ADR-05 (`tripu-events-data`, `tripu-events-timestamp`, `tripu-events-loading`) con TTL de 5 minutos, consultas relacionales consolidadas (`select('*, venue:venues(*), transport:transports(*, driver:drivers(*)), package_tiers(*)')`), métodos `createEventWithTiers` (inserción atómica evento + tarifas), `updateEvent`, `updateEventStatus`, `deleteEvent` y purga `clearEventsState()`.
  - Se registró `useEvents().clearEventsState()` en el hook `handleLogout()` de `app/layouts/admin.vue`.
- **Tipado, Validación & Utilidades:**
  - Se definió el tipo `EventWithRelations` y los esquemas Zod `eventFormSchema` y `packageTierSchema`.
  - Se implementó la función algorítmica `generateSlug(artist, venueName, date)` que normaliza diacríticos y genera URLs amigables canónicas en tiempo real.
- **Frontend / Vistas Operativas:**
  - Se implementó el tablero de salidas [`app/pages/admin/viajes/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/viajes/index.vue) con tarjetas de KPIs (salidas activas, cupos en calle, borradores, sold out), filtros por estado (`published`, `draft`, `sold_out`, `completed`), buscador predictivo, tabla en Dark Mode con rango de precios y selector rápido de estado en 1 clic.
  - Se implementó el asistente de publicación [`app/pages/admin/viajes/nuevo.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/viajes/nuevo.vue) estructurado en 4 bloques: Show y Recinto (consumo de `useVenues` en memoria), Logística y Flota (consumo de `useTransports` en memoria con plazas y chofer), Gestor dinámico de tarifas (`package_tiers` Repeater con precios en ARS, switch de entradas y preventas), y Flyer promocional con previsualización.
- **Calidad & Compilación:**
  - Compilación exitosa en Nuxt 4 (`npm run build`) con código de salida 0.

---

## [2026-09-30 11:00] - v0.6.0

### Summary
Implementación completa del Maestro de Recintos y Sedes (Sprint 2 - US-04): creación del composable `useVenues` bajo arquitectura de caché en memoria ADR-05 con TTL adaptado a 30 minutos, extensión de tipología y base de datos con los tipos 'predio' y 'complejo' (`venue_type_enum`), interfaz administrativa completa con cálculo dinámico de KPIs de aforo y sedes, buscador predictivo, filtros rápidos por tipología, modal unificado de alta/edición con Zod y presets de aforo, geolocalización directa con Google Maps y confirmación de baja con salvaguarda de integridad referencial.

### Changes
- **Tipado & Base de Datos:**
  - Se extendió el enumerado `venue_type_enum` en `types/database.types.ts`, `app/types/database.types.ts` y `DB/schema.sql` incorporando los nuevos tipos `'predio'` y `'complejo'`.
  - Se agregaron sentencias idempotentes `ALTER TYPE venue_type_enum ADD VALUE IF NOT EXISTS...` en el script DDL de PostgreSQL.
- **Backend / Composables:**
  - Se implementó `app/composables/useVenues.ts` adoptando el estándar ADR-05 (`tripu-venues-data`, `tripu-venues-timestamp`, `tripu-venues-loading`), con un TTL adaptado de **30 minutos** (`CACHE_TTL_MS = 1800000`) para datos maestros físicos de baja volatilidad, mutaciones reactivas locales `O(1)`/`O(N)` ordenadas alfabéticamente y purga `clearVenuesState()`.
  - Se conectó `useVenues().clearVenuesState()` en el manejador `handleLogout()` de `app/layouts/admin.vue`.
- **Frontend / Vistas & Modales:**
  - Se implementó la vista operativa [`app/pages/admin/recintos/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/recintos/index.vue) con:
    - Tarjetas superiores de KPIs: Total de Recintos, Aforo Global acumulado (formateado en es-AR), Ciudades Sedes activas y Recintos de Gran Escala.
    - Motor de búsqueda reactiva predictiva por nombre, localidad y dirección.
    - Filtros ágiles de categorías por tipología (`Estadio`, `Arena`, `Predio`, `Complejo`, `Campo`, `Club`, etc.).
    - Tabla catálogo en Dark Mode con renderizado condicional de imágenes y fallback iconográfico temático.
    - Integración directa con Google Maps (`google_maps_url` o búsqueda automática por coordenadas/nombre).
    - Modal de Alta / Edición de Recintos con validación Zod (`venueSchema`), presets ágiles de aforo (1.5k a 85k pax) y previsualización de imágenes.
    - Modal de Baja con advertencia explícita de integridad referencial sobre eventos asociados.
- **Seguridad & Validación de URLs:**
  - Se blindó `google_maps_url` mediante un validador de dominios estrictos que admite únicamente URLs oficiales de Google Maps (`maps.app.goo.gl`, `maps.google.com`, `google.com/maps` y variantes regionales), rechazando dominios externos o esquemas maliciosos.
  - Se forzó el protocolo web seguro (`HTTP`/`HTTPS`) en la URL de imágenes de recintos, descartando esquemas inseguros (`javascript:`, `data:`, `file:`).
- **Calidad & Compilación:**
  - Compilación verificada exitosamente en Nuxt 4 (`npm run build`) con código de salida 0.

---

## [2026-09-29 17:00] - v0.5.2

### Summary
Formalización del estándar arquitectónico de Gestión de Estado (State Management) y aprobación de ADR-05 en `ARCHITECTURE.md`, estableciendo como precedente obligatorio el patrón de Caché Global en Memoria con `useState`, TTL de 5 minutos, deduplicación y bypass forzado para todos los composables de dominio presentes y futuros.

### Architecture
- Se formalizó en la Sección 19 de [`ARCHITECTURE.md`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/ARCHITECTURE.md) el estándar obligatorio de 5 pilares para composables de datos (`useDrivers`, `useTransports`, `useVenues`, `useEvents`, etc.).
- Se aprobó **ADR-05: Caché Global en Memoria con useState y TTL como Estándar de Gestión de Estado** en la Sección 26, fundamentado en la premisa operativa de concurrencia acotada ($\le 3$ operadores simultáneos), priorizando la navegación instantánea a 0 ms, la reutilización cruzada de entidades y la reducción radical de consultas a Supabase BaaS.

---

## [2026-09-29 16:35] - v0.5.1

### Summary
Implementación de arquitectura de Caché Global en memoria con `useState`, Time-To-Live (TTL de 5 minutos), deduplicación de peticiones concurrentes y purga segura al cerrar sesión en los composables `useDrivers` y `useTransports`.

### Changes
- Se actualizó [`app/composables/useDrivers.ts`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/composables/useDrivers.ts) adoptando `useState` para el almacenamiento reactivo global (`tripu-drivers-data`, `tripu-drivers-timestamp`, `tripu-drivers-loading`). Se implementó verificación de validez de caché con TTL de 5 minutos (`CACHE_TTL_MS`), soporte para recarga forzada `fetchDrivers({ force: true })`, método `invalidateCache()` y método de purga `clearDriversState()`.
- Se actualizó [`app/composables/useTransports.ts`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/composables/useTransports.ts) aplicando simétricamente el patrón de caché global con `useState` (`tripu-transports-data`, `tripu-transports-timestamp`, `tripu-transports-loading`), TTL de 5 minutos, recarga forzada `{ force: true }`, `invalidateCache()` y `clearTransportsState()`.
- Se añadieron botones de sincronización manual forzada (icono `i-heroicons-arrow-path`) y actualización de reintentos en [`app/pages/admin/choferes/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/choferes/index.vue) y [`app/pages/admin/transportes/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/transportes/index.vue).
- Se actualizó [`app/layouts/admin.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/layouts/admin.vue) invocando `clearDriversState()` y `clearTransportsState()` en la purga incondicional de logout, garantizando la privacidad de datos de negocio en memoria en dispositivos compartidos.

### Performance & UX
- Tiempo de respuesta inmediato de 0 ms y 0 peticiones de red redundantes al navegar entre las vistas de Choferes y Transportes dentro de la ventana de validez del TTL.
- Sincronización automática del dropdown de choferes en la vista de flota ante altas o modificaciones de choferes sin requerir consultas de red adicionales.

---

## [2026-09-29 12:25] - v0.5.0

### Summary
Implementación completa del Maestro de Flota y Choferes (Sprint 2 - US-03): creación de composables `useDrivers` y `useTransports`, interfaces administrativas con CRUD completo, validación de formularios con Zod, modales reactivos, búsqueda en tiempo real, presets de capacidad y vinculación relacional entre vehículos y choferes.

### Changes
- Se creó `app/composables/useDrivers.ts`: composable reactivo fuertemente tipado (`Database['public']['Tables']['drivers']`) que expone métodos para listar, crear, editar y eliminar choferes con manejo de errores y estados de carga.
- Se creó `app/composables/useTransports.ts`: composable reactivo tipado para la gestión de flota con join relacional hacia choferes (`driver:drivers(id, name, lastname, cellphone)`), permitiendo resolver datos de contacto en una única consulta.
- Se implementó la vista administrativa [`app/pages/admin/choferes/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/choferes/index.vue) con tarjetas de métricas (total choferes, empresas aliadas), barra de búsqueda en vivo, tabla Dark Mode, badges de licencias CNRT, enlaces directos a WhatsApp, modal reactivo de alta/edición y modal de confirmación de eliminación con advertencia de integridad referencial.
- Se implementó la vista administrativa [`app/pages/admin/transportes/index.vue`](file:///C:/Users/USUARIO/Desktop/myself/PROJECTS/tripusystem/GIT_REPO/event-system/app/pages/admin/transportes/index.vue) con tarjetas de KPIs (total flota, plazas totales disponibles, desglose de combis vs micros), filtros rápidos por tipo de unidad, buscador en vivo, presets de capacidad ágil (19, 24, 45, 56, 60 pax), selector de chofer asignado y modal de confirmación de baja de unidad.

### Frontend
- Componentes y vistas creados:
  - `app/composables/useDrivers.ts`
  - `app/composables/useTransports.ts`
  - `app/pages/admin/choferes/index.vue`
  - `app/pages/admin/transportes/index.vue`
- Cumplimiento de tokens de diseño Dark Mode (`#0F0F12`, `#1A1A22`, `#E53924`, `#F5EEDC`, `#2A2A38`).

---

## [2026-09-29 11:55] - v0.4.3

### Summary
Normalización de entrada de correo electrónico en pantalla de login, configuración explícita de opciones de persistencia segura de cookies en el módulo Supabase e inyección de cabeceras HTTP de seguridad global (HSTS, nosniff, DENY, Referrer-Policy) en la configuración de Nuxt.

### Changes
- Se actualizó `app/pages/admin/login.vue` aplicando `.trim().toLowerCase()` al correo electrónico ingresado antes de enviarlo a `supabase.auth.signInWithPassword()`, preservando la contraseña intacta sin alterar espacios intencionales y manteniendo la granularidad de los mensajes de error de autenticación.
- Se configuró la sección `supabase.cookieOptions` en `nuxt.config.ts` estableciendo nombre de cookie (`sb`), tiempo de vida de 8 horas (`lifetime: 28800`), atributo `sameSite: 'lax'` y bandera `secure` condicionada a entornos de producción.
- Se agregaron reglas globales de cabeceras de seguridad (`routeRules`) en `nuxt.config.ts`: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.

### Security
- Blindaje del transporte de sesión contra ataques de clickjacking (`X-Frame-Options: DENY`), sniffing de tipos MIME (`nosniff`) y forzado de conexiones cifradas (`HSTS`).
- Garantía de persistencia de tokens de acceso y refresco en cookies seguras en lugar de almacenamiento vulnerable en `localStorage`.

---

## [2026-09-29 11:15] - v0.4.2

### Summary
Implementación del patrón de cierre de sesión resiliente (Resilient Logout) en `app/layouts/admin.vue`, garantizando la destrucción incondicional del estado local de autenticación, notificación no bloqueante al operador y redirección segura a la vista de login aún ante fallas remotas o desconexiones de red con Supabase.

### Changes
- Se actualizó la función `handleLogout()` en `app/layouts/admin.vue` adoptando un bloque `try / catch / finally` resiliente.
- Se implementó degradación elegante: si `supabase.auth.signOut()` falla por timeout, error HTTP 500 de Supabase o corte de conectividad, se captura el error y se emite una advertencia de consola sin interrumpir el flujo.
- En el bloque `finally`, se purga reactivamente la sesión del cliente (`user.value = null`), se restablece el indicador `:loading` y se asegura la redirección hacia `/admin/login` mediante `navigateTo()`.
- Se añadieron notificaciones toast contextuales (`toast.add`) diferenciando cierre exitoso sincronizado (`color: success`) de cierre local forzado por pérdida de red (`color: warning`), protegiendo la privacidad en terminales compartidas.

### Architecture
- Se resolvió la limitación de manejo de errores de logout: `createError({ fatal: true })` o `showError()` provocarían un bloqueo destructivo con pantalla de error 500 innecesaria, mientras que `sendError()` es una utilidad exclusiva del contexto H3 en servidor Nitro. El patrón de cierre resiliente garantiza la invariante de seguridad: un operador que presione "Cerrar Sesión" nunca quedará atrapado en el panel administrativo.

---

## [2026-09-28 18:10] - v0.4.1

### Summary
Corrección de inyección de estilos de Nuxt UI y Tailwind CSS, activación de layouts en la aplicación mediante `<NuxtLayout>`, instalación de colección local de iconos Heroicons y creación de vistas placeholder para las rutas del menú administrativo.

### Changes
- Se creó `app/assets/css/main.css` con las directivas `@import "tailwindcss";` y `@import "@nuxt/ui";` requeridas por Nuxt UI v4, vinculándolo en `nuxt.config.ts` mediante `css: ['~/assets/css/main.css']`.
- Se actualizó `app/app.vue` envolviendo `<NuxtPage />` dentro del componente `<NuxtLayout>`, permitiendo el renderizado efectivo de `app/layouts/admin.vue` y visualización del botón de cierre de sesión.
- Se instaló la dependencia `tailwindcss` y la colección de iconos `@iconify-json/heroicons` para soporte offline/local de iconos en Nuxt Icon.
- Se crearon las páginas placeholder para las rutas del panel administrativo (`/admin/viajes`, `/admin/viajes/nuevo`, `/admin/transportes`, `/admin/choferes`, `/admin/recintos`, `/admin/mensajes`) eliminando las advertencias `[VUE_ROUTER_R0004]`.

### Dependencies
- Se instaló `tailwindcss`.
- Se instaló `@iconify-json/heroicons`.

### Bug Fixes
- Se corrigió la falta de estilos (pantalla HTML en blanco y negro sin colores) provocada por la ausencia del archivo CSS principal de Nuxt UI.
- Se corrigió la advertencia `[NUXT_E4007]` y la no visualización de la barra de navegación y el botón de logout debido a la ausencia de `<NuxtLayout>` en `app.vue`.
- Se corrigieron las advertencias de rutas inexistentes en el router de Vue (`VUE_ROUTER_R0004`).

---

## [2026-09-28 17:35] - v0.4.0

### Summary
Implementación de la infraestructura de autenticación de operadores, protección de rutas administrativas mediante middleware, pantalla de inicio de sesión con validación Zod y shell administrativo con dashboard de métricas operativas (Sprint 1 - US-02).

### Changes
- Creación de middleware de autenticación `app/middleware/auth.ts` para restringir el acceso a rutas `/admin/*` y gestionar redirecciones según la presencia de sesión activa en Supabase Auth.
- Creación de la vista de login para operadores en `app/pages/admin/login.vue` con componentes Nuxt UI, formulario validado con Zod, feedback visual de errores (`UAlert`, `useToast`) e integración con `supabase.auth.signInWithPassword()`.
- Creación del layout administrativo `app/layouts/admin.vue` con barra superior institucional, navegación interna por módulos, indicador visual de sesión del operador y acción de logout (`supabase.auth.signOut()`).
- Creación del dashboard protegido `app/pages/admin/index.vue` con saludo dinámico al operador autenticado, tarjetas de métricas en tiempo real con recuentos exactos (`events`, `transports`, `drivers`, `venues`) y verificación del estado de la infraestructura.

### Frontend
- Componentes creados y validados:
  - `app/middleware/auth.ts`: Route guard con preservación de parámetro `redirect` en URL.
  - `app/pages/admin/login.vue`: Card con paleta Dark Mode (`#0F0F12`, `#1A1A22`, `#E53924`, `#F5EEDC`), estados de carga `:loading` y validación tipada.
  - `app/layouts/admin.vue`: Shell de operador con menú responsivo para escritorio y móvil.
  - `app/pages/admin/index.vue`: Dashboard administrativo con grid reactiva y llamadas asíncronas vía cliente tipado `useSupabaseClient<Database>()`.
- Verificación de compilación limpia de la suite completa mediante `npm run build` con código de salida 0.

### Architecture
- Se hace efectivo el límite arquitectónico (boundary) entre la navegación pública anónima y el panel de administración protegido bajo `/admin/*`.
- La autorización de acceso a las vistas de administración ahora se encuentra controlada por el middleware de navegación en cliente y servidor, mientras que las mutaciones sobre datos permanecen protegidas por Row Level Security (RLS) en PostgreSQL.

---

## [2026-09-28 12:25] - v0.3.1

### Summary
Creación del documento maestro de arquitectura técnica `ARCHITECTURE.md` estructurado en 28 secciones técnicas oficiales, con diagramas Mermaid de producto, secuencia, dominio y base de datos, reflejando el estado real del código y la infraestructura.

### Changes
- Creación de `ARCHITECTURE.md` en la raíz del proyecto, en el repositorio Git `event-system` y en el espacio de trabajo.
- Formalización de 4 Architectural Decision Records (ADRs): Nuxt 4, Supabase BaaS, RLS como autorización primaria y conversión comercial por WhatsApp.
- Documentación detallada de límites arquitectónicos entre la plataforma pública anónima y el panel de administración protegido.
- Mapeo exhaustivo de componentes existentes y especificación de áreas pendientes de implementación (tests automatizados, observabilidad formal).

### Architecture
- Documentación técnica exhaustiva que cubre los 28 ejes arquitectónicos obligatorios: Overview, Product Architecture, Technology Stack, System Architecture, Application Structure, Frontend Architecture, Public Platform, Admin Platform, Domain Architecture, Data Architecture, Database Architecture, Supabase Architecture, Authentication & Authorization, Row Level Security, Storage Architecture, Validation, API & Data Access, SEO Architecture, State Management, Error Handling, Testing Strategy, Configuration & Environment, Security, Deployment & Infrastructure, Observability, Architectural Decisions, Known Constraints y Future Considerations.

---

## [2026-09-28 12:00] - v0.3.0

### Summary
Ampliación integral del esquema de base de datos con jerarquía de usuarios operativos (`users`), gestión de choferes (`drivers`), enriquecimiento de recintos (`venues`) y paquetes (`package_tiers`), sincronización de documentación técnica y generación de tipos TypeScript para Nuxt 4 / Supabase.

### Changes
- Se incorporó la jerarquía de operadores internos para control de acceso y coordinación de salidas.
- Se desacopló la entidad de choferes de la flota de transportes para permitir reutilización y trazabilidad de licencias profesionales.
- Se añadieron especificaciones de tipología arquitectónica y capacidad oficial a los recintos.
- Se agregaron opciones de métodos de pago y bandera de preventa temprana (`early_bird`) a los paquetes de viaje.
- Se generaron las definiciones de tipos TypeScript para Supabase en el directorio de la aplicación Nuxt 4 (`app/types/database.types.ts`).

### Database
- **Nueva tabla `public.users`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `updated_at`: `timestamptz` (not null, default `now()`).
  - `name`: `text` (not null).
  - `lastname`: `text` (not null).
  - `username`: `text` (unique, not null).
  - `email`: `text` (unique, not null).
  - `daybirth`: `date` (nullable).
  - `password`: `text` (nullable).
  - `is_active`: `boolean` (not null, default `true`).
  - `user_type`: Enum `user_type_enum` (not null, default `'COORDINADOR'`).
  - `level`: `integer` (not null, default `3`).
  - Constraint `check_user_level`: Valida correspondencia unívoca entre rol y nivel:
    - `'MASTER'` $\rightarrow$ `0`
    - `'CHIEF_TRIPU'` $\rightarrow$ `1`
    - `'JEFE'` $\rightarrow$ `2`
    - `'COORDINADOR'` $\rightarrow$ `3`
    - `'MARINERO'` $\rightarrow$ `10`
    - `'PASAJERO'` $\rightarrow$ `100`
- **Nuevo enum `user_type_enum`:** Valores `'MASTER'`, `'CHIEF_TRIPU'`, `'JEFE'`, `'COORDINADOR'`, `'MARINERO'`, `'PASAJERO'`.
- **Nueva tabla `public.drivers`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `name`: `text` (not null).
  - `lastname`: `text` (not null).
  - `phone`: `text` (nullable).
  - `cellphone`: `text` (nullable).
  - `licence`: `text` (nullable).
  - `company`: `text` (nullable).
  - `notes`: `text` (nullable).
- **Nuevo enum `venue_type_enum`:** Valores `'estadio'`, `'campo'`, `'arena'`, `'club'`, `'sala'`, `'estudio'`, `'boliche'`, `'bar'`, `'sitio_publico'`, `'edificio'`.
- **Modificaciones en tabla `public.transports`:**
  - Se agregó columna `driver_id`: UUID nullable con clave foránea `references public.drivers(id) ON DELETE SET NULL`.
- **Modificaciones en tabla `public.venues`:**
  - Se agregó columna `capacity`: `integer` (not null, default `0`).
  - Se agregó columna `tipo`: Enum `venue_type_enum` (not null, default `'club'`).
  - Se agregó columna `image`: `text` (nullable).
- **Modificaciones en tabla `public.events`:**
  - Se agregó columna `coordinator_id`: UUID nullable con clave foránea `references public.users(id) ON DELETE SET NULL`.
- **Modificaciones en tabla `public.package_tiers`:**
  - Se agregó columna `early_bird`: `boolean` (not null, default `false`).
  - Se agregó columna `payment_methods`: `text` (not null, default `'efectivo, transferencia, cuotas, tarjeta'`).
- **Seguridad y RLS (Row Level Security):**
  - RLS activado en `public.users` y `public.drivers`.
  - Política `"Operadores controlan usuarios"`: acceso completo (`all`) para rol `authenticated`.
  - Política `"Operadores controlan choferes"`: acceso completo (`all`) para rol `authenticated`.

### Frontend
- Se creó el archivo de tipado estricto `app/types/database.types.ts` y réplica en `types/database.types.ts` mapeando las 7 tablas del esquema, sus tipos de retorno (`Row`), inserción (`Insert`), actualización (`Update`) y enums asociados (`UserTypeEnum`, `VenueTypeEnum`, `EventStatusEnum`).
- Verificación de compilación limpia de la suite Nuxt con `npm run build`, asegurando que `@nuxtjs/supabase` consuma las definiciones de esquema sin advertencias en consola.

### Architecture
- Desacoplamiento de datos operativos: el chofer pasa de ser un campo de texto plano dentro de la unidad vehicular a una entidad relacional independiente `drivers`, permitiendo gestionar datos de licencias, contacto de guardia y empresa transportista.
- Jerarquía de usuarios cerrada: se formaliza que los únicos usuarios con credenciales de acceso al backend son el equipo interno de Tripu, mientras que los pasajeros se mantienen con rol `PASAJERO (nivel 100)` para consultas anónimas en el portal público.

### Notes
- Los scripts actualizados de creación de base de datos se encuentran consolidados en `DB/schema.sql` listos para su ejecución en el SQL Editor de Supabase Cloud.
- Se actualizaron en concordancia los diagramas de entidad-relación en `DOCS/DER.md` y `programming/DER.md`, la especificación funcional en `context/01_REQUISITOS_SOFTWARE.md`, el backlog ágil en `context/02_TRELLO_TAIGA.md`, el documento de planificación en `Sprints - Descripción y estimación.md` y el consolidado `ENTREGABLE.md`.

---

## [2026-09-28 11:45] - v0.2.0

### Summary
Diseño y formalización del Modelo Entidad-Relación (DER) inicial, generación del script DDL PostgreSQL consolidado para Supabase Cloud y definición de políticas de seguridad Row Level Security (RLS).

### Changes
- Creación de la arquitectura de datos relacional para soportar catálogo de viajes, gestión de flota, recintos y recepción de consultas.
- Formalización de diagramas relacionales Mermaid en formato visual y textual.
- Creación del script DDL fundacional en `DB/schema.sql`.

### Database
- Extensión `pgcrypto` activada para soporte de identificadores universales únicos (`gen_random_uuid()`).
- **Enum `event_status_enum`:** Valores `'draft'`, `'published'`, `'sold_out'`, `'completed'`.
- **Tabla `public.venues`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `name`: `text` (not null).
  - `city`: `text` (not null).
  - `address`: `text` (nullable).
  - `google_maps_url`: `text` (nullable).
- **Tabla `public.transports`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `name`: `text` (not null).
  - `vehicle_type`: `text` (not null).
  - `capacity`: `integer` (not null, default `19`).
  - `origin`: `text` (not null).
  - `phone`: `text` (nullable).
  - `cellphone`: `text` (nullable).
  - `license_plate`: `text` (nullable).
  - `notes`: `text` (nullable).
- **Tabla `public.events`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `updated_at`: `timestamptz` (not null, default `now()`).
  - `venue_id`: UUID nullable (FK `references public.venues(id) ON DELETE SET NULL`).
  - `transport_id`: UUID nullable (FK `references public.transports(id) ON DELETE SET NULL`).
  - `title`: `text` (not null).
  - `slug`: `text` (unique, not null).
  - `artist_headliner`: `text` (not null).
  - `event_date`: `timestamptz` (not null).
  - `departure_time`: `timestamptz` (not null).
  - `departure_location`: `text` (not null).
  - `return_policy`: `text` (default `'Regreso 45 minutos finalizado el show'`).
  - `includes_summary`: `text` (nullable).
  - `full_itinerary`: `text` (nullable).
  - `image_url`: `text` (nullable).
  - `status`: Enum `event_status_enum` (not null, default `'published'`).
  - `is_featured`: `boolean` (not null, default `false`).
- **Tabla `public.package_tiers`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `event_id`: UUID not null (FK `references public.events(id) ON DELETE CASCADE`).
  - `name`: `text` (not null).
  - `includes_ticket`: `boolean` (not null, default `false`).
  - `price`: `numeric(10, 2)` (not null, default `0.00`).
  - `currency`: `varchar(10)` (not null, default `'ARS'`).
  - `is_available`: `boolean` (not null, default `true`).
- **Tabla `public.contact_messages`:**
  - `id`: UUID (Primary Key, default `gen_random_uuid()`).
  - `created_at`: `timestamptz` (not null, default `now()`).
  - `name`: `text` (not null).
  - `email`: `text` (not null).
  - `phone`: `text` (nullable).
  - `selected_event`: `text` (nullable).
  - `message`: `text` (not null).
  - `status`: `text` (not null, default `'pending'`).
- **Políticas Row Level Security (RLS):**
  - RLS activado en todas las tablas mediante `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
  - Acceso anónimo (`anon`): Lectura permitida en `venues` (completa), `events` (solo si `status = 'published'`), `package_tiers` (solo si `is_available = true`) e inserción permitida en `contact_messages`.
  - Acceso autenticado (`authenticated`): Control total (`all`) sobre todas las entidades del esquema.

### Architecture
- Enfoque de seguridad por capas: el motor de base de datos bloquea cualquier intento de escritura por parte de clientes anónimos mediante RLS, reservando las operaciones mutables a usuarios autenticados.
- Relación de paquetes con eliminación en cascada (`ON DELETE CASCADE`) para garantizar integridad referencial al eliminar un evento.

---

## [2026-09-28 11:15] - v0.1.0

### Summary
Inicialización del proyecto web Nuxt 4 (`event-system`) dentro del repositorio Git local, instalación y configuración del ecosistema de dependencias base y definición de estructura inicial.

### Changes
- Inicialización del proyecto Nuxt en `C:\Users\USUARIO\Desktop\myself\PROJECTS\tripusystem\GIT_REPO\event-system`.
- Configuración de arquitectura de carpetas Nuxt 4 con directorio raíz de aplicación `app/`.
- Configuración de paleta de colores oficial Dark Mode basada en isotipo Tripu (`#E53924`, `#F5EEDC`, `#0F0F12`).
- Creación de archivos de entorno y directivas de motores de búsqueda.

### Frontend
- Creación de `app/app.vue` como wrapper raíz con proveedor `<UApp>`.
- Creación de `app/pages/index.vue` con prueba visual de componentes Nuxt UI, badges de estado y verificación de estilos.

### Dependencies
- Se agregaron las siguientes dependencias principales (`package.json`):
  - `nuxt`: `^4.5.2`
  - `vue`: `^3.5.43`
  - `@nuxt/ui`: `^4.11.2` (con Tailwind CSS y Nuxt Icon integrados)
  - `@nuxtjs/supabase`: `^2.0.10`
  - `@nuxtjs/sitemap`: `^8.5.1`
  - `zod`: `^4.6.5`

### Configuration
- `nuxt.config.ts`: Configurado con módulos `@nuxt/ui`, `@nuxtjs/supabase`, `@nuxtjs/sitemap`. Parámetro `supabase.redirect: false` establecido explícitamente para permitir la exploración pública del catálogo sin redirección involuntaria al login.
- `.env.example` y `.env`: Plantilla de variables con `SUPABASE_URL`, `SUPABASE_KEY`, `RESEND_API_KEY`, teléfono de WhatsApp institucional y URL del sitio.
- `public/robots.txt`: Directivas de rastreo permitiendo indexación en rutas públicas y denegando `/admin/*` y `/server/api/*`.
- `README.md`: Documentación técnica del proyecto, comandos de ejecución (`npm run dev`, `npm run build`) y mapa de tecnologías.

### Notes
- Primera compilación de verificación ejecutada con `npm run build` concluyendo exitosamente (código de salida 0).
