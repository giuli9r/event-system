import type { Database } from '~/types/database.types'
import type { Venue } from '~/composables/useVenues'
import type { PackageTier, Event as DbEvent } from '~/composables/useEvents'

export interface PublicFeaturedEvent extends DbEvent {
  venue: Venue | null
  package_tiers: PackageTier[]
}

const PUBLIC_CACHE_TTL_MS = 1 * 60 * 1000 // 1 minuto de caché en cliente

export function usePublicEvents() {
  const supabase = useSupabaseClient<Database>()

  // Estados globales de eventos
  const featuredEvents = useState<PublicFeaturedEvent[]>('tripu-public-featured-events', () => [])
  const allEvents = useState<PublicFeaturedEvent[]>('tripu-public-all-events', () => [])
  const lastFetchedFeatured = useState<number | null>('tripu-public-featured-timestamp', () => null)
  const lastFetchedAll = useState<number | null>('tripu-public-all-timestamp', () => null)

  const loading = useState<boolean>('tripu-public-featured-loading', () => false)
  const allLoading = useState<boolean>('tripu-public-all-loading', () => false)
  const error = ref<string | null>(null)

  // Filtros reactivos para el catálogo
  const searchQuery = ref('')
  const selectedCity = ref('all')
  const selectedMonth = ref('all')
  const statusFilter = ref<'all' | 'available' | 'sold_out'>('all')

  const isFeaturedCacheValid = computed(() => {
    if (!lastFetchedFeatured.value || featuredEvents.value.length === 0) return false
    return (Date.now() - lastFetchedFeatured.value) < PUBLIC_CACHE_TTL_MS
  })

  const isAllCacheValid = computed(() => {
    if (!lastFetchedAll.value || allEvents.value.length === 0) return false
    return (Date.now() - lastFetchedAll.value) < PUBLIC_CACHE_TTL_MS
  })

  /**
   * Query relacional estándar para eventos públicos
   */
  const PUBLIC_QUERY = `
    *,
    venue:venues(*),
    package_tiers(*)
  `

  /**
   * Obtiene los eventos destacados públicos activos
   */
  async function fetchFeaturedEvents(options: { force?: boolean } = {}) {
    if (!options.force && isFeaturedCacheValid.value) {
      return featuredEvents.value
    }

    loading.value = true
    error.value = null

    try {
      const nowIso = new Date().toISOString()

      const { data, error: err } = await supabase
        .from('events')
        .select(PUBLIC_QUERY)
        .eq('status', 'published')
        .eq('is_featured', true)
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true })
        .limit(6)

      if (err) throw err

      let results = (data as unknown as PublicFeaturedEvent[]) || []

      // Si no hay destacados futuros configurados con is_featured=true, buscar los próximos 3 publicados
      if (results.length === 0) {
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('events')
          .select(PUBLIC_QUERY)
          .eq('status', 'published')
          .gte('event_date', nowIso)
          .order('event_date', { ascending: true })
          .limit(3)

        if (!fallbackErr && fallbackData && fallbackData.length > 0) {
          results = fallbackData as unknown as PublicFeaturedEvent[]
        }
      }

      featuredEvents.value = results
      lastFetchedFeatured.value = Date.now()
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
   * Obtiene la cartelera completa de próximos viajes (publicados y agotados)
   */
  async function fetchAllPublicEvents(options: { force?: boolean } = {}) {
    if (!options.force && isAllCacheValid.value) {
      return allEvents.value
    }

    allLoading.value = true
    error.value = null

    try {
      const nowIso = new Date().toISOString()

      const { data, error: err } = await supabase
        .from('events')
        .select(PUBLIC_QUERY)
        .in('status', ['published', 'sold_out'])
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true })

      if (err) throw err

      allEvents.value = (data as unknown as PublicFeaturedEvent[]) || []
      lastFetchedAll.value = Date.now()
      return allEvents.value
    } catch (err: any) {
      console.error('Error fetching all public events:', err)
      error.value = err?.message || 'Error al cargar la cartelera de recitales'
      return []
    } finally {
      allLoading.value = false
    }
  }

  /**
   * Ciudades únicas disponibles en los eventos actuales
   */
  const availableCities = computed(() => {
    const citiesSet = new Set<string>()
    allEvents.value.forEach(ev => {
      if (ev.venue?.city && ev.venue.city.trim()) {
        citiesSet.add(ev.venue.city.trim())
      }
    })
    return Array.from(citiesSet).sort()
  })

  /**
   * Meses únicos disponibles en los eventos actuales (formato YYYY-MM y label amigable)
   */
  const availableMonths = computed(() => {
    const map = new Map<string, string>()
    allEvents.value.forEach(ev => {
      if (ev.event_date) {
        try {
          const d = new Date(ev.event_date)
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!map.has(key)) {
              const label = new Intl.DateTimeFormat('es-AR', {
                month: 'long',
                year: 'numeric'
              }).format(d)
              // Capitalizar mes
              map.set(key, label.charAt(0).toUpperCase() + label.slice(1))
            }
          }
        } catch {
          // ignore invalid
        }
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  })

  /**
   * Eventos filtrados reactivamente por búsqueda, ciudad, mes y disponibilidad
   */
  const filteredEvents = computed(() => {
    let result = allEvents.value

    // 1. Filtro por búsqueda de texto (artista, título o recinto)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      result = result.filter(ev => {
        const artist = (ev.artist_headliner || '').toLowerCase()
        const title = (ev.title || '').toLowerCase()
        const venueName = (ev.venue?.name || '').toLowerCase()
        const city = (ev.venue?.city || '').toLowerCase()
        return artist.includes(q) || title.includes(q) || venueName.includes(q) || city.includes(q)
      })
    }

    // 2. Filtro por ciudad de destino
    if (selectedCity.value && selectedCity.value !== 'all') {
      result = result.filter(ev => ev.venue?.city === selectedCity.value)
    }

    // 3. Filtro por mes (YYYY-MM)
    if (selectedMonth.value && selectedMonth.value !== 'all') {
      result = result.filter(ev => {
        if (!ev.event_date) return false
        return ev.event_date.startsWith(selectedMonth.value)
      })
    }

    // 4. Filtro por estado de cupos
    if (statusFilter.value === 'available') {
      result = result.filter(ev => ev.status === 'published')
    } else if (statusFilter.value === 'sold_out') {
      result = result.filter(ev => ev.status === 'sold_out')
    }

    return result
  })

  /**
   * Limpia todos los filtros activos
   */
  function resetFilters() {
    searchQuery.value = ''
    selectedCity.value = 'all'
    selectedMonth.value = 'all'
    statusFilter.value = 'all'
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
   * Formatea la fecha del evento a formato amigable completo (ej: "SÁBADO 14 DE NOVIEMBRE")
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
   * Formatea la fecha para tarjeta de catálogo como en PROXIMOS_EVENTOS.png (ej: "4 DE OCTUBRE")
   */
  function formatCardDate(dateStr: string): string {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return new Intl.DateTimeFormat('es-AR', {
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
      if (timeStr.includes('T')) {
        const date = new Date(timeStr)
        if (!isNaN(date.getTime())) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} HS`
        }
      }
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
    allEvents,
    filteredEvents,
    availableCities,
    availableMonths,
    searchQuery,
    selectedCity,
    selectedMonth,
    statusFilter,
    loading,
    allLoading,
    error,
    isFeaturedCacheValid,
    isAllCacheValid,
    fetchFeaturedEvents,
    fetchAllPublicEvents,
    resetFilters,
    getMinPrice,
    formatCurrency,
    formatEventDate,
    formatCardDate,
    formatEventTime
  }
}
