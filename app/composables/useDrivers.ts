import type { Database } from '~/types/database.types'

export type Driver = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']

export function useDrivers() {
  const supabase = useSupabaseClient<Database>()
  const drivers = ref<Driver[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDrivers() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('drivers')
        .select('*')
        .order('lastname', { ascending: true })

      if (err) throw err
      drivers.value = data || []
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar choferes'
      console.error('Error fetching drivers:', err)
    } finally {
      loading.value = false
    }
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
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver
  }
}
