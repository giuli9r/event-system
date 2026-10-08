<script setup lang="ts">
import type { SaleWithRelations, PaymentMethodEnum, PaymentStatusEnum } from '~/composables/useSales'
import type { EventWithRelations } from '~/composables/useEvents'
import type { Customer } from '~/composables/useCustomers'
import { calculateSaleAmounts, isQuantityEmptyOrZero } from '~~/shared/utils/salesCalculator'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Ventas y Módulo Contable | Tripu Admin'
})

const toast = useToast()

// Composables de dominio
const {
  sales,
  loading: salesLoading,
  error: salesError,
  totalRevenue,
  totalCollected,
  totalPendingBalance,
  totalTicketsSold,
  salesWithPendingBalance,
  fetchSales,
  createSale,
  updateSale,
  recordPayment,
  deleteSale
} = useSales()

const {
  events,
  loading: eventsLoading,
  fetchEvents
} = useEvents()

const {
  customers,
  loading: customersLoading,
  fetchCustomers
} = useCustomers()

// Estados de Toolbar y Filtros
const searchQuery = ref('')
const selectedEventFilter = ref<string>('all')
const selectedStatusFilter = ref<string>('all')
const selectedPaymentMethodFilter = ref<string>('all')

const statusFilterOptions = [
  { value: 'all', label: 'Todas las Ventas' },
  { value: 'pending_balance', label: '🔥 Con Saldo Pendiente (Cobro en Caliente)', count: salesWithPendingBalance.value.length },
  { value: 'paid', label: 'Saldadas' },
  { value: 'partial', label: 'Con Seña' },
  { value: 'pending', label: 'Sin Pagos' }
]

const paymentMethodOptions = [
  { value: 'all', label: 'Todos los Métodos' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'mixto', label: 'Pago Mixto' }
]

// Filtrado reactivo en memoria (0 ms)
const filteredSales = computed(() => {
  return sales.value.filter((sale) => {
    // Filtro por viaje
    if (selectedEventFilter.value !== 'all' && sale.event_id !== selectedEventFilter.value) {
      return false
    }

    // Filtro por estado de pago / saldo
    if (selectedStatusFilter.value === 'pending_balance') {
      if (Number(sale.balance_due) <= 0 || sale.payment_status === 'canceled' || sale.payment_status === 'refunded') {
        return false
      }
    } else if (selectedStatusFilter.value !== 'all') {
      if (sale.payment_status !== selectedStatusFilter.value) {
        return false
      }
    }

    // Filtro por método de pago
    if (selectedPaymentMethodFilter.value !== 'all' && sale.payment_method !== selectedPaymentMethodFilter.value) {
      return false
    }

    // Filtro predictivo de texto
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true

    const customerName = `${sale.customer?.name || ''} ${sale.customer?.lastname || ''}`.toLowerCase()
    const customerDni = (sale.customer?.dni || '').toLowerCase()
    const customerPhone = (sale.customer?.phone || '').toLowerCase()
    const eventTitle = (sale.event?.title || '').toLowerCase()
    const receiptNum = (sale.receipt_number || '').toLowerCase()
    const seatNum = (sale.seat_number || '').toLowerCase()
    const notes = (sale.notes || '').toLowerCase()

    return customerName.includes(q) ||
      customerDni.includes(q) ||
      customerPhone.includes(q) ||
      eventTitle.includes(q) ||
      receiptNum.includes(q) ||
      seatNum.includes(q) ||
      notes.includes(q)
  })
})

// Helpers de Formato
function formatCurrency(val: number | string | null | undefined): string {
  const num = Number(val) || 0
  return `$${num.toLocaleString('es-AR')}`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function formatWhatsAppUrl(phone: string | null | undefined, sale: SaleWithRelations): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (!cleaned) return null
  const msg = encodeURIComponent(
    `¡Hola ${sale.customer?.name}! Te escribimos desde Tripu Producciones respecto a tu viaje para "${sale.event?.title}". ` +
    (sale.balance_due > 0
      ? `Te recordamos que contás con un saldo pendiente de ${formatCurrency(sale.balance_due)} a abonar antes de subir al micro.`
      : `Tu pasaje se encuentra saldado en su totalidad. ¡Nos vemos en la salida!`)
  )
  return `https://wa.me/${cleaned}?text=${msg}`
}

function getPaymentStatusBadge(status: PaymentStatusEnum, balanceDue: number) {
  if (balanceDue > 0 && status !== 'canceled' && status !== 'refunded') {
    return {
      label: 'Saldo Pendiente',
      class: 'bg-red-500/15 text-red-400 border-red-500/40 font-bold',
      icon: 'i-heroicons-exclamation-circle'
    }
  }

  switch (status) {
    case 'paid':
      return {
        label: 'Saldado',
        class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: 'i-heroicons-check-circle'
      }
    case 'partial':
      return {
        label: 'Con Seña',
        class: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: 'i-heroicons-clock'
      }
    case 'pending':
      return {
        label: 'Sin Pagos',
        class: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: 'i-heroicons-banknotes'
      }
    case 'refunded':
      return {
        label: 'Reembolsado',
        class: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        icon: 'i-heroicons-arrow-path'
      }
    case 'canceled':
      return {
        label: 'Anulada',
        class: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        icon: 'i-heroicons-no-symbol'
      }
    default:
      return {
        label: status,
        class: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        icon: 'i-heroicons-tag'
      }
  }
}

// Sincronización general
async function refreshAll() {
  await Promise.all([
    fetchSales({ force: true }),
    fetchEvents({ force: true }),
    fetchCustomers({ force: true })
  ])
  toast.add({
    title: 'Datos sincronizados',
    description: 'Se actualizaron las ventas, viajes y directorio de clientes.',
    color: 'success',
    icon: 'i-heroicons-arrow-path'
  })
}

// ============================================================================
// MODAL DE REGISTRO / EDICIÓN DE VENTA
// ============================================================================
const isSaleModalOpen = ref(false)
const isEditing = ref(false)
const saleToEditId = ref<string | null>(null)
const submittingSale = ref(false)

const saleForm = reactive({
  sale_date: new Date().toISOString().slice(0, 10),
  event_id: '',
  customer_id: '',
  package_tier_id: '',
  quantity: 1 as number | null,
  unit_price: 0 as number | null,
  total_amount: 0,
  amount_paid: 0 as number | null,
  balance_due: 0,
  installments: 1,
  payment_method: 'transferencia' as PaymentMethodEnum,
  payment_status: 'paid' as PaymentStatusEnum,
  seat_number: '',
  boarding_location: '',
  receipt_number: '',
  notes: ''
})

// Validación reactiva de cantidad (0, null, undefined o negativo)
const isQuantityInvalid = computed(() => {
  return isQuantityEmptyOrZero(saleForm.quantity)
})

// Validación reactiva de importes
const isPaidNegative = computed(() => {
  return saleForm.amount_paid !== null && saleForm.amount_paid !== undefined && Number(saleForm.amount_paid) < 0
})

const isPaidExceedsTotal = computed(() => {
  return Number(saleForm.amount_paid || 0) > Number(saleForm.total_amount || 0)
})

const isPaidInvalid = computed(() => {
  return isPaidNegative.value || isPaidExceedsTotal.value
})

// Evento seleccionado en el formulario para resolver paquetes
const selectedFormEvent = computed(() => {
  return events.value.find(e => e.id === saleForm.event_id) || null
})

/**
 * Recalcula en tiempo real Total Pactado y Saldo Pendiente:
 * - Cantidad de Pasajes * Precio Unitario = Total Pactado
 * - Total Pactado - Abonado Hoy = Saldo Pendiente
 * - Si cantidad es 0, null o undefined -> Total Pactado es 0 y se marca con error visual
 */
function recalculateAmounts() {
  const calc = calculateSaleAmounts({
    quantity: saleForm.quantity,
    unit_price: saleForm.unit_price,
    amount_paid: saleForm.amount_paid
  })

  // Sincronizar importes reactivos
  saleForm.total_amount = calc.total_amount
  saleForm.balance_due = calc.balance_due

  // Sincronizar estado de cobro
  if (calc.total_amount === 0) {
    saleForm.payment_status = 'paid' // Entrada cortesía/regalo
  } else if (calc.balance_due === 0 && Number(saleForm.amount_paid) > 0) {
    saleForm.payment_status = 'paid'
  } else if (Number(saleForm.amount_paid) > 0 && calc.balance_due > 0) {
    saleForm.payment_status = 'partial'
  } else if (Number(saleForm.amount_paid) === 0) {
    saleForm.payment_status = 'pending'
  }
}

// Reactividad en tiempo real: Si cambia Cantidad de Pasajeros o Precio Unitario
watch(
  [() => saleForm.quantity, () => saleForm.unit_price],
  () => {
    recalculateAmounts()
  }
)

// Reactividad en tiempo real: Si cambia Abonado Hoy
watch(
  () => saleForm.amount_paid,
  () => {
    recalculateAmounts()
  }
)

// Cuando se selecciona un evento, auto-precargar ubicación y paquetes
watch(
  () => saleForm.event_id,
  (newEventId) => {
    if (!newEventId) return
    const ev = events.value.find(e => e.id === newEventId)
    if (ev) {
      if (!saleForm.boarding_location) {
        saleForm.boarding_location = ev.departure_location || 'Terminal - San Francisco'
      }
      // Si el evento tiene paquetes y no hay ninguno seleccionado, seleccionar el primero
      if (ev.package_tiers && ev.package_tiers.length > 0 && !isEditing.value) {
        saleForm.package_tier_id = ev.package_tiers[0].id
        handlePackageTierChange()
      }
    }
  }
)

// Cuando se selecciona un paquete, precargar precio unitario y recalcular
function handlePackageTierChange() {
  if (!selectedFormEvent.value || !saleForm.package_tier_id) return
  const tier = selectedFormEvent.value.package_tiers?.find(t => t.id === saleForm.package_tier_id)
  if (tier) {
    saleForm.unit_price = Number(tier.price) || 0
    recalculateAmounts()
  }
}

// Presets de pago en el formulario
function applyPaymentPreset(preset: 'total' | 'half' | 'zero') {
  const total = Number(saleForm.total_amount) || 0
  if (preset === 'total') {
    saleForm.amount_paid = total
  } else if (preset === 'half') {
    saleForm.amount_paid = Math.round(total / 2)
  } else {
    saleForm.amount_paid = 0
  }
  recalculateAmounts()
}

function openCreateSaleModal() {
  isEditing.value = false
  saleToEditId.value = null

  // Reset del formulario
  saleForm.sale_date = new Date().toISOString().slice(0, 10)
  saleForm.event_id = events.value[0]?.id || ''
  saleForm.customer_id = customers.value[0]?.id || ''
  saleForm.package_tier_id = ''
  saleForm.quantity = 1
  saleForm.unit_price = 0
  saleForm.total_amount = 0
  saleForm.amount_paid = 0
  saleForm.balance_due = 0
  saleForm.installments = 1
  saleForm.payment_method = 'transferencia'
  saleForm.payment_status = 'paid'
  saleForm.seat_number = ''
  saleForm.boarding_location = ''
  saleForm.receipt_number = ''
  saleForm.notes = ''

  if (saleForm.event_id) {
    const ev = events.value.find(e => e.id === saleForm.event_id)
    if (ev && ev.package_tiers && ev.package_tiers.length > 0) {
      saleForm.package_tier_id = ev.package_tiers[0].id
      saleForm.unit_price = Number(ev.package_tiers[0].price) || 0
      saleForm.boarding_location = ev.departure_location || 'Terminal - San Francisco'
    }
  }

  recalculateAmounts()
  saleForm.amount_paid = saleForm.total_amount
  recalculateAmounts()

  isSaleModalOpen.value = true
}

function openEditSaleModal(sale: SaleWithRelations) {
  isEditing.value = true
  saleToEditId.value = sale.id

  saleForm.sale_date = sale.sale_date ? new Date(sale.sale_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  saleForm.event_id = sale.event_id
  saleForm.customer_id = sale.customer_id
  saleForm.package_tier_id = sale.package_tier_id || ''
  saleForm.quantity = sale.quantity || 1
  saleForm.unit_price = Number(sale.unit_price) || 0
  saleForm.amount_paid = Number(sale.amount_paid) || 0
  saleForm.installments = sale.installments || 1
  saleForm.payment_method = sale.payment_method
  saleForm.payment_status = sale.payment_status
  saleForm.seat_number = sale.seat_number || ''
  saleForm.boarding_location = sale.boarding_location || ''
  saleForm.receipt_number = sale.receipt_number || ''
  saleForm.notes = sale.notes || ''

  recalculateAmounts()

  isSaleModalOpen.value = true
}

async function handleSaveSale() {
  if (isQuantityInvalid.value) {
    toast.add({ title: 'Atención', description: 'La cantidad de pasajes debe ser al menos 1', color: 'warning' })
    return
  }
  if (!saleForm.event_id) {
    toast.add({ title: 'Atención', description: 'Debes seleccionar un viaje para la venta', color: 'warning' })
    return
  }
  if (!saleForm.customer_id) {
    toast.add({ title: 'Atención', description: 'Debes seleccionar un cliente/pasajero', color: 'warning' })
    return
  }
  if (saleForm.total_amount < 0) {
    toast.add({ title: 'Atención', description: 'El importe total no puede ser negativo', color: 'warning' })
    return
  }
  if (isPaidNegative.value) {
    toast.add({ title: 'Atención', description: 'El monto abonado hoy no puede ser negativo', color: 'warning' })
    return
  }
  if (isPaidExceedsTotal.value) {
    toast.add({ title: 'Atención', description: 'El monto abonado no puede superar el total pactado', color: 'warning' })
    return
  }

  submittingSale.value = true
  try {
    const payload = {
      sale_date: new Date(saleForm.sale_date).toISOString(),
      event_id: saleForm.event_id,
      customer_id: saleForm.customer_id,
      package_tier_id: saleForm.package_tier_id || null,
      quantity: Number(saleForm.quantity),
      unit_price: Number(saleForm.unit_price),
      total_amount: Number(saleForm.total_amount),
      amount_paid: Number(saleForm.amount_paid),
      balance_due: Number(saleForm.balance_due),
      installments: Number(saleForm.installments) || 1,
      payment_method: saleForm.payment_method,
      payment_status: saleForm.payment_status,
      seat_number: saleForm.seat_number ? saleForm.seat_number.trim() : null,
      boarding_location: saleForm.boarding_location ? saleForm.boarding_location.trim() : null,
      receipt_number: saleForm.receipt_number ? saleForm.receipt_number.trim() : null,
      notes: saleForm.notes ? saleForm.notes.trim() : null
    }

    if (isEditing.value && saleToEditId.value) {
      const { error: err } = await updateSale(saleToEditId.value, payload)
      if (err) throw err
      toast.add({
        title: 'Venta actualizada',
        description: 'Se guardaron los cambios del registro contable.',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      const { error: err } = await createSale(payload)
      if (err) throw err
      toast.add({
        title: '¡Venta registrada con éxito!',
        description: 'El pasaje ha sido asentado en el libro contable.',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }

    isSaleModalOpen.value = false
  } catch (err: any) {
    toast.add({
      title: 'Error al procesar la venta',
      description: err?.message || 'No se pudo guardar la operación contable',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submittingSale.value = false
  }
}

// ============================================================================
// MODAL RÁPIDO: COBRO EN CALIENTE (EN PUERTA DEL MICRO)
// ============================================================================
const isQuickPayModalOpen = ref(false)
const saleToPay = ref<SaleWithRelations | null>(null)
const submittingQuickPay = ref(false)
const quickPayAmount = ref<number>(0)
const quickPayMethod = ref<PaymentMethodEnum>('efectivo')
const quickPayReceipt = ref('')
const quickPayNote = ref('')

function openQuickPayModal(sale: SaleWithRelations) {
  saleToPay.value = sale
  quickPayAmount.value = Number(sale.balance_due) || 0
  quickPayMethod.value = 'efectivo'
  quickPayReceipt.value = ''
  quickPayNote.value = 'Cobro en puerta / ingreso al micro'
  isQuickPayModalOpen.value = true
}

async function handleConfirmQuickPay() {
  if (!saleToPay.value) return
  if (quickPayAmount.value <= 0) {
    toast.add({ title: 'Monto inválido', description: 'El cobro debe ser mayor a $0', color: 'warning' })
    return
  }

  submittingQuickPay.value = true
  try {
    const { error: err } = await recordPayment(saleToPay.value.id, quickPayAmount.value, {
      paymentMethod: quickPayMethod.value,
      receiptNumber: quickPayReceipt.value ? quickPayReceipt.value.trim() : undefined,
      note: quickPayNote.value ? quickPayNote.value.trim() : undefined
    })

    if (err) throw err

    toast.add({
      title: '¡Cobro asentado!',
      description: `Se cobraron ${formatCurrency(quickPayAmount.value)} a ${saleToPay.value.customer?.name} ${saleToPay.value.customer?.lastname}.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    isQuickPayModalOpen.value = false
    saleToPay.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al cobrar',
      description: err?.message || 'No se pudo asentar el pago',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submittingQuickPay.value = false
  }
}

// ============================================================================
// MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// ============================================================================
const isDeleteModalOpen = ref(false)
const saleToDelete = ref<SaleWithRelations | null>(null)
const deletingSale = ref(false)

function openDeleteModal(sale: SaleWithRelations) {
  saleToDelete.value = sale
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!saleToDelete.value) return
  deletingSale.value = true
  try {
    const { error: err } = await deleteSale(saleToDelete.value.id)
    if (err) throw err
    toast.add({
      title: 'Venta anulada',
      description: 'El registro de venta ha sido removido.',
      color: 'warning',
      icon: 'i-heroicons-trash'
    })
    isDeleteModalOpen.value = false
    saleToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al eliminar',
      description: err?.message || 'No se pudo eliminar el registro',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    deletingSale.value = false
  }
}

onMounted(() => {
  fetchSales()
  fetchEvents()
  fetchCustomers()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Encabezado Principal -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl sm:text-3xl font-black text-[#F5EEDC] tracking-tight">
            Ventas y Cobranzas
          </h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/30">
            Módulo Contable
          </span>
        </div>
        <p class="text-sm text-zinc-400 mt-1">
          Registro de pasajes vendidos por viaje, trazabilidad de señas, cuotas y cobros en caliente.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          icon="i-heroicons-arrow-path"
          :loading="salesLoading || eventsLoading || customersLoading"
          @click="refreshAll"
        >
          Sincronizar
        </UButton>
        <UButton
          size="sm"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-md shadow-[#E53924]/20"
          icon="i-heroicons-plus"
          @click="openCreateSaleModal"
        >
          Nueva Venta
        </UButton>
      </div>
    </div>

    <!-- Grilla de Tarjetas de Resumen Financiero (KPIs) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Tarjeta 1: Facturación Total -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Facturación Pactada
            </p>
            <p class="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono">
              <span v-if="salesLoading && sales.length === 0">...</span>
              <span v-else>{{ formatCurrency(totalRevenue) }}</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Total neto pactado</span>
            <span class="font-mono text-zinc-300 font-bold">{{ sales.length }} operaciones</span>
          </div>
        </template>
      </UCard>

      <!-- Tarjeta 2: Cobrado a la Fecha -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Cobrado / Efectivo
            </p>
            <p class="text-2xl sm:text-3xl font-black text-blue-400 mt-2 font-mono">
              <span v-if="salesLoading && sales.length === 0">...</span>
              <span v-else>{{ formatCurrency(totalCollected) }}</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <UIcon name="i-heroicons-check-badge" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Ingresos percibidos</span>
            <span class="text-blue-400 font-bold">
              {{ totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0 }}% liquidado
            </span>
          </div>
        </template>
      </UCard>

      <!-- Tarjeta 3: Saldos Pendientes (Cobro en Caliente) -->
      <UCard
        class="bg-[#1A1A22] rounded-xl transition-colors"
        :class="totalPendingBalance > 0 ? 'border-red-500/40 bg-red-950/10' : 'border-[#2A2A38]'"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-1.5">
              <p class="text-xs uppercase tracking-wider text-red-400 font-bold">
                Saldo Pendiente
              </p>
              <span v-if="totalPendingBalance > 0" class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <p class="text-2xl sm:text-3xl font-black text-[#E53924] mt-2 font-mono">
              <span v-if="salesLoading && sales.length === 0">...</span>
              <span v-else>{{ formatCurrency(totalPendingBalance) }}</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924]">
            <UIcon name="i-heroicons-fire" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <button
            type="button"
            class="text-[11px] text-red-400 hover:text-red-300 flex items-center justify-between w-full font-semibold cursor-pointer"
            @click="selectedStatusFilter = 'pending_balance'"
          >
            <span>Cobro en puerta / colectivo</span>
            <span class="underline">{{ salesWithPendingBalance.length }} pasajeros deben</span>
          </button>
        </template>
      </UCard>

      <!-- Tarjeta 4: Pasajes Vendidos -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Pasajes / Butacas
            </p>
            <p class="text-2xl sm:text-3xl font-black text-[#F5EEDC] mt-2 font-mono">
              <span v-if="salesLoading && sales.length === 0">...</span>
              <span v-else>{{ totalTicketsSold }}</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UIcon name="i-heroicons-ticket" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Cupos confirmados</span>
            <span class="text-purple-400 font-bold">En todos los viajes</span>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Barra de Búsqueda y Filtros Operativos -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#1A1A22] p-3 rounded-xl border border-[#2A2A38]">
      <div class="flex-1 max-w-md">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por Pasajero, DNI, Show, Comprobante o Butaca..."
          class="w-full"
        />
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Filtro por Viaje / Show -->
        <select
          v-model="selectedEventFilter"
          class="rounded-lg bg-[#14141A] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2 focus:outline-none focus:border-[#E53924] cursor-pointer max-w-[200px] truncate"
        >
          <option value="all">Todos los Viajes</option>
          <option v-for="ev in events" :key="ev.id" :value="ev.id">
            {{ ev.title }} ({{ formatDate(ev.departure_time) }})
          </option>
        </select>

        <!-- Filtro por Estado / Saldo Pendiente -->
        <select
          v-model="selectedStatusFilter"
          class="rounded-lg bg-[#14141A] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2 focus:outline-none focus:border-[#E53924] cursor-pointer"
        >
          <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <!-- Filtro por Medio de Pago -->
        <select
          v-model="selectedPaymentMethodFilter"
          class="rounded-lg bg-[#14141A] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2 focus:outline-none focus:border-[#E53924] cursor-pointer"
        >
          <option v-for="opt in paymentMethodOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <div class="text-xs text-zinc-400 px-2 font-medium hidden lg:block">
          Mostrando {{ filteredSales.length }} de {{ sales.length }}
        </div>
      </div>
    </div>

    <!-- Estado de Error de Red -->
    <UAlert
      v-if="salesError"
      title="Error al conectar con el libro de ventas"
      :description="salesError"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
    >
      <template #actions>
        <UButton size="xs" variant="solid" color="error" @click="fetchSales({ force: true })">
          Reintentar Carga
        </UButton>
      </template>
    </UAlert>

    <!-- Estado de Carga Inicial -->
    <div v-if="salesLoading && sales.length === 0" class="py-16 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando libro contable de ventas...</p>
    </div>

    <!-- Estado Vacío -->
    <UCard
      v-else-if="!salesLoading && filteredSales.length === 0"
      class="bg-[#1A1A22] border-[#2A2A38] text-center py-16"
    >
      <div class="max-w-md mx-auto space-y-3">
        <div class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
          <UIcon name="i-heroicons-banknotes" class="w-6 h-6" />
        </div>
        <h3 class="text-base font-bold text-[#F5EEDC]">
          No se encontraron ventas
        </h3>
        <p class="text-xs text-zinc-400">
          {{ searchQuery || selectedStatusFilter !== 'all' || selectedEventFilter !== 'all'
            ? 'No hay registros que coincidan con los filtros aplicados. Intentá restablecer la búsqueda.'
            : 'Aún no asentaste ventas en el sistema. Hacé clic en "Nueva Venta" para registrar la primera.' }}
        </p>
        <div class="pt-2">
          <UButton
            size="xs"
            class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold"
            icon="i-heroicons-plus"
            @click="openCreateSaleModal"
          >
            Registrar Primera Venta
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Tabla Catálogo Semántica (ADR-06) -->
    <UCard
      v-else
      class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-[#2A2A38] text-left text-xs sm:text-sm">
          <thead class="bg-[#14141A] text-[11px] sm:text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-4 py-3.5 whitespace-nowrap">Fecha / Comprobante</th>
              <th scope="col" class="px-4 py-3.5">Pasajero / DNI</th>
              <th scope="col" class="px-4 py-3.5">Viaje &amp; Show</th>
              <th scope="col" class="px-4 py-3.5">Paquete &amp; Butaca</th>
              <th scope="col" class="px-4 py-3.5 whitespace-nowrap">Importe Pactado</th>
              <th scope="col" class="px-4 py-3.5 whitespace-nowrap">Estado / Saldo en Puerta</th>
              <th scope="col" class="px-4 py-3.5 text-right whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr
              v-for="sale in filteredSales"
              :key="sale.id"
              class="hover:bg-[#20202B] transition-colors"
              :class="sale.balance_due > 0 ? 'bg-red-950/5' : ''"
            >
              <!-- 1. Fecha / Comprobante -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <div class="space-y-0.5">
                  <p class="font-medium text-[#F5EEDC] text-xs">
                    {{ formatDate(sale.sale_date) }}
                  </p>
                  <p v-if="sale.receipt_number" class="text-[10px] text-zinc-400 font-mono">
                    Comp: {{ sale.receipt_number }}
                  </p>
                  <p v-else class="text-[10px] text-zinc-600 italic">
                    Sin comp.
                  </p>
                </div>
              </td>

              <!-- 2. Pasajero / DNI -->
              <td class="px-4 py-3.5">
                <div v-if="sale.customer" class="min-w-0">
                  <p class="font-bold text-[#F5EEDC] text-xs truncate max-w-[150px] sm:max-w-[180px]">
                    {{ sale.customer.name }} {{ sale.customer.lastname }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 px-1 rounded">
                      DNI {{ sale.customer.dni }}
                    </span>
                    <a
                      v-if="sale.customer.phone"
                      :href="formatWhatsAppUrl(sale.customer.phone, sale) || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-emerald-400 hover:text-emerald-300 inline-flex items-center text-[10px] gap-0.5 font-medium"
                      title="Enviar mensaje por WhatsApp"
                    >
                      <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-3 h-3" />
                      <span>WA</span>
                    </a>
                  </div>
                </div>
                <span v-else class="text-xs text-zinc-500 italic">Cliente no encontrado</span>
              </td>

              <!-- 3. Viaje & Show -->
              <td class="px-4 py-3.5">
                <div v-if="sale.event" class="min-w-0">
                  <p class="font-semibold text-xs text-[#F5EEDC] truncate max-w-[150px] sm:max-w-[200px]" :title="sale.event.title">
                    {{ sale.event.title }}
                  </p>
                  <p class="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-[150px]">
                    <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-zinc-500 shrink-0" />
                    <span class="truncate">{{ sale.event.venue?.name || 'Recinto' }}</span>
                  </p>
                </div>
                <span v-else class="text-xs text-zinc-500 italic">Viaje no asignado</span>
              </td>

              <!-- 4. Paquete & Butaca -->
              <td class="px-4 py-3.5">
                <div class="min-w-0 space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-medium text-zinc-200 truncate max-w-[120px]">
                      {{ sale.package_tier?.name || 'Paquete Estándar' }}
                    </span>
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                      {{ sale.quantity }} pax
                    </span>
                  </div>
                  <div v-if="sale.seat_number" class="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                    <UIcon name="i-heroicons-map-pin" class="w-3 h-3 shrink-0" />
                    <span>Butaca: {{ sale.seat_number }}</span>
                  </div>
                </div>
              </td>

              <!-- 5. Importe Pactado & Cuotas -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <div class="space-y-0.5">
                  <p class="font-mono text-xs font-bold text-[#F5EEDC]">
                    {{ formatCurrency(sale.total_amount) }}
                  </p>
                  <p class="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                    <span>Abonado: {{ formatCurrency(sale.amount_paid) }}</span>
                    <span v-if="sale.installments > 1" class="text-zinc-500">
                      ({{ sale.installments }} cuotas)
                    </span>
                  </p>
                </div>
              </td>

              <!-- 6. Estado / Saldo en Puerta (Cobro en Caliente) -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <div class="space-y-1">
                  <!-- Alerta de Saldo Pendiente para cobro en el colectivo -->
                  <div v-if="sale.balance_due > 0" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 shrink-0" />
                    <span>Resta: {{ formatCurrency(sale.balance_due) }}</span>
                  </div>
                  <div v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border" :class="getPaymentStatusBadge(sale.payment_status, sale.balance_due).class">
                    <UIcon :name="getPaymentStatusBadge(sale.payment_status, sale.balance_due).icon" class="w-3 h-3 shrink-0" />
                    <span>{{ getPaymentStatusBadge(sale.payment_status, sale.balance_due).label }}</span>
                  </div>

                  <p class="text-[10px] text-zinc-500 capitalize">
                    Pago: {{ sale.payment_method.replace('_', ' ') }}
                  </p>
                </div>
              </td>

              <!-- 7. Acciones -->
              <td class="px-4 py-3.5 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1">
                  <!-- Botón Estrella: Cobrar en Caliente -->
                  <button
                    v-if="sale.balance_due > 0"
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-sm shadow-red-600/30"
                    title="Cobrar saldo restante ahora mismo"
                    @click="openQuickPayModal(sale)"
                  >
                    <UIcon name="i-heroicons-banknotes" class="w-3.5 h-3.5" />
                    <span>Cobrar</span>
                  </button>

                  <!-- Botón Editar -->
                  <button
                    type="button"
                    class="p-1.5 text-zinc-400 hover:text-amber-400 rounded hover:bg-[#2A2A38]/50 transition-colors cursor-pointer"
                    title="Editar venta completa"
                    @click="openEditSaleModal(sale)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>

                  <!-- Botón Eliminar -->
                  <button
                    type="button"
                    class="p-1.5 text-zinc-500 hover:text-rose-400 rounded hover:bg-[#2A2A38]/50 transition-colors cursor-pointer"
                    title="Anular venta"
                    @click="openDeleteModal(sale)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- ============================================================== -->
    <!-- MODAL DE NUEVA VENTA / EDICIÓN COMPLETA                        -->
    <!-- ============================================================== -->
    <UModal
      v-model:open="isSaleModalOpen"
      :title="isEditing ? 'Editar Registro de Venta' : 'Asentar Nueva Venta de Pasaje'"
      :description="isEditing ? 'Modificá los importes, cuotas, butacas u observaciones contables.' : 'Registrá la venta vinculando al pasajero con el viaje y congelando el importe histórico.'"
    >
      <template #body>
        <div class="space-y-4 pt-1 max-h-[75vh] overflow-y-auto px-1">
          <!-- Bloque 1: Viaje y Pasajero -->
          <div class="p-3.5 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-3">
            <div class="text-xs font-bold uppercase tracking-wider text-[#FF5733] flex items-center gap-1.5">
              <UIcon name="i-heroicons-ticket" class="w-3.5 h-3.5" />
              1. Selección de Viaje y Pasajero
            </div>

            <!-- Viaje -->
            <UFormField label="Viaje / Show de Destino" required>
              <select
                v-model="saleForm.event_id"
                class="w-full rounded-lg bg-[#0F0F12] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
              >
                <option value="" disabled>Seleccioná un viaje...</option>
                <option v-for="ev in events" :key="ev.id" :value="ev.id">
                  {{ ev.title }} · {{ ev.venue?.name || 'Recinto' }} ({{ formatDate(ev.departure_time) }})
                </option>
              </select>
            </UFormField>

            <!-- Pasajero -->
            <UFormField label="Pasajero / Cliente Titular" required help="Podés agregar acompañantes extras en el campo de observaciones">
              <select
                v-model="saleForm.customer_id"
                class="w-full rounded-lg bg-[#0F0F12] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
              >
                <option value="" disabled>Seleccioná al cliente...</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.lastname }}, {{ c.name }} · DNI {{ c.dni }} ({{ c.city || 'Sin ciudad' }})
                </option>
              </select>
            </UFormField>

            <!-- Paquete -->
            <div v-if="selectedFormEvent && selectedFormEvent.package_tiers && selectedFormEvent.package_tiers.length > 0">
              <UFormField label="Opción de Paquete" help="Seleccionar una tarifa actualiza automáticamente el valor unitario">
                <select
                  v-model="saleForm.package_tier_id"
                  class="w-full rounded-lg bg-[#0F0F12] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
                  @change="handlePackageTierChange"
                >
                  <option value="">Seleccionar paquete...</option>
                  <option v-for="t in selectedFormEvent.package_tiers" :key="t.id" :value="t.id">
                    {{ t.name }} · {{ formatCurrency(t.price) }} {{ t.includes_ticket ? '(Incluye Entrada)' : '(Solo Traslado)' }}
                  </option>
                </select>
              </UFormField>
            </div>
          </div>

          <!-- Bloque 2: Cantidad, Importes y Plan de Cuotas -->
          <div class="p-3.5 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-3">
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-banknotes" class="w-3.5 h-3.5" />
                <span>2. Cantidad, Importes y Plan de Cuotas</span>
              </div>
              <span class="text-[10px] text-zinc-400 font-normal">Cálculo reactivo en tiempo real</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Cantidad de Pasajes -->
              <UFormField
                label="Cantidad de Pasajes"
                required
                :error="isQuantityInvalid ? 'Debe ser al menos 1' : undefined"
              >
                <UInput
                  v-model.number="saleForm.quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  class="w-full transition-all"
                  :class="isQuantityInvalid ? '!border-red-500 !ring-2 !ring-red-500/80 rounded-lg' : ''"
                  @input="recalculateAmounts"
                />
              </UFormField>

              <!-- Precio Unitario -->
              <UFormField label="Precio Unitario (ARS)" required>
                <UInput
                  v-model.number="saleForm.unit_price"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full"
                  @input="recalculateAmounts"
                />
              </UFormField>

              <!-- Total Pactado (Calculado automáticamente) -->
              <UFormField
                label="Total Pactado (ARS)"
                required
                :error="isQuantityInvalid ? 'Cantidad inválida (Total = $0)' : undefined"
                help="Cantidad x Precio Unitario"
              >
                <UInput
                  :model-value="saleForm.total_amount"
                  type="number"
                  readonly
                  class="w-full font-bold cursor-not-allowed bg-zinc-900/60"
                  :class="isQuantityInvalid ? '!border-red-500 !ring-2 !ring-red-500/80 rounded-lg !text-red-400' : '!text-emerald-400'"
                />
              </UFormField>
            </div>

            <!-- Cobro Inicial / Seña y Saldo Pendiente -->
            <div class="p-3 bg-[#0F0F12] rounded-lg border border-[#2A2A38] space-y-2">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <span class="text-xs text-zinc-300 font-semibold">Monto Abonado a la Fecha:</span>
                <!-- Presets rápidos -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    @click="applyPaymentPreset('total')"
                  >
                    100% Total
                  </button>
                  <button
                    type="button"
                    class="px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    @click="applyPaymentPreset('half')"
                  >
                    50% Seña
                  </button>
                  <button
                    type="button"
                    class="px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    @click="applyPaymentPreset('zero')"
                  >
                    $0 Deuda
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Abonado Hoy -->
                <UFormField
                  label="Abonado Hoy (ARS)"
                  :error="isPaidExceedsTotal ? 'El abonado no puede superar el total pactado' : isPaidNegative ? 'No puede ser negativo' : undefined"
                >
                  <UInput
                    v-model.number="saleForm.amount_paid"
                    type="number"
                    min="0"
                    class="w-full transition-all"
                    :class="isPaidInvalid ? '!border-red-500 !ring-2 !ring-red-500/80 rounded-lg !text-red-400' : ''"
                    @input="recalculateAmounts"
                  />
                </UFormField>

                <!-- Saldo Pendiente Reactivo -->
                <div class="flex flex-col justify-end">
                  <div
                    class="p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors"
                    :class="[
                      saleForm.balance_due > 0 
                        ? 'bg-red-950/20 border-red-500/50 text-red-400' 
                        : 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400'
                    ]"
                  >
                    <span class="font-semibold flex items-center gap-1">
                      <UIcon :name="saleForm.balance_due > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'" class="w-4 h-4" />
                      <span>Saldo Pendiente:</span>
                    </span>
                    <span class="font-bold font-mono text-sm">
                      {{ formatCurrency(saleForm.balance_due) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cuotas y Medio de Pago -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UFormField label="Plan de Cuotas (Cantidad)" help="Indica en cuántas cuotas se pactó">
                <select
                  v-model.number="saleForm.installments"
                  class="w-full rounded-lg bg-[#0F0F12] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
                >
                  <option :value="1">1 Pago (Contado)</option>
                  <option :value="2">2 Cuotas (Seña + Saldo)</option>
                  <option :value="3">3 Cuotas</option>
                  <option :value="4">4 Cuotas</option>
                </select>
              </UFormField>

              <UFormField label="Método de Pago">
                <select
                  v-model="saleForm.payment_method"
                  class="w-full rounded-lg bg-[#0F0F12] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="tarjeta_debito">Tarjeta de Débito</option>
                  <option value="mercado_pago">Mercado Pago</option>
                  <option value="mixto">Pago Mixto</option>
                </select>
              </UFormField>
            </div>
          </div>

          <!-- Bloque 3: Asignación de Butaca, Logística y Notas -->
          <div class="p-3.5 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-3">
            <div class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5" />
              3. Butaca, Logística y Pasajeros Adicionales
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UFormField label="Butaca Asignada" help="Alfanumérico (ej: B12, 14)">
                <UInput
                  v-model="saleForm.seat_number"
                  placeholder="Ej: B04"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Punto de Subida">
                <UInput
                  v-model="saleForm.boarding_location"
                  placeholder="Terminal San Francisco"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Nro Comprobante">
                <UInput
                  v-model="saleForm.receipt_number"
                  placeholder="Ej: TRF-89412"
                  class="w-full font-mono"
                />
              </UFormField>
            </div>

            <UFormField label="Observaciones / Pasajeros Acompañantes" help="Anotá aquí los nombres y DNIs de los acompañantes si se compraron múltiples cupos">
              <UTextarea
                v-model="saleForm.notes"
                placeholder="Ej: Viaja con Marcos Díaz (DNI 38.123.456). Resta abonar última cuota en la terminal."
                rows="2"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="isSaleModalOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold"
            :loading="submittingSale"
            @click="handleSaveSale"
          >
            {{ isEditing ? 'Guardar Cambios' : 'Confirmar Venta' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- ============================================================== -->
    <!-- MODAL RÁPIDO: COBRO EN CALIENTE EN PUERTA DEL MICRO            -->
    <!-- ============================================================== -->
    <UModal
      v-model:open="isQuickPayModalOpen"
      title="Cobro en Caliente (Ingreso al Colectivo)"
      description="Registrá el pago del saldo restante en el momento del embarque para evitar confusiones."
    >
      <template #body>
        <div v-if="saleToPay" class="space-y-4 pt-2">
          <!-- Tarjeta de Resumen del Pasajero -->
          <div class="p-4 rounded-xl bg-red-950/20 border border-red-500/40 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase text-zinc-400 font-semibold">Pasajero Titular:</p>
                <p class="text-base font-bold text-[#F5EEDC]">
                  {{ saleToPay.customer?.name }} {{ saleToPay.customer?.lastname }}
                </p>
                <p class="text-xs text-zinc-400 font-mono">DNI: {{ saleToPay.customer?.dni }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs uppercase text-red-400 font-bold">Saldo Pendiente:</p>
                <p class="text-xl sm:text-2xl font-black text-red-400 font-mono">
                  {{ formatCurrency(saleToPay.balance_due) }}
                </p>
              </div>
            </div>

            <div class="pt-2 border-t border-[#2A2A38] text-xs text-zinc-300 flex items-center justify-between">
              <span>Show: <strong>{{ saleToPay.event?.title }}</strong></span>
              <span v-if="saleToPay.seat_number" class="text-amber-400 font-mono">
                Butaca: {{ saleToPay.seat_number }}
              </span>
            </div>
          </div>

          <!-- Campos de Cobro -->
          <div class="space-y-3">
            <UFormField label="Monto a Cobrar Ahora (ARS)" required help="Podés cobrar el total adeudado o una parte">
              <UInput
                v-model.number="quickPayAmount"
                type="number"
                min="1"
                :max="saleToPay.balance_due"
                class="w-full text-base font-bold font-mono"
              />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UFormField label="Medio de Cobro en Puerta">
                <select
                  v-model="quickPayMethod"
                  class="w-full rounded-lg bg-[#14141A] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
                >
                  <option value="efectivo">Efectivo en Mano</option>
                  <option value="transferencia">Transferencia en Vivo</option>
                  <option value="mercado_pago">Mercado Pago (QR/Envío)</option>
                </select>
              </UFormField>

              <UFormField label="Nro Comprobante (Opcional)">
                <UInput
                  v-model="quickPayReceipt"
                  placeholder="Ej: REC-PUERTA-01"
                  class="w-full font-mono"
                />
              </UFormField>
            </div>

            <UFormField label="Nota de Cobro">
              <UInput
                v-model="quickPayNote"
                placeholder="Cobro de cuota final al subir al micro"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="isQuickPayModalOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            :loading="submittingQuickPay"
            @click="handleConfirmQuickPay"
          >
            Confirmar Cobro de {{ formatCurrency(quickPayAmount) }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- ============================================================== -->
    <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN                           -->
    <!-- ============================================================== -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="¿Anular registro de venta?"
      description="Esta acción eliminará el asiento del libro contable."
    >
      <template #body>
        <div v-if="saleToDelete" class="text-xs text-zinc-300 space-y-2 pt-1">
          <p>
            Estás a punto de anular la venta correspondiente a
            <strong class="text-[#F5EEDC]">{{ saleToDelete.customer?.name }} {{ saleToDelete.customer?.lastname }}</strong>
            por el viaje a <strong class="text-[#F5EEDC]">{{ saleToDelete.event?.title }}</strong>.
          </p>
          <p class="text-zinc-400">
            Monto total: {{ formatCurrency(saleToDelete.total_amount) }} · Pagado: {{ formatCurrency(saleToDelete.amount_paid) }}
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="isDeleteModalOpen = false"
          >
            Volver
          </UButton>
          <UButton
            color="error"
            variant="solid"
            :loading="deletingSale"
            @click="handleConfirmDelete"
          >
            Confirmar Anulación
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
