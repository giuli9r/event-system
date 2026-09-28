// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap'
  ],

  // Configuración de Supabase
  // redirect: false es vital para permitir navegación anónima al catálogo y ficha pública
  supabase: {
    redirect: false
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
