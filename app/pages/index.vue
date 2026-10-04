<script setup lang="ts">
import type { PublicFeaturedEvent } from '~/composables/usePublicEvents'

definePageMeta({
  layout: 'default'
})

useHead({
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
  ]
})

const {
  featuredEvents,
  loading,
  fetchFeaturedEvents,
  formatEventDate,
  getMinPrice,
  formatCurrency
} = usePublicEvents()

// Evento seleccionado para modal de reserva rápida
const selectedEvent = ref<PublicFeaturedEvent | null>(null)
const reservationModalOpen = ref(false)

onMounted(async () => {
  await fetchFeaturedEvents()
})

function handleSelectEvent(event: PublicFeaturedEvent) {
  selectedEvent.value = event
  reservationModalOpen.value = true
}

function getWhatsAppReservationUrl(event: PublicFeaturedEvent) {
  const phone = '5493564000000'
  const dateFormatted = formatEventDate(event.event_date)
  const venue = event.venue?.name || 'recital'
  const text = encodeURIComponent(
    `¡Hola Tripu! 👋 Quiero reservar mi lugar para el viaje al show de *${event.artist_headliner}* en ${venue} (${dateFormatted}). ¿Me pueden pasar los medios de pago y disponibilidad?`
  )
  return `https://wa.me/${phone}?text=${text}`
}
</script>

<template>
  <div class="relative bg-[#0F0F12] text-[#F5EEDC]">
    <!-- US-08: BANNER SUPERIOR / CARRUSEL DE EVENTOS DESTACADOS -->
    <FeaturedCarousel
      :events="featuredEvents"
      :loading="loading"
      :autoplay-interval="6500"
      @select="handleSelectEvent"
    />

    <!-- SECCIÓN INTERMEDIA: PROPUESTA DE VALOR TRIPU -->
    <section id="experiencia" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-b border-[#2A2A38]/50">
      <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#E53924]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#E53924]" />
          <span>Experiencia Tripu</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-black uppercase text-[#F5EEDC] tracking-tight">
          El Viaje es Parte de la Experiencia
        </h2>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
          No somos solo un traslado: armamos la previa, cuidamos cada detalle del trayecto y viajamos juntos con la misma energía del pogo.
        </p>
      </div>

      <!-- Grid de Beneficios -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <!-- Tarjeta 1 -->
        <div class="p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all duration-300 group">
          <div class="w-14 h-14 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mb-6 group-hover:scale-110 transition-transform">
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
        <div class="p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all duration-300 group">
          <div class="w-14 h-14 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mb-6 group-hover:scale-110 transition-transform">
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
        <div class="p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all duration-300 group">
          <div class="w-14 h-14 rounded-xl bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] mb-6 group-hover:scale-110 transition-transform">
            <UIcon name="i-heroicons-ticket" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold uppercase text-[#F5EEDC] mb-2 tracking-wide">
            Paquetes Completos
          </h3>
          <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Elegí entre solo traslado o paquetes con entrada oficial asegurada, opciones de preventa y múltiples medios de pago.
          </p>
        </div>
      </div>
    </section>

    <!-- TEASER DE PRÓXIMOS EVENTOS (Base para US-09) -->
    <section id="proximos-shows" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-[#E53924]">Cartelera Oficial</span>
          <h2 class="text-3xl sm:text-4xl font-black uppercase text-[#F5EEDC] tracking-tight">
            Próximas Salidas Confirmadas
          </h2>
        </div>
        <a
          href="https://wa.me/5493564000000"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#25D366] hover:underline"
        >
          <span>¿Buscás otro show? Consultanos</span>
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </a>
      </div>

      <!-- Grid Simplificado de Eventos -->
      <div v-if="featuredEvents && featuredEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="ev in featuredEvents"
          :key="ev.id"
          class="rounded-2xl bg-[#14141B] border border-[#2A2A38] overflow-hidden hover:border-[#E53924]/60 transition-all duration-300 flex flex-col group cursor-pointer"
          @click="handleSelectEvent(ev)"
        >
          <!-- Portada -->
          <div class="relative h-48 overflow-hidden bg-[#1A1A22]">
            <img
              :src="ev.image_url || '/branding/logo-tripu-horizontal-black.png'"
              :alt="ev.artist_headliner || ev.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-[#14141B] via-transparent to-transparent" />
            
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-[#E53924] text-[#F5EEDC] shadow">
                Confirmado
              </span>
            </div>
          </div>

          <!-- Contenido -->
          <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <span class="text-xs font-bold uppercase text-[#FF6B55]">
                {{ formatEventDate(ev.event_date) }}
              </span>
              <h3 class="text-2xl font-black uppercase text-[#F5EEDC] group-hover:text-[#E53924] transition-colors">
                {{ ev.artist_headliner || ev.title }}
              </h3>
              <p v-if="ev.venue" class="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-zinc-500" />
                <span>{{ ev.venue.name }}, {{ ev.venue.city }}</span>
              </p>
            </div>

            <div class="pt-4 border-t border-[#2A2A38] flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase text-zinc-500 block">Tarifa</span>
                <span class="text-lg font-black text-[#F5EEDC]">
                  {{ getMinPrice(ev.package_tiers) ? formatCurrency(getMinPrice(ev.package_tiers)!) : 'A consultar' }}
                </span>
              </div>
              <button
                type="button"
                class="px-4 py-2 rounded-xl text-xs font-black uppercase bg-[#E53924] hover:bg-[#d0301d] text-[#F5EEDC] transition-colors"
                @click.stop="handleSelectEvent(ev)"
              >
                Reservar
              </button>
            </div>
          </div>
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
            <button
              type="button"
              class="text-zinc-400 hover:text-[#F5EEDC] p-1"
              @click="reservationModalOpen = false"
            >
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
              <strong class="text-[#F5EEDC]">Lugar:</strong> {{ selectedEvent.venue.name }} ({{ selectedEvent.venue.city }})
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
              <div
                v-for="tier in selectedEvent.package_tiers"
                :key="tier.id"
                class="flex items-center justify-between p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A38] text-xs"
              >
                <div>
                  <span class="font-bold text-[#F5EEDC]">{{ tier.name }}</span>
                  <span v-if="tier.early_bird" class="ml-2 text-[10px] text-amber-400 font-bold uppercase">⚡ Preventa</span>
                </div>
                <span class="font-black text-[#E53924]">{{ formatCurrency(tier.price) }}</span>
              </div>
            </div>
          </div>

          <!-- Acciones de Conversión -->
          <div class="pt-2 flex flex-col gap-2.5">
            <a
              :href="getWhatsAppReservationUrl(selectedEvent)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-3.5 rounded-xl font-black uppercase text-center text-xs tracking-wider bg-[#25D366] hover:bg-[#20ba5a] text-[#0F0F12] flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all"
            >
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
