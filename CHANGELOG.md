# Changelog
Historial técnico y cronológico del proyecto.

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
