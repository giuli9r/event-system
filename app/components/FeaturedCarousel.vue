<script setup lang="ts">
import type { PublicFeaturedEvent } from '~/composables/usePublicEvents'

interface Props {
  events?: PublicFeaturedEvent[]
  loading?: boolean
  autoplayInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  events: () => [],
  loading: false,
  autoplayInterval: 6000
})

const emit = defineEmits<{
  (e: 'select', event: PublicFeaturedEvent): void
}>()

const { formatEventDate, formatEventTime, getMinPrice, formatCurrency } = usePublicEvents()

// Slide activo
const currentIndex = ref(0)
const isPaused = ref(false)
const progress = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let progressTimer: ReturnType<typeof setInterval> | null = null

// Fallback de imagen por defecto
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80'

const totalSlides = computed(() => props.events.length)
const currentEvent = computed(() => props.events[currentIndex.value] || null)

// Navegación
function nextSlide() {
  if (totalSlides.value <= 1) return
  currentIndex.value = (currentIndex.value + 1) % totalSlides.value
  resetProgress()
}

function prevSlide() {
  if (totalSlides.value <= 1) return
  currentIndex.value = (currentIndex.value - 1 + totalSlides.value) % totalSlides.value
  resetProgress()
}

function goToSlide(index: number) {
  if (index >= 0 && index < totalSlides.value) {
    currentIndex.value = index
    resetProgress()
  }
}

// Autoplay & Barra de Progreso
function resetProgress() {
  progress.value = 0
}

function startAutoplay() {
  // Asegurar ejecución estricta solo en entorno navegador/cliente
  if (!import.meta.client) return

  stopAutoplay()
  if (totalSlides.value <= 1) return

  const intervalStep = 50 // ms
  const totalSteps = props.autoplayInterval / intervalStep

  progressTimer = setInterval(() => {
    if (!isPaused.value) {
      progress.value += 100 / totalSteps
      if (progress.value >= 100) {
        nextSlide()
      }
    }
  }, intervalStep)
}

function stopAutoplay() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function pauseAutoplay() {
  isPaused.value = true
}

function resumeAutoplay() {
  isPaused.value = false
}

// Gestos Touch (Mobile Swipe)
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 45

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.changedTouches[0]?.screenX ?? 0
  pauseAutoplay()
}

function onTouchEnd(e: TouchEvent) {
  touchEndX.value = e.changedTouches[0]?.screenX ?? 0
  handleSwipe()
  resumeAutoplay()
}

function handleSwipe() {
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > minSwipeDistance) {
    if (diff > 0) {
      nextSlide()
    } else {
      prevSlide()
    }
  }
}

// Navegación por teclado
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    nextSlide()
  } else if (e.key === 'ArrowLeft') {
    prevSlide()
  }
}

// Link a WhatsApp
function getWhatsAppLink(event: PublicFeaturedEvent) {
  const phone = '5493564000000' // Número de atención de Tripu
  const dateFormatted = formatEventDate(event.event_date)
  const venueName = event.venue?.name || 'el recital'
  const text = encodeURIComponent(
    `¡Hola Tripu Producciones! 👋 Quería consultar disponibilidad e información para el viaje al show de *${event.artist_headliner}* en ${venueName} (${dateFormatted}).`
  )
  return `https://wa.me/${phone}?text=${text}`
}

// Desplazamiento suave hacia la cartelera de próximos eventos
function scrollToUpcoming() {
  const target = document.getElementById('proximos-shows')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

watch(
  () => props.events.length,
  (newLen) => {
    if (currentIndex.value >= newLen) {
      currentIndex.value = 0
    }
    resetProgress()
    if (import.meta.client) {
      if (newLen > 1) {
        startAutoplay()
      } else {
        stopAutoplay()
      }
    }
  }
)

onMounted(() => {
  if (totalSlides.value > 1) {
    startAutoplay()
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopAutoplay()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <section class="relative w-full overflow-hidden bg-[#0F0F12] select-none group"
    aria-label="Carrusel de Eventos y Shows Destacados" @mouseenter="pauseAutoplay" @mouseleave="resumeAutoplay"
    @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- SKELETON LOADING STATE -->
    <div v-if="loading"
      class="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] bg-[#14141B] flex items-center justify-center animate-pulse px-4 sm:px-8">
      <div class="max-w-7xl w-full flex flex-col justify-end pb-16 space-y-4">
        <div class="w-36 h-6 bg-[#2A2A38] rounded-full" />
        <div class="w-3/4 sm:w-1/2 h-12 sm:h-16 bg-[#2A2A38] rounded-xl" />
        <div class="flex gap-4">
          <div class="w-32 h-6 bg-[#2A2A38] rounded-md" />
          <div class="w-40 h-6 bg-[#2A2A38] rounded-md" />
        </div>
        <div class="flex gap-4 pt-4">
          <div class="w-44 h-12 bg-[#2A2A38] rounded-xl" />
          <div class="w-36 h-12 bg-[#2A2A38] rounded-xl" />
        </div>
      </div>
    </div>

    <!-- EMPTY STATE (Sin eventos destacados cargados) -->
    <div v-else-if="!events || events.length === 0"
      class="relative w-full min-h-[460px] lg:h-[520px] bg-gradient-to-b from-[#14141B] to-[#0F0F12] border-b border-[#2A2A38] flex items-center justify-center px-4">
      <div class="max-w-2xl text-center space-y-6 py-12">
        <div
          class="inline-flex items-center justify-center p-3 rounded-2xl bg-[#E53924]/10 border border-[#E53924]/30 text-[#E53924] mb-2">
          <img src="/branding/logo-tripu-badge-sm.webp" alt="Tripu Sello"
            class="w-16 h-16 object-contain drop-shadow" />
        </div>
        <h2 class="text-3xl sm:text-4xl font-black uppercase text-[#F5EEDC] tracking-tight">
          El Viaje es Parte de la Experiencia
        </h2>
        <p class="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
          Estamos confirmando nuevas fechas y salidas a los mejores recitales del país. ¡Seguinos para no perderte el
          próximo viaje!
        </p>
        <div class="flex flex-wrap justify-center gap-3 pt-2">
          <UButton to="/admin/login" color="primary"
            class="bg-[#E53924] hover:bg-[#d0301d] text-[#F5EEDC] font-bold px-6 py-2.5 rounded-xl border-none">
            Ver Próximos Viajes
          </UButton>
          <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-sm font-semibold transition-colors">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4" />
            <span>Consultas por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>

    <!-- CARROUSEL PRINCIPAL CON SLIDES -->
    <div v-else class="relative w-full h-[540px] sm:h-[580px] lg:h-[640px] select-none">
      <!-- DIAPOSITIVAS -->
      <div v-for="(event, idx) in events" :key="event.id"
        class="absolute inset-0 transition-opacity duration-700 ease-in-out"
        :class="idx === currentIndex ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'">
        <!-- CAPA 0: IMAGEN DE FONDO / FLYER -->
        <div class="absolute inset-0 w-full h-full overflow-hidden">
          <img :src="event.image_url || DEFAULT_FALLBACK_IMAGE" :alt="event.artist_headliner || event.title"
            class="w-full h-full object-cover object-center transform scale-105 transition-transform duration-[10000ms] ease-out"
            :class="idx === currentIndex ? 'scale-100' : 'scale-105'" :loading="idx === 0 ? 'eager' : 'lazy'"
            :fetchpriority="idx === 0 ? 'high' : 'auto'" decoding="async" />
        </div>

        <!-- CAPA 1: GRADIENTES SCRIM (Oscurecimiento lateral y degradé a negro en base) -->
        <!-- Gradiente Base (Vertical: asegura fundido con el fondo del body #0F0F12) -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/75 via-45% to-transparent" />

        <!-- Gradiente Lateral Desktop (Horizontal: garantiza legibilidad total del texto izquierdo) -->
        <div
          class="absolute inset-0 bg-gradient-to-r from-[#0F0F12] via-[#0F0F12]/85 sm:via-[#0F0F12]/70 sm:to-transparent" />

        <!-- Viñeta perimetral de contraste rockero -->
        <div class="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

        <!-- CAPA 2: SELLO DE MARCA FLOTANTE (Badge decorativo oficial) -->
        <div
          class="hidden lg:block absolute top-12 right-12 z-20 pointer-events-none opacity-85 hover:opacity-100 transition-opacity">
          <div class="relative group/badge">
            <img src="/branding/logo-tripu-badge-sm.webp" alt="Sello Oficial Tripu Producciones"
              class="w-28 h-28 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] filter brightness-95" />
          </div>
        </div>

        <!-- CAPA 3: CONTENIDO INFORMATIVO DEL EVENTO -->
        <div class="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-end pb-16 sm:pb-20">
          <div class="max-w-3xl space-y-4 sm:space-y-5">
            <!-- BADGE SUPERIOR DE STATUS / TAG -->
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#E53924]/20 border border-[#E53924]/50 text-[#E53924] shadow-sm shadow-[#E53924]/20 backdrop-blur-md">
                <span class="w-2 h-2 rounded-full bg-[#E53924] animate-ping" />
                <span>Salida Confirmada</span>
              </span>

              <span v-if="event.is_featured"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-[#F5EEDC]/10 border border-[#F5EEDC]/20 text-[#F5EEDC] backdrop-blur-md">
                <UIcon name="i-heroicons-star" class="w-3.5 h-3.5 text-amber-400" />
                <span>Destacado</span>
              </span>

              <span v-if="getMinPrice(event.package_tiers)"
                class="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1A1A22]/80 border border-[#2A2A38] text-zinc-300">
                {{event.package_tiers.some(t => t.includes_ticket) ? 'Traslado + Entrada disponible' : 'Solo Traslado'
                }}
              </span>
            </div>

            <!-- TÍTULO PRINCIPAL: ARTISTA HEADLINER -->
            <div>
              <h1
                class="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-[#F5EEDC] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] leading-none">
                {{ event.artist_headliner || event.title }}
              </h1>

              <!-- Subtítulo o nombre de gira -->
              <p v-if="event.title && event.title.toLowerCase() !== event.artist_headliner?.toLowerCase()"
                class="mt-2 text-base sm:text-xl font-bold text-zinc-300 drop-shadow line-clamp-1">
                {{ event.title }}
              </p>
            </div>

            <!-- METADATOS CLAVE (Fecha, Recinto, Ubicación) -->
            <div
              class="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
              <!-- Fecha -->
              <div class="flex items-center gap-1.5 text-[#FF6B55]">
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 sm:w-5 sm:h-5 text-[#E53924]" />
                <span>{{ formatEventDate(event.event_date) }}</span>
              </div>

              <!-- Recinto & Ciudad -->
              <div v-if="event.venue" class="flex items-center gap-1.5">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                <span>{{ event.venue.name }} <span class="text-zinc-500">•</span> {{ event.venue.city }}</span>
              </div>

              <!-- Salida y Origen -->
              <div v-if="event.departure_location" class="hidden md:flex items-center gap-1.5 text-zinc-400">
                <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 text-zinc-500" />
                <span>Salida: {{ event.departure_location }}</span>
              </div>
            </div>

            <!-- PRECIO Y BOTONES DE CONVERSIÓN (CTAs) -->
            <div class="pt-2 flex flex-wrap items-center gap-4">
              <!-- Bloque Precio "Desde" -->
              <div v-if="getMinPrice(event.package_tiers)" class="flex flex-col pr-2 border-r border-[#2A2A38]">
                <span class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400">Desde</span>
                <span class="text-2xl sm:text-3xl font-black text-[#F5EEDC] tracking-tight">
                  {{ formatCurrency(getMinPrice(event.package_tiers)!) }}
                </span>
              </div>

              <!-- Botón Primario: Ver Viaje / Reservar -->
              <a v-if="event.slug" :href="`/viajes/${event.slug}`" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm bg-[#E53924] hover:bg-[#d0301d] text-white shadow-lg shadow-[#E53924]/30 active:scale-95 transition-all duration-200">
                <span>Ver Viaje y Reservar</span>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 stroke-[2.5]" />
              </a>
              <button v-else type="button"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm bg-[#E53924] hover:bg-[#d0301d] text-white shadow-lg shadow-[#E53924]/30 active:scale-95 transition-all duration-200"
                @click="emit('select', event)">
                <span>Reservar Lugar</span>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 stroke-[2.5]" />
              </button>

              <!-- Botón Secundario: WhatsApp Oficial -->
              <a :href="getWhatsAppLink(event)" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] transition-all duration-200">
                <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4" />
                <span>Consultar</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- CAPA 4: CONTROLES DE NAVEGACIÓN (Flechas Prev/Next) -->
      <template v-if="totalSlides > 1">
        <!-- Flecha Anterior -->
        <button type="button" aria-label="Viaje anterior"
          class="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-[#1A1A22]/75 hover:bg-[#E53924] text-[#F5EEDC] border border-[#2A2A38] hover:border-[#E53924] backdrop-blur-md shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          @click="prevSlide">
          <UIcon name="i-heroicons-chevron-left" class="w-6 h-6 stroke-[2.5]" />
        </button>

        <!-- Flecha Siguiente -->
        <button type="button" aria-label="Siguiente viaje"
          class="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-[#1A1A22]/75 hover:bg-[#E53924] text-[#F5EEDC] border border-[#2A2A38] hover:border-[#E53924] backdrop-blur-md shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
          @click="nextSlide">
          <UIcon name="i-heroicons-chevron-right" class="w-6 h-6 stroke-[2.5]" />
        </button>

        <!-- CAPA 5: INDICADORES INFERIORES (Paginación + Contador de Diapositivas) -->
        <div
          class="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 z-30 flex items-center gap-3 bg-[#14141B]/80 border border-[#2A2A38] px-3.5 py-1 rounded-full backdrop-blur-md">
          <!-- Dots Interactivos (Área táctil accesible de mínimo 28px) -->
          <div class="flex items-center gap-1">
            <button v-for="(_, idx) in events" :key="idx" type="button" :aria-label="`Ir a diapositiva ${idx + 1}`"
              class="h-7 px-1 flex items-center justify-center cursor-pointer" @click="goToSlide(idx)">
              <span class="h-1.5 rounded-full transition-all duration-300 block"
                :class="idx === currentIndex ? 'w-6 bg-[#E53924]' : 'w-2 bg-zinc-500 hover:bg-zinc-300'" />
            </button>
          </div>

          <!-- Divisor -->
          <span class="text-zinc-600 text-xs">|</span>

          <!-- Contador Numérico 01 / 03 -->
          <span class="text-xs font-mono font-bold text-[#F5EEDC]">
            <span class="text-[#E53924]">{{ String(currentIndex + 1).padStart(2, '0') }}</span>
            <span class="text-zinc-500">/{{ String(totalSlides).padStart(2, '0') }}</span>
          </span>
        </div>

        <!-- BARRA DE PROGRESO DE AUTOPLAY (Línea muy fina superior) -->
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-[#2A2A38]/40 z-30 overflow-hidden">
          <div class="h-full bg-[#E53924] transition-[width] duration-75 ease-linear"
            :style="{ width: `${progress}%` }" />
        </div>
      </template>
      <!-- BOTÓN FLOTANTE CON MOVIMIENTO DE SUSPENSIÓN Y NUXT-DEVTOOLS GLOW EN HOVER -->
      <div
        class="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto">
        <button type="button" aria-label="Desplazarse a los próximos recitales" title="Ver próximos recitales"
          class="group/scroll flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer select-none"
          @click="scrollToUpcoming">
          <span
            class="hidden md:inline-block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 group-hover/scroll:text-[#E53924] transition-all duration-300 drop-shadow group-hover/scroll:drop-shadow-[0_0_10px_rgba(229,57,36,0.7)]">

          </span>

          <!-- Contenedor con movimiento de suspensión -->
          <div class="relative flex items-center justify-center animate-suspension">
            <!-- 1. Aura Difusa Perimetral (Ambient Glow estilo Nuxt DevTools) -->
            <div
              class="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#E53924] via-[#FF6B55] to-[#E53924] opacity-0 group-hover/scroll:opacity-85 blur-md transition-all duration-500 group-hover/scroll:scale-125 pointer-events-none" />

            <!-- 2. Borde Conic Giratorio Luminoso (DevTools Animated Glowing Border) -->
            <div
              class="absolute -inset-[1.5px] rounded-full overflow-hidden opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div
                class="absolute -inset-[100%] animate-devtools-spin bg-[conic-gradient(from_0deg,#E53924_0%,#FF5733_25%,#F5EEDC_50%,#E53924_75%,#FF5733_100%)]" />
            </div>

            <!-- 3. Botón Central con Fondo Dark y Flecha Resaltada -->
            <div
              class="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#14141B]/95 group-hover/scroll:bg-[#121217] border border-[#2A2A38] group-hover/scroll:border-transparent text-[#F5EEDC] flex items-center justify-center backdrop-blur-md shadow-xl transition-all duration-300">
              <UIcon name="i-heroicons-chevron-down"
                class="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-[#F5EEDC] group-hover/scroll:text-[#E53924] transition-colors duration-200" />
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Gradiente radial personalizado para un efecto sutil de viñeta teatral */
.bg-radial-gradient {
  background: radial-gradient(circle at 60% 40%, transparent 20%, rgba(15, 15, 18, 0.8) 100%);
}

/* Rotación continua del borde cónico estilo Nuxt DevTools Glowing */
@keyframes devtools-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.animate-devtools-spin {
  animation: devtools-spin 3s linear infinite;
}

/* Movimiento de suspensión suave para invitar al scroll hacia abajo */
@keyframes suspension {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(7px);
  }
}

.animate-suspension {
  animation: suspension 2.2s ease-in-out infinite;
}
</style>
