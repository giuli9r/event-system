import type { Database } from '~/types/database.types'

export type Transport = Database['public']['Tables']['transports']['Row']
export type TransportInsert = Database['public']['Tables']['transports']['Insert']
export type TransportUpdate = Database['public']['Tables']['transports']['Update']

export type DriverSummary = {
  id: string
  name: string
  lastname: string
  cellphone: string | null
}

export type TransportWithDriver = Transport & {
  driver?: DriverSummary | null
}

// Tiempo de vida de la caché: 5 minutos
const CACHE_TTL_MS = 5 * 60 * 1000

export function useTransports() {
  const supabase = useSupabaseClient<Database>()

  // Estado global compartido vía useState (singleton reactivo por sesión)
  const transports = useState<TransportWithDriver[]>('tripu-transports-data', () => [])
  const lastFetched = useState<number | null>('tripu-transports-timestamp', () => null)
  const loading = useState<boolean>('tripu-transports-loading', () => false)
  const error = ref<string | null>(null)

  /**
   * Determina si la caché en memoria es válida y está dentro del periodo TTL.
   */
  const isCacheValid = computed(() => {
    if (!lastFetched.value || transports.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene la flota con join hacia choferes.
   * Si la caché es válida y no se fuerza el refresco, omite la llamada de red (0 ms).
   */
  async function fetchTransports(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    // Evitar peticiones concurrentes duplicadas
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('transports')
        .select('*, driver:drivers(id, name, lastname, cellphone)')
        .order('name', { ascending: true })

      if (err) throw err

      transports.value = (data as unknown as TransportWithDriver[]) || []
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar flota de transportes'
      console.error('Error fetching transports:', err)
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
  function clearTransportsState() {
    transports.value = []
    lastFetched.value = null
  }

  async function createTransport(payload: Omit<TransportInsert, 'id' | 'created_at'>) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('transports')
        .insert(payload)
        .select('*, driver:drivers(id, name, lastname, cellphone)')
        .single()

      if (err) throw err

      if (data) {
        transports.value.push(data as unknown as TransportWithDriver)
        transports.value.sort((a, b) => a.name.localeCompare(b.name))
        lastFetched.value = Date.now()
      }
      return { data: data as unknown as TransportWithDriver, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al registrar transporte'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function updateTransport(id: string, payload: Partial<Omit<TransportUpdate, 'id' | 'created_at'>>) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('transports')
        .update(payload)
        .eq('id', id)
        .select('*, driver:drivers(id, name, lastname, cellphone)')
        .single()

      if (err) throw err

      if (data) {
        const index = transports.value.findIndex(t => t.id === id)
        if (index !== -1) {
          transports.value[index] = data as unknown as TransportWithDriver
          transports.value.sort((a, b) => a.name.localeCompare(b.name))
          lastFetched.value = Date.now()
        }
      }
      return { data: data as unknown as TransportWithDriver, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar transporte'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  async function deleteTransport(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('transports')
        .delete()
        .eq('id', id)

      if (err) throw err

      transports.value = transports.value.filter(t => t.id !== id)
      lastFetched.value = Date.now()
      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar transporte'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    transports,
    loading,
    error,
    isCacheValid,
    fetchTransports,
    invalidateCache,
    createTransport,
    updateTransport,
    deleteTransport,
    clearTransportsState
  }
}
