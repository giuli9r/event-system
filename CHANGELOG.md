# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-07
### Añadido
* **US-12: Hardening de Seguridad (RLS) y Accesibilidad Universal WCAG 2.1 AA:**
  * Reglas CSS universales para `:focus-visible` con anillo perimetral Rojo Tripu (`#E53924`, 2px con offset de 2px).
  * Soporte integral para preferencias de movimiento reducido `@media (prefers-reduced-motion: reduce)` anulando rotaciones continuas (`.animate-devtools-spin`) y levitaciones (`.animate-suspension`).
  * Enriquecimiento de accesibilidad y navegación por teclado en `EventCard.vue` (roles semánticos, `tabindex`, soporte de eventos Enter/Space y etiquetas `aria-label`).
  * Accesibilidad semántica en formulario de contacto (`app/pages/contacto.vue`) y menús de navegación (`app/layouts/default.vue`).
  * Auditoría integral de políticas Row Level Security (RLS) en PostgreSQL: actualización de la política de `public.events` para permitir consulta pública de estados `['published', 'sold_out']` preservando el aislamiento estricto de tablas sensibles (`customers`, `users`, `drivers`).
* **US-13: SEO Técnico, Sitemap Dinámico, Páginas Legales y Error Handling:**
  * Proveedor dinámico de sitemap en `server/api/__sitemap__/urls.ts` que indexa automáticamente todas las fichas de viaje `/viajes/[slug]` publicadas y agotadas con `lastmod`, `changefreq` y prioridad SEO.
  * Configuración oficial de `@nuxtjs/sitemap` en `nuxt.config.ts`.
  * Páginas legales responsive y accesibles en Dark Mode: `app/pages/terminos-y-condiciones.vue` y `app/pages/politica-de-privacidad.vue` (bajo marco de la Ley N° 25.326).
  * Página de error personalizada `app/error.vue` con diseño Dark Mode adaptativo para errores 404 (viaje/ruta no encontrada) y 500 (falla interna), con botones de rescate y navegación.
  * Inclusión de enlaces legales y acceso a atención al cliente en el pie de página (`app/layouts/default.vue`).
  * Compilación y build de producción validado al 100% libre de errores (`npm run build`).

---

## [0.11.0] - 2026-10-07
### Añadido
* **US-11: Motor y Formulario de Contacto + Bandeja Administrativa:**
  * Esquema Zod en `shared/schemas/contact.ts` con sanitización estricta de cadenas (limpieza de HTML y caracteres de control) y honeypot antispam.
  * Endpoint Nitro seguro en `server/api/contact.post.ts` con persistencia en `contact_messages` de PostgreSQL y despacho resiliente de correos vía Resend (`RESEND_API_KEY`).
  * Página pública accesible `app/pages/contacto.vue` con estética Dark Mode, estados de envío/confirmación y alternativa directa hacia WhatsApp (`#25D366`).
  * Composable `useContactMessages.ts` con caché reactiva (TTL 2 minutos) y métodos de actualización de estados.
  * Módulo administrativo completo en `app/pages/admin/mensajes/index.vue` con buscador en tiempo real, filtros por estado (*nuevo*, *leído*, *respondido*, *archivado*), visor modal de consulta y respuesta ágil vía WhatsApp/Email.
  * Actualización de la barra de navegación pública (`app/layouts/default.vue`) con enlace directo a `/contacto`.

### Modificado
* **Navegación de Ficha de Viaje en la Misma Pestaña:**
  * Modificación de `EventCard.vue` (`navigateTo`) y `FeaturedCarousel.vue` (`NuxtLink`) para abrir `/viajes/[slug]` en la misma pestaña del navegador en lugar de forzar nueva ventana (`target="_blank"`), mejorando la fluidez SPA de navegación.

---

## [0.10.0] - 2026-10-07
### Añadido
* **US-09 & US-10: Ficha Detallada de Viaje y Conversión Contextual (`/viajes/[slug]`):**
  * Página dinámica pública `app/pages/viajes/[slug].vue` con Server-Side Rendering (SSR) vía `useAsyncData`.
  * Método `fetchPublicEventBySlug` en `usePublicEvents.ts` con caché global en memoria `useState` y TTL de 1 minuto (ADR-05).
  * Control de errores 404 amigable si la salida no existe o no tiene estado público (`published` o `sold_out`).
  * Cabecera visual con flyer de recital, artista principal, fecha, recinto y punto/horario de encuentro.
  * Desglose completo de itinerario (`full_itinerary`), resumen de servicios incluidos y política de regreso pactada (`return_policy`).
  * Grilla comparativa de tarifas de paquetes y preventas (`package_tiers`).
  * Integración de metadatos dinámicos OpenGraph y Twitter Cards (`useSeoMeta`) para compartir en redes sociales y mensajería.
  * **Navegación forzada en nueva pestaña (`target="_blank"`):** Tanto las tarjetas `EventCard.vue` como el banner `FeaturedCarousel.vue` abren la ficha detallada en una pestaña independiente para conservar el estado de filtros y la posición de scroll en la cartelera principal.
  * Conversión contextual a WhatsApp con mensaje dinámico que incluye nombre de banda, fecha, recinto y paquete seleccionado.
  * Barra de conversión inferior flotante *sticky* para dispositivos móviles.

---

## [0.9.5] - 2026-10-04
### Añadido
* **US-09: Catálogo y Cartelera de Próximos Eventos:** Implementación de la sección `"PRÓXIMOS RECITALES"` basada fielmente en la maqueta visual `PROXIMOS_EVENTOS.png`.
* **Componente `EventCard.vue`:**
  * Proporción vertical estilo póster (4:5) con animación zoom en hover.
  * Tira inferior horizontal fija `"ENTRADAS DISPONIBLES"` con tipografía expandida (`tracking-[0.2em] font-bold text-[#F5EEDC]`).
  * Cartel central `"AGOTADO"` con efecto vidrio esmerilado (`backdrop-blur`), filtro desaturado sobre el flyer y cursor deshabilitado.
  * Jerarquía tipográfica rockera con nombre de headliner en mayúsculas pesadas, fecha en naranja (`#FF6B55`), punto separador en Rojo Tripu (`#E53924`) y ciudad de destino.
  * Tarifa base calculada dinámicamente (`"Desde $XX.XXX"`) y botón de acción directa.
* **Componente `EventFilters.vue`:**
  * Buscador reactivo en vivo por nombre de banda, show o estadio.
  * Selector desplegable de ciudades de destino extraídas automáticamente de los viajes programados.
  * Selector desplegable de meses activos (`YYYY-MM`).
  * Filtro por disponibilidad (*Todos los cupos*, *Solo Disponibles*, *Solo Agotados*).
  * Contador en tiempo real: *"Mostrando X de Y salidas"* y botón interactivo para limpiar filtros.
* **Microinteracción de Scroll con Efecto Glowing:**
  * Botón flotante suspendido centrado en la parte inferior del carrusel con etiqueta `"VER SHOWS"` y animación de levitación continua (`animate-suspension`, 0 a 7px en 2.2s).
  * **Efecto Nuxt DevTools Glow:** Al hacer hover, se activa un aura difusa exterior (`blur-md`) junto con un borde cónico angular giratorio a 360° (`@keyframes devtools-spin`) en la paleta oficial rojo/naranja/marfil.
  * Desplazamiento suave nativo (`scrollIntoView({ behavior: 'smooth' })`) directo a la sección de cartelera.
* **Inhabilitación estricta de salidas agotadas:** Bloqueo preventivo en `<article>` y botón CTA con `:disabled="isSoldOut"`, evitando la apertura de la modal de reservas para viajes sin cupo.

### Modificado
* `usePublicEvents.ts`: Incorporación de `fetchAllPublicEvents()`, motor de filtros computado reactivo (0 ms de latencia), extracción de meses/ciudades y formateador de tarjetas `formatCardDate`.
* `app/pages/index.vue`: Integración de la grilla de 4 columnas en desktop (`xl:grid-cols-4`), skeletons animados de carga y estados de búsqueda vacíos.

---

## [0.9.2] - 2026-10-03
### Añadido
* **US-08: Carrusel / Banner Superior de Eventos Destacados:**
  * Componente `FeaturedCarousel.vue` con soporte multidislide, transiciones suaves y estética nocturna de festival.
  * Doble gradiente scrim: degradé horizontal para respaldar la legibilidad de títulos en blanco/crema a la izquierda y degradé vertical para fundido perfecto con el fondo `#0F0F12`.
  * Badge superior dinámico `"● Salida Confirmada"` con pulso animado y tag de `"Destacado"`.
  * Sello de agua oficial flotante (`logo-tripu-badge-sm.webp`).
  * Autoplay configurable (6.5s) con barra de progreso superior de 2px en `#E53924` y pausa automática en `:hover`.
  * Soporte nativo para gestos táctiles swipe en smartphones (`touchstart`, `touchend`).
  * Controles accesibles: flechas prev/next con backdrop-blur, dots interactivos y contador numérico `01 / 02`.
* **Pipeline de Optimización de Branding (`public/branding/`):**
  * Exportación de logotipos oficiales desde archivos vectoriales a formatos modernos **WebP** y **PNG**.
  * Recorte programático de márgenes transparentes (*bounding boxes*) de los lienzos de 4500×4500 px.
  * Generación de versiones ligeras para web (`-sm`), reduciendo el logo horizontal a solo **34 KB** y el sello a **51 KB**.
* **Layout Público Base (`app/layouts/default.vue`):**
  * Barra de navegación sticky con logo de Tripu, enlaces de anclaje, botón directo a WhatsApp y enlace para operadores.
  * Footer institucional con enlaces rápidos, datos de contacto de San Francisco, Córdoba y redes sociales.
* **Composable `usePublicEvents.ts`:**
  * Consultas públicas reactivas a Supabase para eventos con `is_featured = true` y fechas futuras.
  * Cálculo de tarifas mínimas (`getMinPrice`) y formateadores de moneda argentina (`formatCurrency`) y fechas localizadas (`formatEventDate`).

---

## [0.9.0] - 2026-10-02
### Añadido
* **US-07: Maestro de Clientes y Gestión de Pasajeros:**
  * Nueva entidad relacional `customers` en PostgreSQL con campos: `name`, `lastname`, `dni` (único), `email`, `phone`, `city`, `daybirth`, `emergency_contact`, `instagram`, `notes`, `interests` (formato array serializado `"array:tag1,tag2"`), `is_active`, `created_at`, `updated_at`.
  * Políticas de Row Level Security (RLS) completas para control de operadores autenticados.
  * Composable `useCustomers.ts` implementando el estándar de caché global en memoria (ADR-05) con TTL de 5 minutos, sincronización reactiva local y purga en logout.
  * Vista administrativa `/admin/clientes` con tabla de pasajeros, buscador instantáneo por DNI/nombre/email, filtros por estado y estadísticas clave.
  * Componente `CustomerTagInput.vue` para carga y visualización dinámica de etiquetas de gustos musicales e intereses.
* **Refactorización de Compatibilidad Nuxt UI v3:**
  * Migración de `<UFormGroup>` obsoleto a `<UFormField>`.
  * Reemplazo de componente experimental `<UToggle>` por interruptor accesible con Tailwind CSS.
  * Reemplazo de TanStack `<UTable>` por estructura semántica HTML `<table>` integrada en `<UCard>`, eliminando fallos de resolución de componentes e hidratación.

---

## [0.8.0] - 2026-09-30
### Añadido
* **US-06: Edición Rápida de Tarifas (`QuickPriceModal.vue`):**
  * Modal de actualización instantánea de precios para viajes existentes sin recargar el formulario completo.
  * Soporte para modificar precio numérico, disponibilidad (`is_available`) y switch de preventa (`early_bird`).
  * Método `updatePackageTiers` en `useEvents.ts` con mutación reactiva a 0 ms en memoria.

---

## [0.7.0] - 2026-09-28
### Añadido
* **US-05: Módulo de Publicación y Edición de Viajes:**
  * Tablero operativo `/admin/viajes` con métricas de viajes en calle, cupos totales y filtros por estado operativo (`draft`, `published`, `sold_out`, `completed`).
  * Asistente multi-bloque `/admin/viajes/nuevo` para calendarizar shows, asociar recintos y unidades de transporte, definir itinerarios y configurar múltiples opciones de tarifas (`package_tiers`).
  * Generador algorítmico de slugs canónicos normalizados (`generateSlug`).
  * Vista de edición completa `/admin/viajes/editar/[id]`.

---

## [0.6.0] - 2026-09-25
### Añadido
* **US-04: Maestro de Recintos y Sedes (`/admin/recintos`):**
  * CRUD tipado de recintos con aforo oficial, geolocalización directa con Google Maps, filtros por tipología (`stadium`, `arena`, etc.) y validación estricta Zod.
  * Composable `useVenues.ts` con caché en memoria (TTL de 30 minutos).

---

## [0.5.0] - 2026-09-22
### Añadido
* **US-03: Gestión de Flota y Choferes Profesionales:**
  * Módulo `/admin/transportes`: CRUD de vehículos, capacidad de plazas (19 a 60 pax), asignación de chofer y patentes.
  * Módulo `/admin/choferes`: Directorio de choferes con números de guardia, licencias CNRT y enlaces de contacto directo a WhatsApp.
  * Composables `useTransports.ts` y `useDrivers.ts` con estándar de caché en memoria ADR-05.

---

## [0.2.0] - 2026-09-15
### Añadido
* **US-02: Autenticación Administrativa y Tablero Base:**
  * Pantalla de login `/admin/login` conectada a Supabase Auth.
  * Middleware de navegación `auth.ts` para proteger la superficie administrativa `/admin/*`.
  * Layout administrativo `admin.vue` con shell de navegación y cierre de sesión resiliente con purga de memoria.
  * Tablero inicial `/admin` con estado de servicios y métricas generales.

---

## [0.1.0] - 2026-09-08
### Añadido
* **US-01: Setup Inicial e Infraestructura:**
  * Inicialización de proyecto Nuxt 4 (`app/`) con Vue 3 y TypeScript.
  * Integración de `@nuxt/ui`, Tailwind CSS y soporte de modo oscuro.
  * Conexión con Supabase Cloud (PostgreSQL relacional, RLS y autenticación JWT).
  * Esquema DDL inicial en PostgreSQL para usuarios, choferes, recintos, transportes, eventos y tarifas.
  * Configuración de variables de entorno y cabeceras de seguridad HTTP en `nuxt.config.ts`.
