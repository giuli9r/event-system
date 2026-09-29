// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap'
  ],

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

  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    contactReceiverEmail: process.env.CONTACT_RECEIVER_EMAIL || 'contacto@tripu.com.ar',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.tripu.com.ar',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '5493410000000'
    }
  }
})
