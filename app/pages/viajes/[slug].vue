<script setup lang="ts">
import type { PublicFeaturedEvent } from '~/composables/usePublicEvents'
import type { MerchItem } from '~/composables/useMerch'

definePageMeta({
  layout: 'default'
})

const user = useSupabaseUser()

onMounted(() => {
  if (user.value && slug.value) {
    fetchPublicEventBySlug(slug.value, { force: true })
  }
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const {
  fetchPublicEventBySlug,
  formatEventDate,
  formatEventTime,
  formatCurrency,
  getMinPrice
} = usePublicEvents()

// Carga en servidor (SSR) del evento por su slug
const { data: event, error } = await useAsyncData(
  `tripu-public-event-${slug.value}`,
  async () => {
    const res = await fetchPublicEventBySlug(slug.value)
    if (!res) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Viaje no encontrado o no disponible públicamente'
      })
    }
    return res
  }
)

if (error.value || !event.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Viaje no encontrado o no disponible públicamente'
  })
}

const currentEvent = computed(() => event.value as PublicFeaturedEvent)
const isSoldOut = computed(() => currentEvent.value.status === 'sold_out')
const minPrice = computed(() => getMinPrice(currentEvent.value.package_tiers))

// Merchandising oficial asignado a esta salida
const merchandiseList = computed<MerchItem[]>(() => currentEvent.value.merchandise || [])
const hasMerchAvailable = computed(() => Boolean(currentEvent.value.has_merchandise && merchandiseList.value.length > 0))

// Límite máximo de unidades por producto (UX Guardrail)
const MAX_MERCH_QTY = 10

// Diccionario reactivo de cantidades: { [productId: string]: number }
const selectedMerchQuantities = ref<Record<string, number>>({})

function getMerchQuantity(id: string): number {
  return selectedMerchQuantities.value[id] || 0
}

function isMerchSelected(id: string): boolean {
  return getMerchQuantity(id) > 0
}

function incrementMerch(item: MerchItem) {
  const current = getMerchQuantity(item.id)
  if (current < MAX_MERCH_QTY) {
    selectedMerchQuantities.value = {
      ...selectedMerchQuantities.value,
      [item.id]: current + 1
    }
  }
}

function decrementMerch(id: string) {
  const current = getMerchQuantity(id)
  if (current <= 1) {
    const updated = { ...selectedMerchQuantities.value }
    delete updated[id]
    selectedMerchQuantities.value = updated
  } else {
    selectedMerchQuantities.value = {
      ...selectedMerchQuantities.value,
      [id]: current - 1
    }
  }
}

function clearSelectedMerch() {
  selectedMerchQuantities.value = {}
}

export interface SelectedMerchEntry {
  item: MerchItem
  quantity: number
  subtotal: number
}

// Entradas de productos seleccionados con cantidades y subtotales
const selectedMerchEntries = computed<SelectedMerchEntry[]>(() => {
  return merchandiseList.value
    .filter(item => getMerchQuantity(item.id) > 0)
    .map(item => {
      const quantity = getMerchQuantity(item.id)
      return {
        item,
        quantity,
        subtotal: (Number(item.price) || 0) * quantity
      }
    })
})

// Cantidad total de artículos/unidades de merchandising
const totalMerchUnits = computed(() => {
  return selectedMerchEntries.value.reduce((acc, entry) => acc + entry.quantity, 0)
})

// Monto acumulado de merchandising seleccionado en ARS
const selectedMerchTotal = computed(() => {
  return selectedMerchEntries.value.reduce((acc, entry) => acc + entry.subtotal, 0)
})

// Modal de detalles informativos del producto (+ Info)
const isMerchModalOpen = ref(false)
const activeModalProduct = ref<MerchItem | null>(null)

function openMerchDetail(item: MerchItem) {
  activeModalProduct.value = item
  isMerchModalOpen.value = true
}

// Metadatos dinámicos OpenGraph y Twitter para compartir en redes
useSeoMeta({
  title: computed(() => `${currentEvent.value.artist_headliner} en ${currentEvent.value.venue?.name || 'Recital'} | Tripu Producciones`),
  description: computed(() => `Viaje y traslado oficial para ver a ${currentEvent.value.artist_headliner}. Salida desde ${currentEvent.value.departure_location}. Reservá tu lugar con Tripu.`),
  ogTitle: computed(() => `Viaje a ${currentEvent.value.artist_headliner} - ${formatEventDate(currentEvent.value.event_date)}`),
  ogDescription: computed(() => `Viaje organizado con coordinación y traslados oficiales a ${currentEvent.value.venue?.name || 'recital'} (${currentEvent.value.venue?.city || ''}).`),
  ogImage: computed(() => currentEvent.value.image_url || '/branding/logo-tripu-horizontal.webp'),
  twitterCard: 'summary_large_image'
})

const config = useRuntimeConfig()
const defaultWhatsApp = computed(() => (config.public.whatsappNumber as string) || '5493564692598')

// Generador de enlace contextual hacia WhatsApp (US-10) con soporte para Merchandising y Cantidades
function getWhatsAppUrl(tierName?: string) {
  const phone = defaultWhatsApp.value
  const ev = currentEvent.value
  const dateFormatted = formatEventDate(ev.event_date)
  const venue = ev.venue?.name || 'el recital'
  const packageContext = tierName ? ` (Opción: *${tierName}*)` : ''

  let merchContext = ''
  if (selectedMerchEntries.value.length > 0) {
    const itemsLines = selectedMerchEntries.value
      .map(entry => {
        if (entry.quantity > 1) {
          return `  • ${entry.quantity}x ${entry.item.name} (${formatCurrency(entry.item.price)} c/u) — Subtotal: ${formatCurrency(entry.subtotal)}`
        }
        return `  • 1x ${entry.item.name} (${formatCurrency(entry.item.price)})`
      })
      .join('\n')
    merchContext = `\n\n👕 *Merchandising oficial que deseo sumar:*\n${itemsLines}\n*Total adicional Merch (${totalMerchUnits.value} ${totalMerchUnits.value === 1 ? 'unidad' : 'unidades'}):* ${formatCurrency(selectedMerchTotal.value)}`
  }

  const text = encodeURIComponent(
    `¡Hola Tripu! 👋 Quiero consultar y reservar mi lugar para el viaje al show de *${ev.artist_headliner}* en ${venue} (${dateFormatted})${packageContext}.${merchContext}\n\n¿Me podrían enviar información de disponibilidad y formas de pago?`
  )
  return `https://wa.me/${phone}?text=${text}`
}
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] pb-24 lg:pb-16 selection:bg-[#E53924] selection:text-white">
    <!-- Migas de pan / Volver a la cartelera -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <NuxtLink to="/#proximos-shows"
        class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#E53924] transition-colors">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        <span>Volver a la cartelera</span>
      </NuxtLink>
    </div>

    <!-- BANNER HERO DEL VIAJE -->
    <section class="relative w-full bg-[#14141B] border-y border-[#2A2A38] overflow-hidden">
      <!-- Fondo difuminado con la imagen del recital -->
      <div class="absolute inset-0 z-0">
        <img v-if="currentEvent.image_url" :src="currentEvent.image_url" :alt="currentEvent.artist_headliner"
          class="w-full h-full object-cover object-center filter blur-2xl opacity-20 scale-110" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/80 to-transparent" />
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <!-- Columna Izquierda: Flyer Oficial Estilo Póster -->
          <div class="lg:col-span-4 max-w-sm mx-auto lg:max-w-none w-full">
            <div
              class="relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#1A1A22] border border-[#2A2A38] shadow-2xl">
              <img
                :src="currentEvent.image_url || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'"
                :alt="currentEvent.artist_headliner" class="w-full h-full object-cover object-center" />

              <!-- Overlay y Badge de Agotado -->
              <div v-if="isSoldOut"
                class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <span
                  class="px-6 py-2.5 rounded-xl bg-[#0F0F12]/95 border border-zinc-700 text-zinc-200 font-mono font-black text-sm uppercase tracking-[0.25em] shadow-2xl">
                  AGOTADO
                </span>
              </div>

              <!-- Badge Destacado -->
              <div v-else-if="currentEvent.is_featured" class="absolute top-3 right-3 z-10">
                <span
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#E53924] text-white shadow-lg shadow-[#E53924]/40">
                  <UIcon name="i-heroicons-star" class="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Destacado</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Título, Metadatos y CTA Principal -->
          <div class="lg:col-span-8 space-y-6">
            <div class="space-y-3">
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#FF6B55]">
                <span class="w-1.5 h-1.5 rounded-full" :class="isSoldOut ? 'bg-zinc-500' : 'bg-[#E53924]'" />
                <span>{{ isSoldOut ? 'Salida Completa' : 'Salida Confirmada' }}</span>
              </div>

              <h1
                class="text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-[#F5EEDC] tracking-tight leading-none">
                {{ currentEvent.artist_headliner }}
              </h1>

              <p v-if="currentEvent.title && currentEvent.title !== currentEvent.artist_headliner"
                class="text-lg sm:text-xl font-bold text-zinc-400">
                {{ currentEvent.title }}
              </p>
            </div>

            <!-- Ficha de Datos Clave (Grid Rápido) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#2A2A38]/70">
              <!-- Fecha -->
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Fecha del Show</span>
                  <p class="text-sm sm:text-base font-black uppercase text-[#F5EEDC]">
                    {{ formatEventDate(currentEvent.event_date) }}
                  </p>
                </div>
              </div>

              <!-- Recinto / Ciudad -->
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Lugar / Sede</span>
                  <p class="text-sm sm:text-base font-black text-[#F5EEDC]">
                    {{ currentEvent.venue?.name || 'Recinto a confirmar' }}
                    <span v-if="currentEvent.venue?.city" class="text-zinc-400 font-medium">({{ currentEvent.venue.city
                    }})</span>
                  </p>
                </div>
              </div>

              <!-- Punto de Salida -->
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-truck" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Punto de
                    Salida</span>
                  <p class="text-sm sm:text-base font-bold text-[#F5EEDC]">
                    {{ currentEvent.departure_location }}
                  </p>
                </div>
              </div>

              <!-- Horario de Partida -->
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-clock" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Horario de
                    Salida</span>
                  <p class="text-sm sm:text-base font-bold text-[#F5EEDC]">
                    {{ formatEventTime(currentEvent.departure_time) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Resumen de Tarifa y Botón de WhatsApp Desktop -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Tarifa por persona</span>
                <div v-if="minPrice" class="flex items-baseline gap-2">
                  <span class="text-xs text-zinc-400 font-medium">desde</span>
                  <span class="text-3xl font-black text-[#F5EEDC]"
                    :class="isSoldOut ? 'line-through text-zinc-500' : ''">
                    {{ formatCurrency(minPrice) }}
                  </span>
                </div>
                <span v-else class="text-sm font-bold text-zinc-400">
                  Tarifas a consultar
                </span>
              </div>

              <div class="hidden lg:block">
                <a v-if="!isSoldOut" :href="getWhatsAppUrl()" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#25D366] hover:bg-[#20ba5a] text-[#0F0F12] shadow-xl shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-5 h-5 stroke-[2.5]" />
                  <span>Consultar y Reservar por WhatsApp</span>
                </a>
                <div v-else
                  class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#1A1A22] text-zinc-500 border border-[#2A2A38] cursor-not-allowed">
                  <span>Cupos Agotados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CUERPO PRINCIPAL: DETALLES, ITINERARIO Y PAQUETES -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <!-- Columna Principal: Merch Oficial, Qué incluye, Itinerario y Política de Regreso -->
        <div class="lg:col-span-8 space-y-10">
          <!-- SECCIÓN KIT RECITALERO: MERCHANDISING OFICIAL ASIGNADO -->
          <section v-if="hasMerchAvailable"
            class="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#1A1A22] via-[#14141B] to-[#171720] border-2 border-[#E53924]/40 shadow-2xl shadow-[#E53924]/5 space-y-6">
            <div
              class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#E53924]/10 blur-3xl pointer-events-none" />

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div>
                <div
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E53924]/15 border border-[#E53924]/30 text-xs font-black uppercase tracking-wider text-[#FF6B55] mb-2">
                  <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-[#E53924] animate-pulse" />
                  <span>Kit Recitalero Oficial</span>
                </div>
                <h2 class="text-2xl sm:text-3xl font-black uppercase text-[#F5EEDC] tracking-tight">
                  Equipate para el Recital
                </h2>
                <p class="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
                  Sumá indumentaria y accesorios oficiales a tu salida. Los reservás ahora y los recibís coordinados
                  durante el viaje.
                </p>
              </div>

              <!-- Contador de unidades sumadas -->
              <div v-if="totalMerchUnits > 0" class="shrink-0 self-start sm:self-auto">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  <span>{{ totalMerchUnits }} {{ totalMerchUnits === 1 ? 'unidad sumada' : 'unidades sumadas' }}</span>
                </span>
              </div>
            </div>

            <!-- Grilla de productos de merch -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <div v-for="item in merchandiseList" :key="item.id"
                class="group rounded-2xl bg-[#0F0F12]/85 border transition-all duration-300 p-4 flex flex-col justify-between"
                :class="isMerchSelected(item.id)
                  ? 'border-[#E53924] ring-2 ring-[#E53924]/40 bg-[#1A1A22]'
                  : 'border-[#2A2A38] hover:border-[#E53924]/50 hover:bg-[#14141B]'">

                <div>
                  <!-- Contenedor de Imagen o Icono (Reducido ~25% para diseño más compacto) -->
                  <div
                    class="relative w-full aspect-[2/1] sm:aspect-[2.1/1] rounded-xl overflow-hidden bg-[#1A1A22] border border-[#2A2A38] mb-3 flex items-center justify-center">
                    <img v-if="item.image_url" :src="item.image_url" :alt="item.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div v-else class="flex items-center justify-center gap-2 text-zinc-500">
                      <UIcon name="i-heroicons-shopping-bag" class="w-6 h-6 text-[#E53924]/60" />
                      <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Tripu Oficial</span>
                    </div>

                    <span
                      class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0F0F12]/85 text-zinc-300 border border-zinc-700 backdrop-blur-sm">
                      {{ item.category }}
                    </span>

                    <span v-if="isMerchSelected(item.id)"
                      class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#E53924] text-white shadow-md">
                      ✓ {{ getMerchQuantity(item.id) }} en tu viaje
                    </span>
                  </div>

                  <h3
                    class="font-bold text-base text-[#F5EEDC] leading-snug line-clamp-2 group-hover:text-[#FF6B55] transition-colors">
                    {{ item.name }}
                  </h3>
                </div>

                <!-- Pie de la tarjeta -->
                <div class="pt-4 mt-4 border-t border-[#2A2A38] space-y-3">
                  <div class="flex items-baseline justify-between">
                    <span class="text-xs text-zinc-400 font-medium">
                      {{ getMerchQuantity(item.id) > 1 ? `${getMerchQuantity(item.id)} × ${formatCurrency(item.price)}`
                        : 'Precio' }}
                    </span>
                    <span class="text-xl font-black text-[#F5EEDC]">
                      {{ formatCurrency(item.price * (getMerchQuantity(item.id) || 1)) }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button type="button" @click="openMerchDetail(item)"
                      class="py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-[#1A1A22] hover:bg-[#252532] border border-[#2A2A38] inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="Ver detalles del producto">
                      <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-[#FF6B55]" />
                      <span>+ Info</span>
                    </button>

                    <!-- Morphing Stepper: Botón inicial o Stepper de cantidad -->
                    <div v-if="!isMerchSelected(item.id)" class="flex-1 flex">
                      <button type="button" @click="incrementMerch(item)"
                        class="w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md bg-[#E53924]/10 hover:bg-[#E53924] text-[#E53924] hover:text-white border border-[#E53924]/30">
                        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                        <span>Sumar al viaje</span>
                      </button>
                    </div>

                    <div v-else
                      class="flex-1 flex items-center justify-between bg-[#E53924] rounded-xl p-1 shadow-md shadow-[#E53924]/20 border border-[#E53924]">
                      <!-- Decrementar / Eliminar -->
                      <button type="button" @click="decrementMerch(item.id)"
                        class="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                        :title="getMerchQuantity(item.id) === 1 ? 'Quitar del viaje' : 'Restar una unidad'">
                        <UIcon :name="getMerchQuantity(item.id) === 1 ? 'i-heroicons-trash' : 'i-heroicons-minus'"
                          class="w-4 h-4" />
                      </button>

                      <!-- Cantidad central -->
                      <div class="px-2 text-center">
                        <span class="text-xs font-black text-white block leading-none">
                          {{ getMerchQuantity(item.id) }}
                        </span>
                        <span
                          class="text-[9px] font-bold text-white/80 uppercase tracking-tighter block leading-none mt-0.5">
                          {{ getMerchQuantity(item.id) === 1 ? 'unidad' : 'unidades' }}
                        </span>
                      </div>

                      <!-- Incrementar hasta 10 -->
                      <button type="button" @click="incrementMerch(item)"
                        :disabled="getMerchQuantity(item.id) >= MAX_MERCH_QTY"
                        class="w-8 h-8 rounded-lg bg-black/20 text-white flex items-center justify-center transition-colors"
                        :class="getMerchQuantity(item.id) >= MAX_MERCH_QTY
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-black/40 cursor-pointer'"
                        :title="getMerchQuantity(item.id) >= MAX_MERCH_QTY ? 'Límite máximo alcanzado (10)' : 'Sumar otra unidad'">
                        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen de selección -->
            <div v-if="selectedMerchEntries.length > 0"
              class="p-4 rounded-xl bg-[#0F0F12] border border-[#E53924]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-[#E53924]/20 text-[#E53924] flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-xs text-zinc-400">Merchandising sumado a tu reserva:</p>
                  <p class="text-sm font-bold text-[#F5EEDC]">
                    {{ totalMerchUnits }} {{ totalMerchUnits === 1 ? 'artículo' : 'artículos' }}
                    <span v-if="selectedMerchEntries.length > 1" class="text-xs text-zinc-400 font-normal">
                      ({{ selectedMerchEntries.length }} productos diferentes)
                    </span> —
                    <span class="text-[#E53924]">{{ formatCurrency(selectedMerchTotal) }}</span>
                  </p>
                </div>
              </div>
              <button type="button" @click="clearSelectedMerch"
                class="text-xs text-zinc-400 hover:text-rose-400 transition-colors underline cursor-pointer self-end sm:self-auto">
                Quitar selección
              </button>
            </div>
          </section>

          <!-- Qué incluye el viaje -->
          <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6B55]">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-[#E53924]" />
              <span>Experiencia Tripu</span>
            </div>
            <h2 class="text-2xl font-black uppercase text-[#F5EEDC] tracking-tight">
              ¿Qué incluye esta salida?
            </h2>

            <p v-if="currentEvent.includes_summary"
              class="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
              {{ currentEvent.includes_summary }}
            </p>
            <div v-else class="space-y-2 text-sm text-zinc-300">
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-[#25D366]" />
                <span>Traslado ida y vuelta en unidades habilitadas con choferes profesionales.</span>
              </p>
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-[#25D366]" />
                <span>Coordinación permanente de Tripu durante todo el viaje.</span>
              </p>
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-[#25D366]" />
                <span>Seguro de viaje y asistencia en ruta.</span>
              </p>
            </div>
          </section>

          <!-- Itinerario Completo -->
          <section v-if="currentEvent.full_itinerary"
            class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6B55]">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-[#E53924]" />
              <span>Cronograma</span>
            </div>
            <h2 class="text-2xl font-black uppercase text-[#F5EEDC] tracking-tight">
              Itinerario Previsto
            </h2>
            <div
              class="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-[#0F0F12] border border-[#2A2A38]">
              {{ currentEvent.full_itinerary }}
            </div>
          </section>

          <!-- Política de Regreso -->
          <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-3">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6B55]">
              <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-[#E53924]" />
              <span>Normativa y Seguridad</span>
            </div>
            <h2 class="text-2xl font-black uppercase text-[#F5EEDC] tracking-tight">
              Política de Regreso
            </h2>
            <p class="text-sm sm:text-base text-zinc-300">
              {{ currentEvent.return_policy || 'Regreso 60 minutos finalizado el show en el mismo punto de descenso.' }}
            </p>
          </section>
        </div>

        <!-- Columna Lateral: Paquetes y Opciones de Reserva -->
        <div class="lg:col-span-4 space-y-6">
          <div class="p-6 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-5 sticky top-24">
            <h2 class="text-xl font-black uppercase text-[#F5EEDC] tracking-tight">
              Paquetes Disponibles
            </h2>

            <div v-if="currentEvent.package_tiers && currentEvent.package_tiers.length > 0" class="space-y-3">
              <div v-for="tier in currentEvent.package_tiers" :key="tier.id"
                class="p-4 rounded-xl bg-[#1A1A22] border transition-all duration-200"
                :class="tier.is_available && !isSoldOut ? 'border-[#2A2A38] hover:border-[#E53924]/60' : 'border-[#2A2A38]/50 opacity-60'">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-sm text-[#F5EEDC] leading-snug">
                    {{ tier.name }}
                  </h3>
                  <span v-if="tier.early_bird && tier.is_available"
                    class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    Preventa
                  </span>
                </div>

                <div class="flex items-baseline justify-between pt-2 border-t border-[#2A2A38]">
                  <span class="text-xs text-zinc-400">
                    {{ tier.includes_ticket ? 'Con entrada oficial' : 'Solo traslado' }}
                  </span>
                  <span class="text-lg font-black text-[#E53924]">
                    {{ formatCurrency(tier.price) }}
                  </span>
                </div>

                <a v-if="tier.is_available && !isSoldOut" :href="getWhatsAppUrl(tier.name)" target="_blank"
                  rel="noopener noreferrer"
                  class="mt-3 w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-[#0F0F12] border border-[#25D366]/30 flex items-center justify-center gap-1.5 transition-colors">
                  <span>Reservar este paquete</span>
                  <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div v-else class="p-4 rounded-xl bg-[#1A1A22] text-center text-xs text-zinc-400">
              No hay tarifas cargadas para esta salida. Consultanos por WhatsApp.
            </div>

            <!-- Resumen de Merchandising Añadido en Tarjeta de Reserva -->
            <div v-if="selectedMerchEntries.length > 0"
              class="p-3.5 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-[#FF6B55]">
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 text-[#E53924]" />
                  <span>Merch sumado ({{ totalMerchUnits }})</span>
                </span>
                <span>+ {{ formatCurrency(selectedMerchTotal) }}</span>
              </div>
              <ul class="text-[11px] text-zinc-300 space-y-1.5 pl-1">
                <li v-for="entry in selectedMerchEntries" :key="entry.item.id"
                  class="flex items-center justify-between gap-1">
                  <span class="truncate">• {{ entry.quantity }}x {{ entry.item.name }}</span>
                  <span class="text-zinc-400 shrink-0 font-medium">{{ formatCurrency(entry.subtotal) }}</span>
                </li>
              </ul>
              <p class="text-[10px] text-zinc-400 pt-1 border-t border-[#E53924]/20 leading-tight">
                Se incluirá en el mensaje de reserva para congelar stock.
              </p>
            </div>

            <!-- Callout de confianza -->
            <div class="pt-4 border-t border-[#2A2A38] space-y-2 text-xs text-zinc-400">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-[#25D366]" />
                <span>Salidas aseguradas y coordinadores en viaje</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-[#25D366]" />
                <span>Seña tu lugar y congela la tarifa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- BARRA FLOTANTE STICKY PARA DISPOSITIVOS MÓVILES (Conversión Directa) -->
    <div
      class="lg:hidden fixed bottom-0 inset-x-0 z-40 p-4 bg-[#14141B]/95 backdrop-blur-md border-t border-[#2A2A38] shadow-2xl flex items-center justify-between gap-4">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Tarifa desde</span>
        <span v-if="minPrice" class="text-xl font-black text-[#F5EEDC]"
          :class="isSoldOut ? 'line-through text-zinc-500' : ''">
          {{ formatCurrency(minPrice) }}
        </span>
        <span v-else class="text-xs font-bold text-zinc-400">
          A consultar
        </span>
        <span v-if="totalMerchUnits > 0" class="text-[10px] font-black text-[#FF6B55] block animate-pulse">
          + {{ formatCurrency(selectedMerchTotal) }} Merch ({{ totalMerchUnits }} {{ totalMerchUnits === 1 ? 'u.' : 'u.'
          }})
        </span>
      </div>

      <a v-if="!isSoldOut" :href="getWhatsAppUrl()" target="_blank" rel="noopener noreferrer"
        class="flex-1 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#25D366] text-[#0F0F12] text-center flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-95 transition-transform">
        <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4 stroke-[2.5]" />
        <span>Consultar por WhatsApp</span>
      </a>
      <div v-else
        class="flex-1 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#1A1A22] text-zinc-500 border border-[#2A2A38] text-center">
        Agotado
      </div>
    </div>

    <!-- MODAL DETALLE DE MERCHANDISING (+ INFO) -->
    <UModal v-model:open="isMerchModalOpen" :title="activeModalProduct?.name || 'Detalles de Merchandising'"
      description="Indumentaria y accesorios oficiales de Tripu Producciones.">
      <template #body>
        <div v-if="activeModalProduct" class="space-y-4 pt-1">
          <!-- Vista previa de imagen ampliada -->
          <div
            class="w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center">
            <img v-if="activeModalProduct.image_url" :src="activeModalProduct.image_url" :alt="activeModalProduct.name"
              class="w-full h-full object-cover" />
            <div v-else class="flex flex-col items-center justify-center gap-2 text-zinc-500">
              <UIcon name="i-heroicons-shopping-bag" class="w-12 h-12 text-[#E53924]" />
              <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Tripu Merch Oficial</span>
            </div>
          </div>

          <!-- Categoría y Precio -->
          <div class="flex items-baseline justify-between pt-1">
            <span
              class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#14141B] text-zinc-300 border border-[#2A2A38]">
              {{ activeModalProduct.category }}
            </span>
            <span class="text-2xl font-black text-[#E53924]">
              {{ formatCurrency(activeModalProduct.price) }}
            </span>
          </div>

          <!-- Talles Confeccionados Informativos -->
          <div v-if="activeModalProduct.sizes && activeModalProduct.sizes.length > 0"
            class="p-3 rounded-xl bg-[#14141B] border border-[#2A2A38] space-y-2">
            <span class="text-xs font-bold text-zinc-300 block">Talles confeccionados disponibles:</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span v-for="sz in activeModalProduct.sizes" :key="sz"
                class="px-2.5 py-1 rounded-lg text-xs font-black bg-[#1A1A22] text-[#F5EEDC] border border-[#2A2A38]">
                {{ sz }}
              </span>
            </div>
            <p class="text-[11px] text-zinc-400 pt-1 leading-relaxed">
              * Podés coordinar tu talle específico en la conversación de WhatsApp al momento de confirmar tu reserva.
            </p>
          </div>

          <!-- Descripción Completa -->
          <div class="space-y-1">
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Descripción del producto:</span>
            <p
              class="text-sm text-zinc-300 leading-relaxed whitespace-pre-line p-3 rounded-xl bg-[#14141B] border border-[#2A2A38]">
              {{ activeModalProduct.description }} || 'Artículo oficial de producción exclusiva para el viaje.
              Materiales y estampados de alta durabilidad.'
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div v-if="activeModalProduct" class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
          <UButton variant="ghost" color="neutral" class="cursor-pointer order-2 sm:order-1"
            @click="isMerchModalOpen = false">
            Cerrar
          </UButton>

          <!-- Stepper en la modal -->
          <div class="order-1 sm:order-2 flex items-center justify-end gap-3 w-full sm:w-auto">
            <div v-if="!isMerchSelected(activeModalProduct.id)">
              <button type="button" @click="incrementMerch(activeModalProduct)"
                class="py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md bg-[#E53924] hover:bg-[#c9321f] text-white shadow-[#E53924]/20">
                <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                <span>Sumar este producto</span>
              </button>
            </div>

            <div v-else class="flex items-center gap-3">
              <span class="text-xs text-zinc-400 font-medium hidden sm:inline">
                Subtotal: <strong class="text-[#F5EEDC]">{{ formatCurrency(activeModalProduct.price *
                  getMerchQuantity(activeModalProduct.id)) }}</strong>
              </span>

              <div
                class="flex items-center bg-[#E53924] rounded-xl p-1 shadow-md shadow-[#E53924]/20 border border-[#E53924]">
                <button type="button" @click="decrementMerch(activeModalProduct.id)"
                  class="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                  :title="getMerchQuantity(activeModalProduct.id) === 1 ? 'Quitar del viaje' : 'Restar una unidad'">
                  <UIcon
                    :name="getMerchQuantity(activeModalProduct.id) === 1 ? 'i-heroicons-trash' : 'i-heroicons-minus'"
                    class="w-4 h-4" />
                </button>

                <div class="px-3 text-center min-w-16">
                  <span class="text-xs font-black text-white block leading-none">
                    {{ getMerchQuantity(activeModalProduct.id) }} {{ getMerchQuantity(activeModalProduct.id) === 1 ?
                      'unidad' : 'unidades' }}
                  </span>
                </div>

                <button type="button" @click="incrementMerch(activeModalProduct)"
                  :disabled="getMerchQuantity(activeModalProduct.id) >= MAX_MERCH_QTY"
                  class="w-8 h-8 rounded-lg bg-black/20 text-white flex items-center justify-center transition-colors"
                  :class="getMerchQuantity(activeModalProduct.id) >= MAX_MERCH_QTY
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-black/40 cursor-pointer'"
                  :title="getMerchQuantity(activeModalProduct.id) >= MAX_MERCH_QTY ? 'Límite máximo alcanzado (10)' : 'Sumar otra unidad'">
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
