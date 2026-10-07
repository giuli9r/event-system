import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event)
    const { data: events, error } = await client
      .from('events')
      .select('slug, updated_at, status')
      .in('status', ['published', 'sold_out'])

    if (error || !events) {
      console.warn('[Sitemap URLs] Error al consultar viajes publicados:', error)
      return []
    }

    return events.map((item) => ({
      loc: `/viajes/${item.slug}`,
      lastmod: item.updated_at || new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
    }))
  } catch (err) {
    console.error('[Sitemap URLs] Error inesperado generando rutas dinámicas:', err)
    return []
  }
})
