import { z } from 'zod'
import type { Database, EventStatusEnum } from '~/types/database.types'
import type { Venue } from '~/composables/useVenues'
import type { TransportWithDriver, DriverSummary } from '~/composables/useTransports'

// Tipos base de base de datos
export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type EventStatus = EventStatusEnum

export type PackageTier = Database['public']['Tables']['package_tiers']['Row']
export type PackageTierInsert = Database['public']['Tables']['package_tiers']['Insert']
export type PackageTierUpdate = Database['public']['Tables']['package_tiers']['Update']

// Tipo compuesto con relaciones anidadas
export interface EventWithRelations extends Event {
  venue: Venue | null
  transport: (TransportWithDriver) | null
  package_tiers: PackageTier[]
}

// TTL estándar para entidades operativas dinámicas: 5 minutos
const CACHE_TTL_MS = 5 * 60 * 1000

// ============================================================================
// SCHEMAS DE VALIDACIÓN ZOD Y UTILIDADES
// ============================================================================

export const packageTierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'El nombre del paquete debe tener al menos 2 caracteres'),
  price: z.number({ invalid_type_error: 'El precio debe ser numérico' }).min(0, 'El precio no puede ser negativo'),
  includes_ticket: z.boolean().default(false),
  early_bird: z.boolean().default(false),
  currency: z.string().default('ARS'),
  payment_methods: z.string().default('efectivo, transferencia, cuotas, tarjeta'),
  is_available: z.boolean().default(true)
})

export type PackageTierFormInput = z.infer<typeof packageTierSchema>

export const eventFormSchema = z.object({
  title: z.string().min(3, 'El título del viaje debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  artist_headliner: z.string().min(2, 'El artista principal es obligatorio'),
  venue_id: z.string().uuid('Debes seleccionar un recinto válido').nullable(),
  transport_id: z.string().uuid('Debes seleccionar un vehículo válido').nullable(),
  coordinator_id: z.string().uuid().nullable().optional(),
  event_date: z.string().min(1, 'La fecha del show es obligatoria'),
  departure_time: z.string().min(1, 'La hora de salida es obligatoria'),
  departure_location: z.string().min(3, 'El punto de encuentro es obligatorio').default('Terminal - San Francisco'),
  return_policy: z.string().optional().default('Regreso 60 minutos finalizado el show'),
  includes_summary: z.string().optional(),
  full_itinerary: z.string().optional(),
  image_url: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true
    try {
      const url = new URL(val.trim())
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }, { message: 'Debe ser una URL web válida (HTTP/HTTPS)' }),
  status: z.enum(['draft', 'published', 'sold_out', 'completed', 'canceled', 'rescheduled'] as const).default('published'),
  is_featured: z.boolean().default(false),
  tiers: z.array(packageTierSchema).min(1, 'Debes configurar al menos una opción de paquete o tarifa')
})

export type EventFormInput = z.infer<typeof eventFormSchema>

/**
 * Generador algorítmico de Slugs canónicos.
 * Normaliza acentos, diacríticos y caracteres especiales para URLs limpias.
 * Ej: ("Los Piojos", "Estadio River Plate", "2026-10-15") -> "los-piojos-estadio-river-plate-2026-10-15"
 */
export function generateSlug(artist: string, venueName?: string, dateStr?: string): string {
  const parts: string[] = []
  if (artist && artist.trim()) parts.push(artist.trim())
  if (venueName && venueName.trim()) parts.push(venueName.trim())
  if (dateStr && dateStr.trim()) {
    const match = dateStr.trim().match(/^\d{4}-\d{2}-\d{2}/)
    if (match) parts.push(match[0])
  }

  return parts
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// COMPOSABLE useEvents (ADR-05 STATE MANAGEMENT)
// ============================================================================

export function useEvents() {
  const supabase = useSupabaseClient<Database>()

  // Estado global singleton en memoria vía useState
  const events = useState<EventWithRelations[]>('tripu-events-data', () => [])
  const lastFetched = useState<number | null>('tripu-events-timestamp', () => null)
  const loading = useState<boolean>('tripu-events-loading', () => false)
  const error = ref<string | null>(null)

  /**
   * Determina si la caché en memoria es válida y está dentro del periodo TTL de 5 min.
   */
  const isCacheValid = computed(() => {
    if (!lastFetched.value || events.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Query relacional consolidada para resolver evento con recinto, transporte, chofer y paquetes.
   */
  const RELATIONS_QUERY = `
    *,
    venue:venues(*),
    transport:transports(
      *,
      driver:drivers(id, name, lastname, cellphone)
    ),
    package_tiers(*)
  `

  /**
   * Obtiene la agenda de salidas y viajes con todas sus relaciones anidadas.
   * Si la caché es válida y no se fuerza el refresco, omite la llamada de red (0 ms).
   */
  async function fetchEvents(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('events')
        .select(RELATIONS_QUERY)
        .order('event_date', { ascending: true })

      if (err) throw err

      events.value = (data as unknown as EventWithRelations[]) || []
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar la agenda de viajes'
      console.error('Error fetching events:', err)
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
  function clearEventsState() {
    events.value = []
    lastFetched.value = null
  }

  /**
   * Creación atómica de un evento junto con sus opciones de paquetes de tarifas.
   */
  async function createEventWithTiers(
    eventPayload: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'>,
    tiersPayload: Omit<PackageTierInsert, 'id' | 'created_at' | 'event_id'>[]
  ) {
    loading.value = true
    error.value = null

    try {
      // 1. Insertar el evento principal
      const { data: newEvent, error: eventErr } = await supabase
        .from('events')
        .insert(eventPayload)
        .select()
        .single()

      if (eventErr) throw eventErr
      if (!newEvent) throw new Error('No se pudo registrar el evento')

      // 2. Insertar los package_tiers asociados
      if (tiersPayload.length > 0) {
        const tiersToInsert = tiersPayload.map(tier => ({
          ...tier,
          event_id: newEvent.id
        }))

        const { error: tiersErr } = await supabase
          .from('package_tiers')
          .insert(tiersToInsert)

        if (tiersErr) {
          console.error('Error insertando paquetes, rollback de evento:', tiersErr)
          // Intento de compensación si fallan las tarifas
          await supabase.from('events').delete().eq('id', newEvent.id)
          throw tiersErr
        }
      }

      // 3. Consultar el evento completo con sus relaciones resueltas
      const { data: fullEvent, error: fetchErr } = await supabase
        .from('events')
        .select(RELATIONS_QUERY)
        .eq('id', newEvent.id)
        .single()

      if (fetchErr) throw fetchErr

      if (fullEvent) {
        events.value.push(fullEvent as unknown as EventWithRelations)
        events.value.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        lastFetched.value = Date.now()
      }

      return { data: fullEvent as unknown as EventWithRelations, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al publicar el viaje'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualización del estado operativo de un viaje ('draft' | 'published' | 'sold_out' | 'completed').
   * Muta inmediatamente el estado en memoria para feedback instantáneo (0 ms).
   */
  async function updateEventStatus(id: string, status: EventStatus) {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('events')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err

      const index = events.value.findIndex(e => e.id === id)
      if (index !== -1) {
        events.value[index].status = status
        lastFetched.value = Date.now()
      }

      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar el estado del viaje'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualización de datos de un viaje y re-sincronización en memoria.
   */
  async function updateEvent(id: string, eventPayload: EventUpdate) {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('events')
        .update({ ...eventPayload, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err

      // Re-consultar el registro completo con relaciones
      const { data: fullEvent, error: fetchErr } = await supabase
        .from('events')
        .select(RELATIONS_QUERY)
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr

      if (fullEvent) {
        const index = events.value.findIndex(e => e.id === id)
        if (index !== -1) {
          events.value[index] = fullEvent as unknown as EventWithRelations
          events.value.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        }
        lastFetched.value = Date.now()
      }

      return { data: fullEvent as unknown as EventWithRelations, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar el viaje'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un viaje por su ID con relaciones resueltas.
   * Si la caché reactiva está vigente, lo resuelve en memoria a 0 ms.
   * De lo contrario, consulta a Supabase y lo cachea.
   */
  async function fetchEventById(id: string): Promise<{ data: EventWithRelations | null; error: any }> {
    if (isCacheValid.value && events.value.length > 0) {
      const cached = events.value.find(e => e.id === id)
      if (cached) {
        return { data: cached, error: null }
      }
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('events')
        .select(RELATIONS_QUERY)
        .eq('id', id)
        .single()

      if (err) throw err
      const fullEvent = data as unknown as EventWithRelations

      const idx = events.value.findIndex(e => e.id === id)
      if (idx !== -1) {
        events.value[idx] = fullEvent
      } else if (fullEvent) {
        events.value.push(fullEvent)
        events.value.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      }

      return { data: fullEvent, error: null }
    } catch (err: any) {
      console.error(`Error al recuperar evento ${id}:`, err)
      error.value = err?.message || 'Error al recuperar los datos del viaje'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualización ultrarrápida de tarifas para QuickPriceModal (< 10s).
   * Modifica precio, disponibilidad y preventa de las tarifas de un viaje,
   * actualizando inmediatamente la memoria reactiva (0 ms).
   */
  async function updatePackageTiers(
    eventId: string,
    tiers: Array<{ id: string; price: number; is_available: boolean; early_bird?: boolean }>
  ) {
    loading.value = true
    error.value = null

    try {
      for (const tier of tiers) {
        const { error: err } = await supabase
          .from('package_tiers')
          .update({
            price: Number(tier.price),
            is_available: Boolean(tier.is_available),
            ...(tier.early_bird !== undefined ? { early_bird: Boolean(tier.early_bird) } : {})
          })
          .eq('id', tier.id)
          .eq('event_id', eventId)

        if (err) throw err
      }

      // Actualizar estado en memoria reactiva inmediatamente (0 ms)
      const ev = events.value.find(e => e.id === eventId)
      if (ev && ev.package_tiers) {
        for (const tier of tiers) {
          const target = ev.package_tiers.find(t => t.id === tier.id)
          if (target) {
            target.price = Number(tier.price)
            target.is_available = Boolean(tier.is_available)
            if (tier.early_bird !== undefined) {
              target.early_bird = Boolean(tier.early_bird)
            }
          }
        }
        lastFetched.value = Date.now()
      }

      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar tarifas'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualización completa de un viaje y reconciliación de sus tarifas asociadas.
   * Modifica el registro principal de events y maneja inserciones, actualizaciones y bajas
   * de package_tiers de forma coherente.
   */
  async function updateEventWithTiers(
    eventId: string,
    eventPayload: EventUpdate,
    tiersPayload: PackageTierFormInput[]
  ) {
    loading.value = true
    error.value = null

    try {
      // 1. Actualizar el evento principal
      const { error: eventErr } = await supabase
        .from('events')
        .update({ ...eventPayload, updated_at: new Date().toISOString() })
        .eq('id', eventId)

      if (eventErr) throw eventErr

      // 2. Reconciliación de package_tiers
      const { data: currentTiers, error: curErr } = await supabase
        .from('package_tiers')
        .select('id')
        .eq('event_id', eventId)

      if (curErr) throw curErr
      const currentTierIds = (currentTiers || []).map(t => t.id)
      const payloadTierIds = tiersPayload.filter(t => t.id).map(t => t.id as string)

      // A. Eliminar tarifas descartadas por el operador
      const idsToDelete = currentTierIds.filter(id => !payloadTierIds.includes(id))
      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('package_tiers')
          .delete()
          .in('id', idsToDelete)

        if (delErr) throw delErr
      }

      // B. Actualizar existentes o insertar nuevos
      for (const tier of tiersPayload) {
        if (tier.id && currentTierIds.includes(tier.id)) {
          const { error: upErr } = await supabase
            .from('package_tiers')
            .update({
              name: tier.name.trim(),
              price: Number(tier.price) || 0,
              includes_ticket: Boolean(tier.includes_ticket),
              early_bird: Boolean(tier.early_bird),
              currency: tier.currency || 'ARS',
              payment_methods: tier.payment_methods || 'efectivo, transferencia, cuotas, tarjeta',
              is_available: Boolean(tier.is_available)
            })
            .eq('id', tier.id)

          if (upErr) throw upErr
        } else {
          const { error: insErr } = await supabase
            .from('package_tiers')
            .insert({
              event_id: eventId,
              name: tier.name.trim(),
              price: Number(tier.price) || 0,
              includes_ticket: Boolean(tier.includes_ticket),
              early_bird: Boolean(tier.early_bird),
              currency: tier.currency || 'ARS',
              payment_methods: tier.payment_methods || 'efectivo, transferencia, cuotas, tarjeta',
              is_available: Boolean(tier.is_available)
            })

          if (insErr) throw insErr
        }
      }

      // 3. Re-consultar el registro completo con sus relaciones actualizadas
      const { data: fullEvent, error: fetchErr } = await supabase
        .from('events')
        .select(RELATIONS_QUERY)
        .eq('id', eventId)
        .single()

      if (fetchErr) throw fetchErr

      if (fullEvent) {
        const index = events.value.findIndex(e => e.id === eventId)
        if (index !== -1) {
          events.value[index] = fullEvent as unknown as EventWithRelations
        } else {
          events.value.push(fullEvent as unknown as EventWithRelations)
        }
        events.value.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        lastFetched.value = Date.now()
      }

      return { data: fullEvent as unknown as EventWithRelations, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar el viaje y sus tarifas'
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminación física de un viaje (en cascada elimina package_tiers).
   * Regla de negocio contable:
   * - Si NO tiene ventas asociadas -> Se elimina físicamente.
   * - Si tiene ventas asociadas y TODAS están en 'refunded' o 'canceled' -> Se liberan dichas ventas y se elimina el viaje.
   * - Si tiene ventas con estados activos ('paid', 'partial', 'pending', 'gifted') -> Se bloquea la eliminación y retorna error 23503.
   */
  async function deleteEvent(id: string) {
    loading.value = true
    error.value = null

    try {
      // 1. Consultar si existen ventas registradas para este viaje
      const { data: sales, error: salesErr } = await supabase
        .from('sales')
        .select('id, payment_status')
        .eq('event_id', id)

      if (salesErr) throw salesErr

      if (sales && sales.length > 0) {
        // Verificar si existen ventas activas (no reembolsadas ni anuladas)
        const activeSales = sales.filter(s => s.payment_status !== 'refunded' && s.payment_status !== 'canceled')
        if (activeSales.length > 0) {
          const constraintErr = {
            code: '23503',
            message: 'No se puede eliminar el viaje porque cuenta con ventas activas. Modifique los pagos a "refunded" o "canceled" primero, o cambie el estado del viaje a "Cancelado".',
            details: `Existen ${activeSales.length} ventas con estado activo.`
          }
          throw constraintErr
        }

        // Si TODAS las ventas están en 'refunded' o 'canceled', se autoriza la eliminación física
        // Se purgan las ventas ya resueltas/reembolsadas para liberar la FK restrictiva
        const { error: delSalesErr } = await supabase
          .from('sales')
          .delete()
          .eq('event_id', id)

        if (delSalesErr) throw delSalesErr
      }

      // 2. Eliminar el evento físicamente (en cascada elimina package_tiers)
      const { error: err } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (err) throw err

      events.value = events.value.filter(e => e.id !== id)
      lastFetched.value = Date.now()
      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar el viaje'
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    loading,
    error,
    isCacheValid,
    fetchEvents,
    fetchEventById,
    createEventWithTiers,
    updateEvent,
    updateEventStatus,
    updatePackageTiers,
    updateEventWithTiers,
    deleteEvent,
    invalidateCache,
    clearEventsState
  }
}
