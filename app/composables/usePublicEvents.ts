import type { Database } from '~/types/database.types'
import type { Venue } from '~/composables/useVenues'
import type { PackageTier, Event as DbEvent } from '~/composables/useEvents'

export interface PublicFeaturedEvent extends DbEvent {
  venue: Venue | null
  package_tiers: PackageTier[]
}

const FEATURED_CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutos de caché en cliente

export function usePublicEvents() {
  const supabase = useSupabaseClient<Database>()

  const featuredEvents = useState<PublicFeaturedEvent[]>('tripu-public-featured-events', () => [])
  const lastFetched = useState<number | null>('tripu-public-featured-timestamp', () => null)
  const loading = useState<boolean>('tripu-public-featured-loading', () => false)
  const error = ref<string | null>(null)

  const isCacheValid = computed(() => {
    if (!lastFetched.value || featuredEvents.value.length === 0) return false
    return (Date.now() - lastFetched.value) < FEATURED_CACHE_TTL_MS
  })

  /**
   * Obtiene los eventos destacados públicos activos
   */
  async function fetchFeaturedEvents(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return featuredEvents.value
    }

    loading.value = true
    error.value = null

    try {
      // Consultamos eventos marcados como destacados, publicados y con fecha futura o del día
      // Si no hubiese eventos futuros con is_featured=true, permitimos fallback a los próximos publicados
      const nowIso = new Date().toISOString()

      const { data, error: err } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          package_tiers(*)
        `)
        .eq('status', 'published')
        .eq('is_featured', true)
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true })
        .limit(6)

      if (err) throw err

      let results = (data as unknown as PublicFeaturedEvent[]) || []

      // Si no hay destacados futuros configurados con is_featured=true, buscar los próximos 3 publicados para no dejar el banner vacío
      if (results.length === 0) {
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('events')
          .select(`
            *,
            venue:venues(*),
            package_tiers(*)
          `)
          .eq('status', 'published')
          .gte('event_date', nowIso)
          .order('event_date', { ascending: true })
          .limit(3)

        if (!fallbackErr && fallbackData && fallbackData.length > 0) {
          results = fallbackData as unknown as PublicFeaturedEvent[]
        }
      }

      featuredEvents.value = results
      lastFetched.value = Date.now()
      return results
    } catch (err: any) {
      console.error('Error fetching featured events:', err)
      error.value = err?.message || 'Error al cargar eventos destacados'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Calcula el precio mínimo disponible entre las opciones de paquete
   */
  function getMinPrice(tiers?: PackageTier[]): number | null {
    if (!tiers || tiers.length === 0) return null
    const availableTiers = tiers.filter(t => t.is_available)
    const targetTiers = availableTiers.length > 0 ? availableTiers : tiers
    const prices = targetTiers.map(t => Number(t.price)).filter(p => !isNaN(p) && p > 0)
    if (prices.length === 0) return null
    return Math.min(...prices)
  }

  /**
   * Formatea un valor numérico a moneda argentina (ARS)
   */
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Formatea la fecha del evento a formato amigable (ej: "SÁBADO 14 DE NOVIEMBRE")
   */
  function formatEventDate(dateStr: string): string {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }).format(date).toUpperCase()
    } catch {
      return dateStr
    }
  }

  /**
   * Extrae la hora formateada (ej: "21:00 HS")
   */
  function formatEventTime(timeStr: string): string {
    if (!timeStr) return ''
    try {
      // Si viene como ISO string
      if (timeStr.includes('T')) {
        const date = new Date(timeStr)
        if (!isNaN(date.getTime())) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} HS`
        }
      }
      // Si viene como "HH:MM" o "HH:MM:SS"
      const match = timeStr.match(/^(\d{1,2}):(\d{2})/)
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]} HS`
      }
      return `${timeStr} HS`
    } catch {
      return timeStr
    }
  }

  return {
    featuredEvents,
    loading,
    error,
    isCacheValid,
    fetchFeaturedEvents,
    getMinPrice,
    formatCurrency,
    formatEventDate,
    formatEventTime
  }
}
