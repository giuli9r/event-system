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

// Catálogo semilla/demostrativo para previsualización antes de la migración en Supabase
const INITIAL_DEMO_MERCH: MerchItem[] = [
  {
    id: 'merch-demo-1',
    name: 'Remera Oficial Tripu Tour 2026',
    slug: 'remera-oficial-tripu-tour-2026',
    category: 'indumentaria',
    description: 'Remera 100% algodón peinado 24/1 con estampa serigráfica en pecho y espalda. Diseño oficial del tour de recitales.',
    price: 25000,
    stock: 20,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'merch-demo-2',
    name: 'Buzo Canguro Oversize "El Viaje"',
    slug: 'buzo-canguro-oversize-el-viaje',
    category: 'indumentaria',
    description: 'Frisa invisible premium con capucha forrada y bolsillo delantero. Bordado de alta densidad en el pecho.',
    price: 48000,
    stock: 10,
    sizes: ['M', 'L', 'XL'],
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'merch-demo-3',
    name: 'Gorra Trucker Bordada Tripu Red',
    slug: 'gorra-trucker-bordada-tripu-red',
    category: 'accesorios',
    description: 'Gorra clásica con malla respirable y cierre snapback ajustable. Frente acolchado con parche bordado.',
    price: 12500,
    stock: 20,
    sizes: ['Único'],
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'merch-demo-4',
    name: 'Pack 5 Stickers Holográficos',
    slug: 'pack-5-stickers-holograficos',
    category: 'calcos',
    description: 'Calcomanías resistentes al agua y al sol con acabado holográfico tornasolado especial para termos y fundas.',
    price: 4500,
    stock: 80,
    sizes: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'merch-demo-5',
    name: 'Combo Pasajero VIP (Remera + Gorra + Calco)',
    slug: 'combo-pasajero-vip',
    category: 'combos',
    description: 'Kit de bienvenida para pasajeros frecuentes con descuento promocional en salida grupal.',
    price: 48000,
    stock: 15,
    sizes: ['M', 'L', 'XL'],
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

// TTL de caché en memoria: 15 minutos
const CACHE_TTL_MS = 15 * 60 * 1000

export function useMerch() {
  const supabase = useSupabaseClient<Database>()

  // Estado global reactivo
  const merchItems = useState<MerchItem[]>('tripu-merch-data', () => [...INITIAL_DEMO_MERCH])
  const lastFetched = useState<number | null>('tripu-merch-timestamp', () => null)
  const loading = useState<boolean>('tripu-merch-loading', () => false)
  const error = ref<string | null>(null)
  const isDbReady = ref<boolean>(false)

  const isCacheValid = computed(() => {
    if (!lastFetched.value || merchItems.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene los productos de Merchandising.
   * Conecta con Supabase si la tabla existe; de lo contrario mantiene los registros modelo para desarrollo continuo.
   */
  async function fetchMerch(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      // Intentar consulta a tabla en Supabase (cuando se cree en la BD)
      const { data, error: err } = await (supabase as any)
        .from('merchandise')
        .select('*')
        .order('name', { ascending: true })

      if (err) {
        // Si la tabla aún no existe en Supabase (código 42P01 u otro error de esquema), mantenemos demo
        console.info('Tabla "merchandise" aún no inicializada en base de datos. Usando catálogo de arquitectura.')
        isDbReady.value = false
        if (merchItems.value.length === 0) {
          merchItems.value = [...INITIAL_DEMO_MERCH]
        }
      } else if (data) {
        merchItems.value = data
        isDbReady.value = true
      }
      lastFetched.value = Date.now()
    } catch (err: any) {
      // Fallback transparente
      isDbReady.value = false
      if (merchItems.value.length === 0) {
        merchItems.value = [...INITIAL_DEMO_MERCH]
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Alta de un nuevo producto
   */
  async function createMerchItem(payload: MerchInsert) {
    loading.value = true
    error.value = null

    const newItem: MerchItem = {
      id: payload.id || `merch-${Date.now()}`,
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: payload.category,
      description: payload.description || null,
      price: payload.price,
      stock: payload.stock,
      sizes: payload.sizes || null,
      image_url: payload.image_url || null,
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      // Intentar persistencia remota
      const { data, error: err } = await (supabase as any)
        .from('merchandise')
        .insert([newItem])
        .select()
        .single()

      if (!err && data) {
        merchItems.value.unshift(data)
        return { data, error: null }
      }
    } catch {
      // Supabase aún sin tabla: persistir localmente en el estado reactivo
    }

    merchItems.value.unshift(newItem)
    lastFetched.value = Date.now()
    loading.value = false
    return { data: newItem, error: null }
  }

  /**
   * Edición de un producto existente
   */
  async function updateMerchItem(id: string, updates: MerchUpdate) {
    loading.value = true
    error.value = null

    try {
      await (supabase as any)
        .from('merchandise')
        .update(updates)
        .eq('id', id)
    } catch {
      // Ignorar error si no está migrado
    }

    const index = merchItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      merchItems.value[index] = {
        ...merchItems.value[index],
        ...updates,
        updated_at: new Date().toISOString()
      } as MerchItem
    }

    loading.value = false
    return { error: null }
  }

  /**
   * Eliminación de un producto
   */
  async function deleteMerchItem(id: string) {
    loading.value = true
    error.value = null

    try {
      await (supabase as any)
        .from('merchandise')
        .delete()
        .eq('id', id)
    } catch {
      // Ignorar error si no está migrado
    }

    merchItems.value = merchItems.value.filter(item => item.id !== id)
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
