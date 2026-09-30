import type { Database, VenueTypeEnum } from '~/types/database.types'

export type Venue = Database['public']['Tables']['venues']['Row']
export type VenueInsert = Database['public']['Tables']['venues']['Insert']
export type VenueUpdate = Database['public']['Tables']['venues']['Update']
export type VenueType = VenueTypeEnum

// Tiempo de vida de la caché: 30 minutos (1.800.000 ms) para datos maestros de recintos
const CACHE_TTL_MS = 30 * 60 * 1000

export function useVenues() {
  const supabase = useSupabaseClient<Database>()

  // Estado global singleton en memoria vía useState
  const venues = useState<Venue[]>('tripu-venues-data', () => [])
  const lastFetched = useState<number | null>('tripu-venues-timestamp', () => null)
  const loading = useState<boolean>('tripu-venues-loading', () => false)
  const error = ref<string | null>(null)

  /**
   * Determina si la caché en memoria es válida y está dentro del periodo TTL de 30 min.
   */
  const isCacheValid = computed(() => {
    if (!lastFetched.value || venues.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene el catálogo de recintos y estadios.
   * Si la caché es válida y no se fuerza el refresco, omite la llamada de red (0 ms).
   */
  async function fetchVenues(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('venues')
        .select('*')
        .order('name', { ascending: true })

      if (err) throw err

      venues.value = data || []
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar el catálogo de recintos'
      console.error('Error fetching venues:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Invalida explícitamente la caché forzando una recarga en la siguiente lectura.
   */
  function invalidateCache() {
    lastFetched.value = null
  }

  /**
   * Purga el estado al cerrar sesión para garantizar aislamiento en terminales compartidas.
   */
  function clearVenuesState() {
    venues.value = []
    lastFetched.value = null
  }

  /**
   * Crea un nuevo recinto y muta la memoria localmente en orden alfabético.
   */
  async function createVenue(payload: Omit<VenueInsert, 'id' | 'created_at'>) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('venues')
        .insert(payload)
        .select()
        .single()

      if (err) throw err

      if (data) {
        venues.value.push(data)
        venues.value.sort((a, b) => a.name.localeCompare(b.name))
        lastFetched.value = Date.now()
      }
      return { data, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al registrar el recinto'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza un recinto existente y muta el arreglo en memoria.
   */
  async function updateVenue(id: string, payload: VenueUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('venues')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      if (data) {
        const index = venues.value.findIndex(v => v.id === id)
        if (index !== -1) {
          venues.value[index] = data
          venues.value.sort((a, b) => a.name.localeCompare(b.name))
        }
        lastFetched.value = Date.now()
      }
      return { data, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar el recinto'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Elimina un recinto y actualiza el estado local en memoria.
   */
  async function deleteVenue(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('venues')
        .delete()
        .eq('id', id)

      if (err) throw err

      venues.value = venues.value.filter(v => v.id !== id)
      lastFetched.value = Date.now()
      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar el recinto'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    venues,
    loading,
    error,
    isCacheValid,
    fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    invalidateCache,
    clearVenuesState
  }
}
