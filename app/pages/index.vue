<script setup lang="ts">
import type { PublicFeaturedEvent } from '~/composables/usePublicEvents'

definePageMeta({
  layout: 'default'
})

const {
  featuredEvents,
  allEvents,
  filteredEvents,
  availableCities,
  availableMonths,
  loading,
  allLoading,
  fetchFeaturedEvents,
  fetchAllPublicEvents,
  resetFilters,
  formatEventDate,
  formatCurrency
} = usePublicEvents()

// Carga SSR para renderizar eventos e imagen LCP en el documento inicial
await useAsyncData('tripu-public-home-events', async () => {
  await Promise.all([
    fetchFeaturedEvents(),
    fetchAllPublicEvents()
  ])
  return true
})

// Metadatos y precarga prioritaria del hero LCP
useHead(() => {
  const heroImage = featuredEvents.value?.[0]?.image_url
  return {
    title: 'Tripu Producciones | Viajes a Recitales y Festivales de Música',
    meta: [
      {
        name: 'description',
        content: 'Traslados oficiales y experiencias a los mejores recitales y festivales de música de Argentina. Salidas desde San Francisco, Córdoba.'
      },
      {
        property: 'og:title',
        content: 'Tripu Producciones | El viaje es parte de la experiencia'
      },
      {
        property: 'og:image',
        content: '/branding/logo-tripu-horizontal.webp'
      }
    ],
    link: heroImage
      ? [
        {
          rel: 'preload',
          as: 'image',
          href: heroImage,
          fetchpriority: 'high'
        }
      ]
      : []
  }
})

// Evento seleccionado para modal de reserva rápida
const selectedEvent = ref<PublicFeaturedEvent | null>(null)
const reservationModalOpen = ref(false)

function handleSelectEvent(event: PublicFeaturedEvent) {
  if (event.status === 'sold_out') return
  selectedEvent.value = event
  reservationModalOpen.value = true
}

function getWhatsAppReservationUrl(event: PublicFeaturedEvent) {
  const phone = '5493564000000'
  const dateFormatted = formatEventDate(event.event_date)
  const venue = event.venue?.name || 'recital'
  const text = encodeURIComponent(
    `¡Hola Tripu! 👋 Quiero consultar disponibilidad y reservar para el viaje al show de *${event.artist_headliner}* en ${venue} (${dateFormatted}). ¿Me pueden pasar los medios de pago y detalles?`
  )
  return `https://wa.me/${phone}?text=${text}`
}

// Ciudades donde Tripu viaja, opera y vende
const tripCities = [
  { name: 'San Francisco', role: 'Base y Salidas' },
  { name: 'Córdoba', role: 'Recitales y Festivales' },
  { name: 'Rosario', role: 'Shows y Arenas' },
  { name: 'Buenos Aires', role: 'Estadios y Grandes Shows' },
  { name: 'Villa María', role: 'Puntos de Ascenso' },
  { name: 'Arroyito', role: 'Puntos de Ascenso' }
]
</script>

<template>
  <div class="relative bg-[#0F0F12] text-[#F5EEDC]">
    <!-- US-08: BANNER SUPERIOR / CARRUSEL DE EVENTOS DESTACADOS -->
    <FeaturedCarousel :events="featuredEvents" :loading="loading" :autoplay-interval="6500"
      @select="handleSelectEvent" />

    <!-- US-09: CARTELERA Y CATÁLOGO DE PRÓXIMOS RECITALES (Basado en PROXIMOS_EVENTOS.png) -->
    <section id="proximos-shows" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-20">
      <!-- ENCABEZADO DE SECCIÓN IDÉNTICO A LA MAQUETA -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#FF6B55] mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-[#E53924]" />
            <span>Cartelera Oficial</span>
          </div>
          <h2 class="text-3xl sm:text-5xl font-black uppercase text-[#F5EEDC] tracking-tight">
            PRÓXIMOS RECITALES
          </h2>
        </div>

        <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase text-[#25D366] hover:text-[#32e776] transition-colors">
          <span>¿No encontrás tu show? Consultanos</span>
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </a>
      </div>

      <!-- BARRA DE FILTROS Y BÚSQUEDA REACTIVA (US-09.3) -->
      <div class="mb-10">
        <EventFilters :cities="availableCities" :months="availableMonths" :total-count="allEvents.length"
          :filtered-count="filteredEvents.length" />
      </div>

      <!-- SKELETON LOADER DE LA GRILLA -->
      <div v-if="allLoading && allEvents.length === 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i"
          class="rounded-2xl bg-[#14141B] border border-[#2A2A38] overflow-hidden animate-pulse flex flex-col">
          <div class="aspect-[4/5] bg-[#1A1A22]" />
          <div class="p-4 space-y-3">
            <div class="h-6 bg-[#2A2A38] rounded-md w-3/4" />
            <div class="h-4 bg-[#2A2A38] rounded-md w-1/2" />
            <div class="h-4 bg-[#2A2A38] rounded-md w-2/3" />
            <div class="pt-3 border-t border-[#2A2A38] flex justify-between">
              <div class="h-6 bg-[#2A2A38] rounded-md w-1/3" />
              <div class="h-8 bg-[#2A2A38] rounded-xl w-1/3" />
            </div>
          </div>
        </div>
      </div>

      <!-- ESTADO SIN RESULTADOS -->
      <div v-else-if="filteredEvents.length === 0"
        class="p-12 text-center rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4 max-w-xl mx-auto my-6">
        <div
          class="w-16 h-16 rounded-full bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mx-auto">
          <UIcon name="i-heroicons-musical-note" class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold uppercase text-[#F5EEDC]">
          No encontramos viajes con esos filtros
        </h3>
        <p class="text-xs sm:text-sm text-zinc-400">
          Probá modificando la ciudad o el mes seleccionado, o hacé clic en limpiar para ver todos los viajes
          confirmados.
        </p>
        <div class="pt-2 flex flex-wrap justify-center gap-3">
          <button type="button"
            class="px-5 py-2.5 rounded-xl text-xs font-bold uppercase bg-[#E53924] hover:bg-[#d0301d] text-[#F5EEDC] transition-colors"
            @click="resetFilters">
            Ver todos los recitales
          </button>
          <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
            class="px-5 py-2.5 rounded-xl text-xs font-bold uppercase border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors flex items-center gap-1.5">
            <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </div>

      <!-- GRILLA OFICIAL DE TARJETAS (US-09.2 / PROXIMOS_EVENTOS.png) -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <EventCard v-for="event in filteredEvents" :key="event.id" :event="event" @select="handleSelectEvent" />
      </div>
    </section>

    <!-- MARQUEE HORIZONTAL DE CIUDADES & PUNTOS DE SALIDA / DESTINOS -->
    <div class="border-y border-[#2A2A38] bg-[#14141B] py-3.5 my-4 sm:my-8 overflow-hidden select-none relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2 flex items-center justify-between">
        <span class="text-[11px] font-black uppercase tracking-widest text-[#FF6B55] flex items-center gap-1.5">
          <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-[#E53924]" />
          <span>Rutas, Salidas y Destinos</span>
        </span>
        <span class="text-[10px] text-zinc-500 hidden sm:inline font-mono">
          Viajamos juntos a los escenarios más grandes de Argentina
        </span>
      </div>
      <NuxtMarquee :pause-on-hover="true" :auto-fill="true" :speed="35" :direction="'left'" play>
        <div class="flex items-center gap-10 px-4 text-xs font-semibold tracking-wide">
          <div v-for="city in tripCities" :key="city.name"
            class="inline-flex items-center gap-2.5 group cursor-default">
            <span
              class="w-2 h-2 rounded-full bg-[#E53924] shadow-sm shadow-[#E53924]/80 group-hover:scale-125 transition-transform" />
            <span
              class="text-sm font-black uppercase text-[#F5EEDC] tracking-wide group-hover:text-[#E53924] transition-colors">
              {{ city.name }}
            </span>
            <span
              class="text-[10px] font-mono text-zinc-400 uppercase bg-[#1A1A22] px-1.5 py-0.5 rounded border border-[#2A2A38]">
              {{ city.role }}
            </span>
            <span class="text-zinc-700 ml-4 font-black">/</span>
          </div>
        </div>
      </NuxtMarquee>
    </div>

    <!-- SECCIÓN INTERMEDIA: PROPUESTA DE VALOR TRIPU -->
    <section id="experiencia"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-[#2A2A38]/50">
      <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#FF6B55]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#E53924]" />
          <span>Experiencia Tripu</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-black uppercase text-[#F5EEDC] tracking-tight">
          El Viaje es Parte de la Experiencia
        </h2>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
          No somos solo un traslado: armamos la previa, cuidamos cada detalle del trayecto y viajamos juntos con la
          misma energía del pogo.
        </p>
      </div>

      <!-- EVIDENCIA DE VIAJES: CARRUSEL DE FOTOS DE EXPERIENCIA -->
      <ExperienceCarousel />

      <!-- Grid de Beneficios -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <!-- Tarjeta 1 -->
        <div
          class="p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all duration-300 group">
          <div
            class="w-14 h-14 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mb-6 group-hover:scale-110 transition-transform">
            <UIcon name="i-heroicons-user-group" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold uppercase text-[#F5EEDC] mb-2 tracking-wide">
            Coordinación Permanente
          </h3>
          <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Coordinadores con años de ruta acompañando al grupo en todo momento, desde la salida hasta el regreso.
          </p>
        </div>

        <!-- Tarjeta 2 -->
        <div
          class="p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all duration-300 group">
          <div
            class="w-14 h-14 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mb-6 group-hover:scale-110 transition-transform">
            <UIcon name="i-heroicons-shield-check" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold uppercase text-[#F5EEDC] mb-2 tracking-wide">
            Unidades Habilitadas
          </h3>
          <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Flota moderna con choferes profesionales, seguros de viaje vigentes y máxima seguridad en ruta.
          </p>
        </div>

        <!-- Tarjeta 3 -->
        <div
          class="p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all duration-300 group">
          <div
            class="w-14 h-14 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mb-6 group-hover:scale-110 transition-transform">
            <UIcon name="i-heroicons-ticket" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold uppercase text-[#F5EEDC] mb-2 tracking-wide">
            Paquetes Completos
          </h3>
          <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Elegí entre solo traslado o paquetes con entrada oficial asegurada, opciones de preventa y múltiples medios
            de pago.
          </p>
        </div>
      </div>
    </section>

    <!-- MODAL DE RESERVA RÁPIDA -->
    <UModal v-model:open="reservationModalOpen">
      <template #content>
        <div v-if="selectedEvent" class="p-6 bg-[#14141B] border border-[#2A2A38] rounded-2xl text-[#F5EEDC] space-y-5">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-bold uppercase text-[#E53924]">Reserva de Pasaje</span>
              <h3 class="text-2xl font-black uppercase text-[#F5EEDC]">
                {{ selectedEvent.artist_headliner }}
              </h3>
            </div>
            <button type="button" class="text-zinc-400 hover:text-[#F5EEDC] p-1" @click="reservationModalOpen = false">
              <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
            </button>
          </div>

          <div class="p-4 rounded-xl bg-[#1A1A22] border border-[#2A2A38] space-y-2 text-xs text-zinc-300">
            <p class="flex items-center gap-2">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-[#E53924]" />
              <strong class="text-[#F5EEDC]">Fecha:</strong> {{ formatEventDate(selectedEvent.event_date) }}
            </p>
            <p v-if="selectedEvent.venue" class="flex items-center gap-2">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-[#E53924]" />
              <strong class="text-[#F5EEDC]">Lugar:</strong> {{ selectedEvent.venue.name }} ({{ selectedEvent.venue.city
              }})
            </p>
            <p class="flex items-center gap-2">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-[#E53924]" />
              <strong class="text-[#F5EEDC]">Punto de Salida:</strong> {{ selectedEvent.departure_location }}
            </p>
          </div>

          <!-- Paquetes Disponibles -->
          <div v-if="selectedEvent.package_tiers && selectedEvent.package_tiers.length > 0" class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-zinc-400">Opciones de Paquete:</label>
            <div class="space-y-1.5">
              <div v-for="tier in selectedEvent.package_tiers" :key="tier.id"
                class="flex items-center justify-between p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A38] text-xs">
                <div>
                  <span class="font-bold text-[#F5EEDC]">{{ tier.name }}</span>
                  <span v-if="tier.early_bird" class="ml-2 text-[10px] text-amber-400 font-bold uppercase">⚡
                    Preventa</span>
                </div>
                <span class="font-black text-[#E53924]">{{ formatCurrency(tier.price) }}</span>
              </div>
            </div>
          </div>

          <!-- Acciones de Conversión -->
          <div class="pt-2 flex flex-col gap-2.5">
            <a :href="getWhatsAppReservationUrl(selectedEvent)" target="_blank" rel="noopener noreferrer"
              class="w-full py-3.5 rounded-xl font-black uppercase text-center text-xs tracking-wider bg-[#25D366] hover:bg-[#20ba5a] text-[#0F0F12] flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all">
              <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-5 h-5 stroke-[2.5]" />
              <span>Confirmar Reserva por WhatsApp</span>
            </a>
            <p class="text-center text-[11px] text-zinc-500">
              Un coordinador de Tripu te confirmará los asientos y te enviará los datos para el pago.
            </p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
