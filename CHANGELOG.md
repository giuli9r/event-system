# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
