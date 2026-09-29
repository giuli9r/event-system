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

export function useTransports() {
  const supabase = useSupabaseClient<Database>()
  const transports = ref<TransportWithDriver[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTransports() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('transports')
        .select('*, driver:drivers(id, name, lastname, cellphone)')
        .order('name', { ascending: true })

      if (err) throw err
      transports.value = (data as unknown as TransportWithDriver[]) || []
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar flota de transportes'
      console.error('Error fetching transports:', err)
    } finally {
      loading.value = false
    }
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
    fetchTransports,
    createTransport,
    updateTransport,
    deleteTransport
  }
}
