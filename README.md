# Tripu System (event-system)

> **Plataforma web integral especializada en experiencias y traslados a eventos musicales y festivales, con un panel de administración protegido para coordinar la flota de transportes, publicar nuevos viajes y actualizar eventos.**  
> *(An all-in-one web platform specialized in concert and music festival travel experiences, with a secure admin dashboard to manage the transport fleet, publish new trips, and keep events updated).*

---

## 🛠️ Stack Tecnológico

* **Frontend:** [Nuxt 3 / Nuxt 4](https://nuxt.com/) (Vue 3, Composition API)
* **UI & Componentes:** [Nuxt UI](https://ui.nuxt.com/) (Tailwind CSS, Headless UI, Iconify)
* **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Supabase Auth, Supabase Storage)
* **Seguridad:** Row Level Security (RLS) en todas las tablas
* **Validación:** [Zod](https://zod.dev/)
* **SEO & Sitemaps:** `@nuxtjs/sitemap`

---

## 🚀 Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias

```bash
# Instalar dependencias
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa tus credenciales de Supabase:

```bash
cp .env.example .env
```

Edita `.env`:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-publica-anon
```

### 3. Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📁 Documentación del Proyecto

La especificación completa, modelo de datos y roadmap se encuentran en:
* `context/00_STACK_TECNOLOGICO.md`
* `context/01_REQUISITOS_SOFTWARE.md`
* `context/02_TRELLO_TAIGA.md`
* `context/03_DESARROLLO_MVP_CODIGO.md`
* `DOCS/DER.md`
* `DOCS/ROADMAP.md`
