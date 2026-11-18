import type { Database } from '~/types/database.types'

export type MerchCategory = 'indumentaria' | 'accesorios' | 'calcos' | 'combos' | 'otros'

export interface MerchItem {
  id: string
  name: string
  slug?: string
  category: MerchCategory
  description: string | null
  price: number
  stock: number
  sizes?: string[] | null
  image_url?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type MerchInsert = Omit<MerchItem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
}

export type MerchUpdate = Partial<MerchInsert>

// TTL de caché en memoria: 15 minutos
const CACHE_TTL_MS = 15 * 60 * 1000

export function useMerch() {
  const supabase = useSupabaseClient<Database>()

  // Estado global reactivo inicializado vacío (solo datos persistidos en Supabase)
  const merchItems = useState<MerchItem[]>('tripu-merch-data', () => [])
  const lastFetched = useState<number | null>('tripu-merch-timestamp', () => null)
  const loading = useState<boolean>('tripu-merch-loading', () => false)
  const error = ref<string | null>(null)
  const isDbReady = ref<boolean>(true)

  const isCacheValid = computed(() => {
    if (!lastFetched.value || merchItems.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene los productos de Merchandising desde Supabase.
   */
  async function fetchMerch(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await (supabase as any)
        .from('merchandise')
        .select('*')
        .order('name', { ascending: true })

      if (err) throw err

      merchItems.value = (data as MerchItem[]) || []
      isDbReady.value = true
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar catálogo de merchandising'
      console.error('Error fetching merchandise:', err)
      isDbReady.value = false
    } finally {
      loading.value = false
    }
  }

  /**
   * Alta de un nuevo producto en Supabase
   */
  async function createMerchItem(payload: MerchInsert) {
    loading.value = true
    error.value = null

    // Generar slug limpio
    const slug = payload.slug || payload.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Payload para Supabase: NO incluir 'id' para que Postgres use gen_random_uuid()
    const dbPayload: Record<string, any> = {
      name: payload.name,
      slug,
      category: payload.category,
      description: payload.description || null,
      price: payload.price,
      stock: payload.stock,
      sizes: payload.sizes || null,
      image_url: payload.image_url || null,
      is_active: payload.is_active ?? true
    }

    // Si viene un ID y es un UUID válido, lo conservamos
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (payload.id && isUuid.test(payload.id)) {
      dbPayload.id = payload.id
    }

    try {
      const { data, error: err } = await (supabase as any)
        .from('merchandise')
        .insert([dbPayload])
        .select()
        .single()

      if (err) {
        console.error('Error insertando merchandise en Supabase:', err)
        error.value = err.message || 'Error al guardar en base de datos'
        loading.value = false
        return { data: null, error: err }
      }

      if (data) {
        merchItems.value.unshift(data)
        isDbReady.value = true
        lastFetched.value = Date.now()
        loading.value = false
        return { data, error: null }
      }

      loading.value = false
      return { data: null, error: new Error('No se recibieron datos de confirmación') }
    } catch (e: any) {
      console.error('Excepción al conectar con Supabase merchandise:', e)
      error.value = e?.message || 'Error de conexión con la base de datos'
      loading.value = false
      return { data: null, error: e }
    }
  }

  /**
   * Edición de un producto existente en Supabase
   */
  async function updateMerchItem(id: string, updates: MerchUpdate) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await (supabase as any)
        .from('merchandise')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (err) {
        console.error('Error actualizando merchandise en Supabase:', err)
        error.value = err.message || 'Error al actualizar en base de datos'
        loading.value = false
        return { error: err }
      }

      const index = merchItems.value.findIndex(item => item.id === id)
      if (index !== -1 && data) {
        merchItems.value[index] = data
      }
    } catch (e: any) {
      console.error('Excepción al actualizar merchandise en Supabase:', e)
      error.value = e?.message || 'Error de conexión con la base de datos'
      loading.value = false
      return { error: e }
    }

    loading.value = false
    return { error: null }
  }

  /**
   * Eliminación de un producto en Supabase
   */
  async function deleteMerchItem(id: string) {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await (supabase as any)
        .from('merchandise')
        .delete()
        .eq('id', id)

      if (err) {
        console.error('Error eliminando merchandise en Supabase:', err)
        error.value = err.message || 'Error al eliminar en base de datos'
        loading.value = false
        return { error: err }
      }

      merchItems.value = merchItems.value.filter(item => item.id !== id)
    } catch (e: any) {
      console.error('Excepción al eliminar merchandise en Supabase:', e)
      error.value = e?.message || 'Error de conexión con la base de datos'
      loading.value = false
      return { error: e }
    }

    loading.value = false
    return { error: null }
  }

  function clearMerchState() {
    merchItems.value = []
    lastFetched.value = null
    loading.value = false
    error.value = null
  }

  return {
    merchItems,
    loading,
    error,
    isDbReady,
    isCacheValid,
    fetchMerch,
    createMerchItem,
    updateMerchItem,
    deleteMerchItem,
    clearMerchState
  }
}
