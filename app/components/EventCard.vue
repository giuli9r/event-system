<script setup lang="ts">
import type { PublicFeaturedEvent } from '~/composables/usePublicEvents'

interface Props {
  event: PublicFeaturedEvent
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', event: PublicFeaturedEvent): void
}>()

const { formatCardDate, getMinPrice, formatCurrency } = usePublicEvents()

// Fallback por defecto si el evento no tiene flyer cargado
const DEFAULT_CARD_IMAGE = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'

const isSoldOut = computed(() => props.event.status === 'sold_out')
const minPrice = computed(() => getMinPrice(props.event.package_tiers))

function handleSelect() {
  // Evitar apertura de modal o acción si el viaje está agotado
  if (isSoldOut.value) return
  emit('select', props.event)
}
</script>

<template>
  <article
    class="group relative rounded-2xl bg-[#14141B] border border-[#2A2A38] transition-all duration-300 flex flex-col overflow-hidden shadow-lg select-none"
    :class="isSoldOut
      ? 'opacity-85 cursor-not-allowed border-[#2A2A38]/50'
      : 'cursor-pointer hover:border-[#E53924]/60 hover:shadow-2xl hover:shadow-[#E53924]/10'"
    @click="handleSelect"
  >
    <!-- CONTENEDOR DEL FLYER / IMAGEN (Proporción vertical 4:5 estilo póster) -->
    <div class="relative w-full aspect-[4/5] overflow-hidden bg-[#1A1A22]">
      <!-- Imagen del recital -->
      <img
        :src="event.image_url || DEFAULT_CARD_IMAGE"
        :alt="event.artist_headliner || event.title"
        class="w-full h-full object-cover object-center transition-transform duration-500 ease-out"
        :class="isSoldOut
          ? 'filter grayscale-[60%] brightness-65'
          : 'group-hover:scale-105'"
        loading="lazy"
      />

      <!-- Badge Flotante Superior para Destacados -->
      <div v-if="event.is_featured && !isSoldOut" class="absolute top-3 right-3 z-10">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E53924] text-[#F5EEDC] shadow-md shadow-[#E53924]/30">
          <UIcon name="i-heroicons-star" class="w-3 h-3 text-amber-300 fill-amber-300" />
          <span>Destacado</span>
        </span>
      </div>

      <!-- ESTADO DE AGOTADO (Cartel central estilo mockup PROXIMOS_EVENTOS.png) -->
      <div
        v-if="isSoldOut"
        class="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      >
        <span class="px-5 py-2 rounded-lg bg-[#0F0F12]/95 border border-zinc-700/80 text-zinc-300 font-mono font-black text-xs sm:text-sm uppercase tracking-[0.25em] shadow-2xl">
          AGOTADO
        </span>
      </div>

      <!-- TIRA INFERIOR DE DISPONIBILIDAD (Fiel a la maqueta de diseño) -->
      <div class="absolute bottom-0 inset-x-0 z-10">
        <div
          v-if="!isSoldOut"
          class="w-full py-1.5 px-3 bg-[#14141B]/95 border-t border-[#2A2A38]/70 text-center backdrop-blur-sm"
        >
          <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#F5EEDC]">
            ENTRADAS DISPONIBLES
          </span>
        </div>
        <div
          v-else
          class="w-full py-1.5 px-3 bg-[#1A1A22]/95 border-t border-[#2A2A38]/70 text-center"
        >
          <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            CUPOS COMPLETOS
          </span>
        </div>
      </div>
    </div>

    <!-- CUERPO INFORMATIVO DE LA TARJETA (Texto y Metadatos) -->
    <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-[#14141B]">
      <!-- Bloque 1: Artista y Recinto -->
      <div class="space-y-1">
        <!-- Nombre del Artista / Banda Principal -->
        <h3
          class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] tracking-tight transition-colors leading-snug line-clamp-1"
          :class="!isSoldOut ? 'group-hover:text-[#E53924]' : 'text-zinc-300'"
        >
          {{ event.artist_headliner || event.title }}
        </h3>

        <!-- Recinto / Estadio -->
        <p v-if="event.venue" class="text-xs sm:text-sm text-zinc-400 font-medium line-clamp-1">
          {{ event.venue.name }}
        </p>
      </div>

      <!-- Bloque 2: Fecha y Ciudad con separador puntual -->
      <div class="flex items-center flex-wrap gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
        <span :class="!isSoldOut ? 'text-[#FF6B55]' : 'text-zinc-500'">
          {{ formatCardDate(event.event_date) }}
        </span>
        <span class="text-[#E53924] font-black">•</span>
        <span v-if="event.venue" class="text-zinc-300">
          {{ event.venue.city }}
        </span>
      </div>

      <!-- Bloque 3: Tarifa y Botón de Acción -->
      <div class="pt-3 border-t border-[#2A2A38] flex items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Tarifa</span>
          <span v-if="minPrice" class="text-base sm:text-lg font-black tracking-tight" :class="isSoldOut ? 'text-zinc-500 line-through' : 'text-[#F5EEDC]'">
            {{ formatCurrency(minPrice) }}
          </span>
          <span v-else class="text-xs font-semibold text-zinc-400">
            A consultar
          </span>
        </div>

        <button
          type="button"
          :disabled="isSoldOut"
          :aria-disabled="isSoldOut"
          class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200"
          :class="isSoldOut
            ? 'bg-[#1A1A22] text-zinc-500 border border-[#2A2A38] cursor-not-allowed opacity-60'
            : 'bg-[#E53924] hover:bg-[#d0301d] text-[#F5EEDC] shadow-md shadow-[#E53924]/20 active:scale-95 cursor-pointer'"
          @click.stop="handleSelect"
        >
          {{ isSoldOut ? 'Agotado' : 'Reservar' }}
        </button>
      </div>
    </div>
  </article>
</template>
