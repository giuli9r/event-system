import type { Database } from '~/types/database.types'

export type Driver = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']

// Tiempo de vida de la caché: 5 minutos
const CACHE_TTL_MS = 5 * 60 * 1000

export function useDrivers() {
  const supabase = useSupabaseClient<Database>()

  // Estado global compartido vía useState (singleton reactivo por sesión)
  const drivers = useState<Driver[]>('tripu-drivers-data', () => [])
  const lastFetched = useState<number | null>('tripu-drivers-timestamp', () => null)
  const loading = useState<boolean>('tripu-drivers-loading', () => false)
  const error = ref<string | null>(null)

  /**
   * Determina si la caché en memoria es válida y está dentro del periodo TTL.
   */
  const isCacheValid = computed(() => {
    if (!lastFetched.value || drivers.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene la nómina de choferes.
   * Si la caché es válida y no se fuerza el refresco, omite la llamada de red (0 ms).
   */
  async function fetchDrivers(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    // Evitar peticiones concurrentes duplicadas
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('drivers')
        .select('*')
        .order('lastname', { ascending: true })

      if (err) throw err

      drivers.value = data || []
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar choferes'
      console.error('Error fetching drivers:', err)
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
  function clearDriversState() {
    drivers.value = []
    lastFetched.value = null
  }

  async function createDriver(payload: Omit<DriverInsert, 'id' | 'created_at'>) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('drivers')
        .insert(payload)
        .select()
        .single()

      if (err) throw err

      if (data) {
        drivers.value.push(data)
        drivers.value.sort((a, b) => a.lastname.localeCompare(b.lastname))
        lastFetched.value = Date.now()
      }
      return { data, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al registrar chofer'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function updateDriver(id: string, payload: Partial<Omit<DriverUpdate, 'id' | 'created_at'>>) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('drivers')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      if (data) {
        const index = drivers.value.findIndex(d => d.id === id)
        if (index !== -1) {
          drivers.value[index] = data
          drivers.value.sort((a, b) => a.lastname.localeCompare(b.lastname))
          lastFetched.value = Date.now()
        }
      }
      return { data, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar chofer'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function deleteDriver(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id)

      if (err) throw err

      drivers.value = drivers.value.filter(d => d.id !== id)
      lastFetched.value = Date.now()
      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar chofer'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    drivers,
    loading,
    error,
    isCacheValid,
    fetchDrivers,
    invalidateCache,
    createDriver,
    updateDriver,
    deleteDriver,
    clearDriversState
  }
}
