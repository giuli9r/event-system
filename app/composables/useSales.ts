import type {
  Database,
  SaleRow,
  SaleInsert,
  SaleUpdate,
  PaymentMethodEnum,
  PaymentStatusEnum
} from '~/types/database.types'

export type Sale = SaleRow
export type { PaymentMethodEnum, PaymentStatusEnum }

// Tipo compuesto con relaciones anidadas para el módulo contable
export interface SaleWithRelations extends Sale {
  event: {
    id: string
    title: string
    slug: string
    event_date: string
    departure_time: string
    departure_location: string
    status: string
    venue: { id: string; name: string; city: string } | null
  } | null
  customer: {
    id: string
    name: string
    lastname: string
    dni: string
    phone: string | null
    email: string | null
    city: string | null
    emergency_contact: string | null
  } | null
  package_tier: {
    id: string
    name: string
    price: number
    includes_ticket: boolean
  } | null
  created_by_user?: {
    id: string
    name: string
    lastname: string
    email: string
  } | null
}

// TTL estándar para entidades dinámicas operativas: 5 minutos (ADR-05)
const CACHE_TTL_MS = 5 * 60 * 1000

const RELATIONS_QUERY = `
  *,
  event:events(
    id,
    title,
    slug,
    event_date,
    departure_time,
    departure_location,
    status,
    venue:venues(id, name, city)
  ),
  customer:customers(
    id,
    name,
    lastname,
    dni,
    phone,
    email,
    city,
    emergency_contact
  ),
  package_tier:package_tiers(
    id,
    name,
    price,
    includes_ticket
  ),
  created_by_user:users(
    id,
    name,
    lastname,
    email
  )
`

export function useSales() {
  const supabase = useSupabaseClient<Database>()

  // Estado global compartido vía useState (singleton reactivo por sesión)
  const sales = useState<SaleWithRelations[]>('tripu-sales-data', () => [])
  const lastFetched = useState<number | null>('tripu-sales-timestamp', () => null)
  const loading = useState<boolean>('tripu-sales-loading', () => false)
  const error = ref<string | null>(null)

  /**
   * Determina si la caché en memoria es válida dentro de la ventana de 5 minutos.
   */
  const isCacheValid = computed(() => {
    if (!lastFetched.value || sales.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  // ============================================================================
  // MÉTRICAS Y KPIS CONTABLES REACTIVOS A 0 MS
  // ============================================================================

  // Total de dinero facturado pactado (excluyendo ventas canceladas/reembolsadas)
  const totalRevenue = computed(() => {
    return sales.value
      .filter(s => s.payment_status !== 'canceled' && s.payment_status !== 'refunded')
      .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
  })

  // Total cobrado efectivo en mano/banco a la fecha
  const totalCollected = computed(() => {
    return sales.value
      .filter(s => s.payment_status !== 'canceled' && s.payment_status !== 'refunded')
      .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
  })

  // Saldo pendiente total por cobrar en puerta / antes de subir al colectivo (Cobro en Caliente)
  const totalPendingBalance = computed(() => {
    return sales.value
      .filter(s => s.payment_status !== 'canceled' && s.payment_status !== 'refunded')
      .reduce((sum, s) => sum + Number(s.balance_due || 0), 0)
  })

  // Cantidad total de pasajes/butacas vendidas activas
  const totalTicketsSold = computed(() => {
    return sales.value
      .filter(s => s.payment_status !== 'canceled' && s.payment_status !== 'refunded')
      .reduce((sum, s) => sum + Number(s.quantity || 1), 0)
  })

  // Ventas con saldo pendiente (para check-in ágil al subir al micro)
  const salesWithPendingBalance = computed(() => {
    return sales.value.filter(s =>
      s.balance_due > 0 &&
      s.payment_status !== 'canceled' &&
      s.payment_status !== 'refunded'
    )
  })

  // ============================================================================
  // MÉTODOS CRUD Y ACCESO A DATOS
  // ============================================================================

  /**
   * Obtiene el libro de ventas con sus relaciones completas.
   * Si la caché es válida y no se fuerza, responde en 0 ms sin peticiones de red.
   */
  async function fetchSales(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return
    }

    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('sales')
        .select(RELATIONS_QUERY)
        .order('sale_date', { ascending: false })

      if (err) throw err

      sales.value = (data as unknown as SaleWithRelations[]) || []
      lastFetched.value = Date.now()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar ventas contables'
      console.error('Error fetching sales:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene una venta por su identificador UUID desde memoria o Supabase.
   */
  async function fetchSaleById(id: string): Promise<{ data: SaleWithRelations | null; error: any }> {
    const cached = sales.value.find(s => s.id === id)
    if (cached) {
      return { data: cached, error: null }
    }

    try {
      const { data, error: err } = await supabase
        .from('sales')
        .select(RELATIONS_QUERY)
        .eq('id', id)
        .single()

      if (err) throw err
      return { data: data as unknown as SaleWithRelations, error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  /**
   * Registra una nueva venta con cálculo consistente de saldos y actualización reactiva in-place.
   */
  async function createSale(payload: SaleInsert): Promise<{ data: SaleWithRelations | null; error: any }> {
    loading.value = true
    error.value = null

    try {
      // Cálculo defensivo de saldo pendiente
      const unitPrice = Number(payload.unit_price) || 0
      const qty = Number(payload.quantity) || 1
      const totalAmount = Number(payload.total_amount) || (unitPrice * qty)
      const amountPaid = Number(payload.amount_paid) || 0
      const balanceDue = Math.max(0, totalAmount - amountPaid)

      // Deducción automática de estado de pago si no viene explícito
      let paymentStatus = payload.payment_status || 'paid'
      if (balanceDue === 0 && amountPaid > 0) {
        paymentStatus = 'paid'
      } else if (amountPaid > 0 && balanceDue > 0) {
        paymentStatus = 'partial'
      } else if (amountPaid === 0) {
        paymentStatus = 'pending'
      }

      const sanitizedPayload: SaleInsert = {
        ...payload,
        unit_price: unitPrice,
        quantity: qty,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        payment_status: paymentStatus
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('sales')
        .insert(sanitizedPayload)
        .select(RELATIONS_QUERY)
        .single()

      if (insertErr) throw insertErr
      if (!inserted) throw new Error('No se pudo registrar la venta')

      const newSale = inserted as unknown as SaleWithRelations

      // Mutación reactiva local in-place en memoria (0 ms)
      sales.value = [newSale, ...sales.value]
      lastFetched.value = Date.now()

      return { data: newSale, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al asentar la venta'
      console.error('Error creating sale:', err)
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza los datos de una venta existente.
   */
  async function updateSale(id: string, payload: SaleUpdate): Promise<{ data: SaleWithRelations | null; error: any }> {
    loading.value = true
    error.value = null

    try {
      // Recalcular saldo si se modifican los importes
      const existing = sales.value.find(s => s.id === id)
      const totalAmount = payload.total_amount !== undefined
        ? Number(payload.total_amount)
        : (existing ? Number(existing.total_amount) : 0)

      const amountPaid = payload.amount_paid !== undefined
        ? Number(payload.amount_paid)
        : (existing ? Number(existing.amount_paid) : 0)

      const balanceDue = Math.max(0, totalAmount - amountPaid)

      let paymentStatus = payload.payment_status || (existing?.payment_status ?? 'paid')
      if (balanceDue === 0 && amountPaid > 0) {
        paymentStatus = 'paid'
      } else if (amountPaid > 0 && balanceDue > 0) {
        paymentStatus = 'partial'
      } else if (amountPaid === 0) {
        paymentStatus = 'pending'
      }

      const updatePayload: SaleUpdate = {
        ...payload,
        balance_due: balanceDue,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      }

      const { data: updated, error: updateErr } = await supabase
        .from('sales')
        .update(updatePayload)
        .eq('id', id)
        .select(RELATIONS_QUERY)
        .single()

      if (updateErr) throw updateErr
      if (!updated) throw new Error('No se pudo actualizar la venta')

      const updatedSale = updated as unknown as SaleWithRelations

      // Actualización reactiva in-place
      const index = sales.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sales.value[index] = updatedSale
      }
      lastFetched.value = Date.now()

      return { data: updatedSale, error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al actualizar venta'
      console.error('Error updating sale:', err)
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Asienta un pago / cuota adicional (Cobro en Caliente al subir al colectivo).
   * Incrementa amount_paid, reduce balance_due y actualiza payment_status.
   */
  async function recordPayment(
    id: string,
    additionalAmount: number,
    options: { paymentMethod?: PaymentMethodEnum; receiptNumber?: string; note?: string } = {}
  ): Promise<{ data: SaleWithRelations | null; error: any }> {
    const existing = sales.value.find(s => s.id === id)
    if (!existing) {
      return { data: null, error: new Error('Venta no encontrada') }
    }

    const newAmountPaid = Number(existing.amount_paid) + Number(additionalAmount)
    const newBalanceDue = Math.max(0, Number(existing.total_amount) - newAmountPaid)
    const newStatus: PaymentStatusEnum = newBalanceDue === 0 ? 'paid' : 'partial'

    const payload: SaleUpdate = {
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      payment_status: newStatus
    }

    if (options.paymentMethod) {
      payload.payment_method = options.paymentMethod
    }
    if (options.receiptNumber) {
      payload.receipt_number = options.receiptNumber
    }
    if (options.note) {
      payload.notes = existing.notes ? `${existing.notes} | ${options.note}` : options.note
    }

    return updateSale(id, payload)
  }

  /**
   * Elimina un registro de venta.
   */
  async function deleteSale(id: string): Promise<{ error: any }> {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (err) throw err

      // Remoción reactiva local en memoria (0 ms)
      sales.value = sales.value.filter(s => s.id !== id)
      lastFetched.value = Date.now()

      return { error: null }
    } catch (err: any) {
      error.value = err?.message || 'Error al eliminar venta'
      console.error('Error deleting sale:', err)
      return { error: err }
    } finally {
      loading.value = false
    }
  }

  /**
   * Invalida la caché para forzar consulta remota en la siguiente llamada.
   */
  function invalidateCache() {
    lastFetched.value = null
  }

  /**
   * Purga el estado en memoria al cerrar sesión para garantizar aislamiento en terminales compartidas (ADR-05).
   */
  function clearSalesState() {
    sales.value = []
    lastFetched.value = null
  }

  return {
    sales,
    loading,
    error,
    isCacheValid,
    totalRevenue,
    totalCollected,
    totalPendingBalance,
    totalTicketsSold,
    salesWithPendingBalance,
    fetchSales,
    fetchSaleById,
    createSale,
    updateSale,
    recordPayment,
    deleteSale,
    invalidateCache,
    clearSalesState
  }
}
