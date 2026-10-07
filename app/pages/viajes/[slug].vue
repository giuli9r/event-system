<script setup lang="ts">
import type { PublicFeaturedEvent } from '~/composables/usePublicEvents'

definePageMeta({
  layout: 'default'
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

// Metadatos dinámicos OpenGraph y Twitter para compartir en redes
useSeoMeta({
  title: computed(() => `${currentEvent.value.artist_headliner} en ${currentEvent.value.venue?.name || 'Recital'} | Tripu Producciones`),
  description: computed(() => `Viaje y traslado oficial para ver a ${currentEvent.value.artist_headliner}. Salida desde ${currentEvent.value.departure_location}. Reservá tu lugar con Tripu.`),
  ogTitle: computed(() => `Viaje a ${currentEvent.value.artist_headliner} - ${formatEventDate(currentEvent.value.event_date)}`),
  ogDescription: computed(() => `Viaje organizado con coordinación y traslados oficiales a ${currentEvent.value.venue?.name || 'recital'} (${currentEvent.value.venue?.city || ''}).`),
  ogImage: computed(() => currentEvent.value.image_url || '/branding/logo-tripu-horizontal.webp'),
  twitterCard: 'summary_large_image'
})

// Generador de enlace contextual hacia WhatsApp (US-10)
function getWhatsAppUrl(tierName?: string) {
  const phone = '5493564000000'
  const ev = currentEvent.value
  const dateFormatted = formatEventDate(ev.event_date)
  const venue = ev.venue?.name || 'el recital'
  const packageContext = tierName ? ` (Opción: *${tierName}*)` : ''
  const text = encodeURIComponent(
    `¡Hola Tripu! 👋 Quiero consultar y reservar mi lugar para el viaje al show de *${ev.artist_headliner}* en ${venue} (${dateFormatted})${packageContext}. ¿Me podrían enviar información de disponibilidad y formas de pago?`
  )
  return `https://wa.me/${phone}?text=${text}`
}
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] pb-24 lg:pb-16 selection:bg-[#E53924] selection:text-white">
    <!-- Migas de pan / Volver a la cartelera -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#E53924] transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        <span>Volver a la cartelera</span>
      </NuxtLink>
    </div>

    <!-- BANNER HERO DEL VIAJE -->
    <section class="relative w-full bg-[#14141B] border-y border-[#2A2A38] overflow-hidden">
      <!-- Fondo difuminado con la imagen del recital -->
      <div class="absolute inset-0 z-0">
        <img
          v-if="currentEvent.image_url"
          :src="currentEvent.image_url"
          :alt="currentEvent.artist_headliner"
          class="w-full h-full object-cover object-center filter blur-2xl opacity-20 scale-110"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/80 to-transparent" />
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <!-- Columna Izquierda: Flyer Oficial Estilo Póster -->
          <div class="lg:col-span-4 max-w-sm mx-auto lg:max-w-none w-full">
            <div class="relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#1A1A22] border border-[#2A2A38] shadow-2xl">
              <img
                :src="currentEvent.image_url || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'"
                :alt="currentEvent.artist_headliner"
                class="w-full h-full object-cover object-center"
              />

              <!-- Overlay y Badge de Agotado -->
              <div
                v-if="isSoldOut"
                class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
              >
                <span class="px-6 py-2.5 rounded-xl bg-[#0F0F12]/95 border border-zinc-700 text-zinc-200 font-mono font-black text-sm uppercase tracking-[0.25em] shadow-2xl">
                  AGOTADO
                </span>
              </div>

              <!-- Badge Destacado -->
              <div v-else-if="currentEvent.is_featured" class="absolute top-3 right-3 z-10">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#E53924] text-white shadow-lg shadow-[#E53924]/40">
                  <UIcon name="i-heroicons-star" class="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Destacado</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Título, Metadatos y CTA Principal -->
          <div class="lg:col-span-8 space-y-6">
            <div class="space-y-3">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#FF6B55]">
                <span class="w-1.5 h-1.5 rounded-full" :class="isSoldOut ? 'bg-zinc-500' : 'bg-[#E53924]'" />
                <span>{{ isSoldOut ? 'Salida Completa' : 'Salida Confirmada' }}</span>
              </div>

              <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-[#F5EEDC] tracking-tight leading-none">
                {{ currentEvent.artist_headliner }}
              </h1>

              <p v-if="currentEvent.title && currentEvent.title !== currentEvent.artist_headliner" class="text-lg sm:text-xl font-bold text-zinc-400">
                {{ currentEvent.title }}
              </p>
            </div>

            <!-- Ficha de Datos Clave (Grid Rápido) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#2A2A38]/70">
              <!-- Fecha -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
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
                <div class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Lugar / Sede</span>
                  <p class="text-sm sm:text-base font-black text-[#F5EEDC]">
                    {{ currentEvent.venue?.name || 'Recinto a confirmar' }}
                    <span v-if="currentEvent.venue?.city" class="text-zinc-400 font-medium">({{ currentEvent.venue.city }})</span>
                  </p>
                </div>
              </div>

              <!-- Punto de Salida -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-truck" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Punto de Salida</span>
                  <p class="text-sm sm:text-base font-bold text-[#F5EEDC]">
                    {{ currentEvent.departure_location }}
                  </p>
                </div>
              </div>

              <!-- Horario de Partida -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#1A1A22] border border-[#2A2A38] flex items-center justify-center text-[#E53924] shrink-0">
                  <UIcon name="i-heroicons-clock" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Horario de Salida</span>
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
                  <span class="text-3xl font-black text-[#F5EEDC]" :class="isSoldOut ? 'line-through text-zinc-500' : ''">
                    {{ formatCurrency(minPrice) }}
                  </span>
                </div>
                <span v-else class="text-sm font-bold text-zinc-400">
                  Tarifas a consultar
                </span>
              </div>

              <div class="hidden lg:block">
                <a
                  v-if="!isSoldOut"
                  :href="getWhatsAppUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#25D366] hover:bg-[#20ba5a] text-[#0F0F12] shadow-xl shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-5 h-5 stroke-[2.5]" />
                  <span>Consultar y Reservar por WhatsApp</span>
                </a>
                <div
                  v-else
                  class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#1A1A22] text-zinc-500 border border-[#2A2A38] cursor-not-allowed"
                >
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
        <!-- Columna Principal: Qué incluye, Itinerario y Política de Regreso -->
        <div class="lg:col-span-8 space-y-10">
          <!-- Qué incluye el viaje -->
          <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6B55]">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-[#E53924]" />
              <span>Experiencia Tripu</span>
            </div>
            <h2 class="text-2xl font-black uppercase text-[#F5EEDC] tracking-tight">
              ¿Qué incluye esta salida?
            </h2>

            <p v-if="currentEvent.includes_summary" class="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
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
          <section v-if="currentEvent.full_itinerary" class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6B55]">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-[#E53924]" />
              <span>Cronograma</span>
            </div>
            <h2 class="text-2xl font-black uppercase text-[#F5EEDC] tracking-tight">
              Itinerario Previsto
            </h2>
            <div class="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-[#0F0F12] border border-[#2A2A38]">
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
              <div
                v-for="tier in currentEvent.package_tiers"
                :key="tier.id"
                class="p-4 rounded-xl bg-[#1A1A22] border transition-all duration-200"
                :class="tier.is_available && !isSoldOut ? 'border-[#2A2A38] hover:border-[#E53924]/60' : 'border-[#2A2A38]/50 opacity-60'"
              >
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-sm text-[#F5EEDC] leading-snug">
                    {{ tier.name }}
                  </h3>
                  <span v-if="tier.early_bird && tier.is_available" class="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30">
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

                <a
                  v-if="tier.is_available && !isSoldOut"
                  :href="getWhatsAppUrl(tier.name)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-3 w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-[#0F0F12] border border-[#25D366]/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Reservar este paquete</span>
                  <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div v-else class="p-4 rounded-xl bg-[#1A1A22] text-center text-xs text-zinc-400">
              No hay tarifas cargadas para esta salida. Consultanos por WhatsApp.
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
    <div class="lg:hidden fixed bottom-0 inset-x-0 z-40 p-4 bg-[#14141B]/95 backdrop-blur-md border-t border-[#2A2A38] shadow-2xl flex items-center justify-between gap-4">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Tarifa desde</span>
        <span v-if="minPrice" class="text-xl font-black text-[#F5EEDC]" :class="isSoldOut ? 'line-through text-zinc-500' : ''">
          {{ formatCurrency(minPrice) }}
        </span>
        <span v-else class="text-xs font-bold text-zinc-400">
          A consultar
        </span>
      </div>

      <a
        v-if="!isSoldOut"
        :href="getWhatsAppUrl()"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#25D366] text-[#0F0F12] text-center flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-95 transition-transform"
      >
        <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4 stroke-[2.5]" />
        <span>Consultar por WhatsApp</span>
      </a>
      <div
        v-else
        class="flex-1 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#1A1A22] text-zinc-500 border border-[#2A2A38] text-center"
      >
        Agotado
      </div>
    </div>
  </div>
</template>
