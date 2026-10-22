// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
    'nuxt-marquee',
    '@vercel/analytics'
  ],

  features: {
    inlineStyles: true
  },

  // Configuración global de Head, SEO y Accesibilidad (Lighthouse)
  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      title: 'Tripu Producciones | Viajes a Recitales y Festivales de Música',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Plataforma oficial de traslados, viajes organizados y experiencias a los mejores recitales y festivales de música de Argentina.'
        },
        { name: 'theme-color', content: '#0F0F12' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://images.unsplash.com' },
        { rel: 'preconnect', href: 'https://encrypted-tbn0.gstatic.com' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  // Configuración de Supabase
  // redirect: false es vital para permitir navegación anónima al catálogo y ficha pública
  supabase: {
    redirect: false,
    cookieOptions: {
      name: 'sb',
      lifetime: 60 * 60 * 8, // 8 horas
      domain: '',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  },

  // Cabeceras HTTP de seguridad global y reglas de rendimiento en el Edge (SWR / SPA)
  routeRules: {
    // 1. Portada: SWR de 5 minutos (300s). Servido desde Edge CDN en < 30ms, revalidación en segundo plano
    '/': {
      swr: 300,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      }
    },
    // 2. Fichas de recitales y traslados: SWR de 10 minutos (600s)
    '/viajes/**': {
      swr: 600,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=1200'
      }
    },
    // 3. Páginas institucionales y contacto
    '/contacto': { swr: 3600 },
    '/politica-de-privacidad': { swr: 86400 },
    '/terminos-y-condiciones': { swr: 86400 },
    // 4. Panel Administrativo: Renderizado del lado del cliente (SPA), elimina costo de SSR para operadores
    '/admin/**': {
      ssr: false
    },
    // 5. Cabeceras de seguridad globales
    '/**': {
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  },

  // Configuración de SEO y Sitemap
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.tripu.com.ar'
  },

  sitemap: {
    sources: [
      '/api/__sitemap__/urls'
    ]
  },

  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    contactReceiverEmail: process.env.CONTACT_RECEIVER_EMAIL || 'contacto@tripu.com.ar',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.tripu.com.ar',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '5493410000000'
    }
  }
})
