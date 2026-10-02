import { z } from 'zod'
import type { Database, CustomerRow, CustomerInsert, CustomerUpdate } from '~/types/database.types'

export type Customer = CustomerRow

export const customerSchema = z.object({
  name: z.string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastname: z.string({ required_error: 'El apellido es obligatorio' })
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  dni: z.string({ required_error: 'El DNI es obligatorio' })
    .trim()
    .min(6, 'El DNI debe tener al menos 6 caracteres')
    .max(12, 'El DNI no debe superar 12 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'El DNI solo puede contener letras y números sin puntos ni espacios'),
  email: z.string()
    .trim()
    .email('Formato de correo inválido')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .optional()
    .or(z.literal('')),
  city: z.string()
    .trim()
    .optional()
    .or(z.literal('')),
  daybirth: z.string()
    .optional()
    .or(z.literal('')),
  emergency_contact: z.string()
    .trim()
    .optional()
    .or(z.literal('')),
  instagram: z.string()
    .trim()
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .optional()
    .or(z.literal('')),
  interests: z.array(z.string()).default([]),
  is_active: z.boolean().default(true)
})

export type CustomerFormState = z.infer<typeof customerSchema>

// Tiempo de vida de la caché: 5 minutos (Estándar ADR-05 para registros de clientes y pasajeros)
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Deserializa la cadena de intereses almacenada en la base de datos a un array de tags limpios.
 * Formato esperado: "array:rock,los-piojos,babasonicos"
 */
export function parseInterests(raw: string | null | undefined): string[] {
  if (!raw) return []
  if (raw.startsWith('array:')) {
    return raw
      .slice(6)
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)
  }
  // Fallback si fue guardado como texto plano separado por comas
  return raw
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Serializa un array de tags al formato canónico de la base de datos: "array:tag1,tag2,..."
 */
export function formatInterests(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) return null
  const cleaned = Array.from(
    new Set(
      tags
        .map(t => t.trim().toLowerCase().replace(/[:,]/g, '').replace(/\s+/g, '-'))
        .filter(Boolean)
    )
  )
  if (cleaned.length === 0) return null
  return `array:${cleaned.join(',')}`
}

export function useCustomers() {
  const supabase = useSupabaseClient<Database>()

  // Estado global compartido vía useState (singleton reactivo por sesión)
  const customers = useState<Customer[]>('tripu-customers-data', () => [])
  const lastFetched = useState<number | null>('tripu-customers-timestamp', () => null)
  const loading = useState<boolean>('tripu-customers-loading', () => false)
  const error = ref<string | null>(null)

  /**
   * Determina si la caché en memoria es válida y está dentro del periodo TTL.
   */
  const isCacheValid = computed(() => {
    if (!lastFetched.value || customers.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene la nómina de clientes.
   * Si la caché es válida y no se fuerza el refresco, omite la llamada de red (0 ms).
   */
  async function fetchCustomers(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('customers')
        .select('*')
        .order('lastname', { ascending: true })

      if (err) throw err

      customers.value = data || []
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar clientes'
      console.error('Error fetching customers:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un cliente por su ID con resolución instantánea a 0 ms desde la memoria reactiva.
   */
  async function fetchCustomerById(id: string): Promise<{ data: Customer | null; error: any }> {
    const cached = customers.value.find(c => c.id === id)
    if (cached) {
      return { data: cached, error: null }
    }

    try {
      const { data, error: err } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err }
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
  function clearCustomersState() {
    customers.value = []
    lastFetched.value = null
  }

  /**
   * Registra un nuevo cliente con mutación local optimista.
   */
  async function createCustomer(payload: Omit<CustomerInsert, 'id' | 'created_at' | 'updated_at'>) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single()

      if (err) throw err

      if (data) {
        customers.value.push(data)
        customers.value.sort((a, b) => a.lastname.localeCompare(b.lastname))
        lastFetched.value = Date.now()
      }
      return { data, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al registrar cliente'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza los datos de un cliente y sincroniza la memoria reactiva in-place.
   */
  async function updateCustomer(id: string, payload: Partial<Omit<CustomerUpdate, 'id' | 'created_at'>>) {
    loading.value = true
    error.value = null
    try {
      const updateData = {
        ...payload,
        updated_at: new Date().toISOString()
      }

      const { data, error: err } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      if (data) {
        const index = customers.value.findIndex(c => c.id === id)
        if (index !== -1) {
          customers.value[index] = data
          customers.value.sort((a, b) => a.lastname.localeCompare(b.lastname))
          lastFetched.value = Date.now()
        }
      }
      return { data, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar cliente'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Baja lógica o física de un cliente. Por defecto realiza baja lógica (is_active = false).
   */
  async function deleteCustomer(id: string, options: { hard?: boolean } = {}) {
    loading.value = true
    error.value = null
    try {
      if (options.hard) {
        const { error: err } = await supabase
          .from('customers')
          .delete()
          .eq('id', id)

        if (err) throw err
        customers.value = customers.value.filter(c => c.id !== id)
      } else {
        // Baja lógica
        const { data, error: err } = await supabase
          .from('customers')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (err) throw err

        const index = customers.value.findIndex(c => c.id === id)
        if (index !== -1 && data) {
          customers.value[index] = data
        }
      }

      lastFetched.value = Date.now()
      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al dar de baja el cliente'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    loading,
    error,
    isCacheValid,
    fetchCustomers,
    fetchCustomerById,
    invalidateCache,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearCustomersState,
    parseInterests,
    formatInterests
  }
}
