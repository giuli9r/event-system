// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap'
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
      titleTemplate: (chunk?: string) => (chunk && !chunk.includes('Tripu Producciones')) ? `${chunk} | Tripu Producciones` : (chunk || 'Tripu Producciones'),
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

  // Cabeceras HTTP de seguridad global
  routeRules: {
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
