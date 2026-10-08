<script setup lang="ts">
interface ExperiencePhoto {
  id: number
  src: string
  alt: string
  caption: string
}

// 19 fotos de experiencias oficiales optimizadas en WebP
const photos: ExperiencePhoto[] = [
  { id: 1, src: '/experiencias/experiencia-01.webp', alt: 'Comunidad Tripu camino al pogo', caption: 'La Tripu camino al pogo' },
  { id: 2, src: '/experiencias/experiencia-02.webp', alt: 'Pasajeros disfrutando del viaje al recital', caption: 'La bendición del grupo' },
  { id: 3, src: '/experiencias/experiencia-03.webp', alt: 'Show y fiesta en vivo', caption: 'Fiesta y música en vivo' },
  { id: 4, src: '/experiencias/experiencia-04.webp', alt: 'Llegada al estadio en unidad habilitada', caption: 'Llegada a la previa' },
  { id: 5, src: '/experiencias/experiencia-05.webp', alt: 'Coordinación y asistencia en el punto de encuentro', caption: 'Coordinación permanente' },
  { id: 6, src: '/experiencias/experiencia-06.webp', alt: 'Disfrutando el show', caption: 'Disfrutando el show' },
  { id: 7, src: '/experiencias/experiencia-07.webp', alt: 'Pasajeros viviendo la previa del show', caption: 'Ingresando al show' },
  { id: 8, src: '/experiencias/experiencia-08.webp', alt: 'Amigos en el show', caption: 'La experiencia es todo' },
  { id: 9, src: '/experiencias/experiencia-09.webp', alt: 'Ingreso al predio del festival', caption: 'Experiencia festival' },
  { id: 10, src: '/experiencias/experiencia-10.webp', alt: 'Festejos y sonrisas antes del recital', caption: 'Momentos inolvidables' },
  { id: 11, src: '/experiencias/experiencia-11.webp', alt: 'Grupo completo de pasajeros Tripu', caption: 'Viajeros apasionados' },
  { id: 12, src: '/experiencias/experiencia-12.webp', alt: 'Postales de pasajeros en ruta. Unidad de primera línea', caption: 'Momentos en ruta' },
  { id: 13, src: '/experiencias/experiencia-13.webp', alt: 'El colectivo oficial de Tripu Producciones', caption: 'Rock y amigos' },
  { id: 14, src: '/experiencias/experiencia-14.webp', alt: 'Encuentro de fanáticos en la terminal', caption: 'Snacks y música' },
  { id: 15, src: '/experiencias/experiencia-15.webp', alt: 'Celebración grupal en la previa del show', caption: 'Pura fiesta rockera' },
  { id: 16, src: '/experiencias/experiencia-16.webp', alt: 'Regreso seguro y coordinado post show', caption: 'Regreso seguro a casa' },
  { id: 17, src: '/experiencias/experiencia-17.webp', alt: 'Amigas y familia', caption: 'Amigas y familia' },
  { id: 18, src: '/experiencias/experiencia-18.webp', alt: 'Público cantando rumbo al recital', caption: 'Fiesta asegurada' },
  { id: 19, src: '/experiencias/experiencia-19.webp', alt: 'Foto grupal oficial Tripu Producciones', caption: 'Familia Tripu disfrutando' }
]

const scrollContainer = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const totalPhotos = photos.length
const isPaused = ref(false)
let autoplayTimer: ReturnType<typeof setInterval> | null = null

// Modal lightbox para zoom en alta definición
const selectedPhoto = ref<ExperiencePhoto | null>(null)
const isLightboxOpen = ref(false)

function openLightbox(photo: ExperiencePhoto) {
  selectedPhoto.value = photo
  isLightboxOpen.value = true
  isPaused.value = true
}

function closeLightbox() {
  isLightboxOpen.value = false
  selectedPhoto.value = null
  isPaused.value = false
}

function nextLightboxPhoto() {
  if (!selectedPhoto.value) return
  const currentIdx = photos.findIndex(p => p.id === selectedPhoto.value?.id)
  const nextIdx = (currentIdx + 1) % totalPhotos
  selectedPhoto.value = photos[nextIdx]
}

function prevLightboxPhoto() {
  if (!selectedPhoto.value) return
  const currentIdx = photos.findIndex(p => p.id === selectedPhoto.value?.id)
  const prevIdx = (currentIdx - 1 + totalPhotos) % totalPhotos
  selectedPhoto.value = photos[prevIdx]
}

// Obtener el ancho de paso (1 tarjeta + gap)
function getStepWidth(): number {
  if (!scrollContainer.value) return 300
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement
  if (firstChild) {
    const style = window.getComputedStyle(scrollContainer.value)
    const gap = parseFloat(style.gap) || 16
    return firstChild.offsetWidth + gap
  }
  return 300
}

// Bucle infinito: Avanzar
function nextSlide() {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const step = getStepWidth()
  const maxScroll = el.scrollWidth - el.clientWidth

  if (el.scrollLeft >= maxScroll - 15) {
    // Wrap al inicio
    el.scrollTo({ left: 0, behavior: 'smooth' })
    currentIndex.value = 0
  } else {
    el.scrollBy({ left: step, behavior: 'smooth' })
  }
}

// Bucle infinito: Retroceder
function prevSlide() {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const step = getStepWidth()
  const maxScroll = el.scrollWidth - el.clientWidth

  if (el.scrollLeft <= 15) {
    // Wrap al final
    el.scrollTo({ left: maxScroll, behavior: 'smooth' })
    currentIndex.value = totalPhotos - 1
  } else {
    el.scrollBy({ left: -step, behavior: 'smooth' })
  }
}

// Monitoreo del scroll para actualizar índice actual
function handleScroll() {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const step = getStepWidth()
  const index = Math.round(el.scrollLeft / step)
  currentIndex.value = Math.min(totalPhotos - 1, Math.max(0, index))
}

// Autoplay suave cada 4.5s
function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    if (!isPaused.value && !isLightboxOpen.value) {
      nextSlide()
    }
  }, 4500)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// Navegación por teclado
function handleKeydown(e: KeyboardEvent) {
  if (isLightboxOpen.value) {
    if (e.key === 'ArrowRight') nextLightboxPhoto()
    if (e.key === 'ArrowLeft') prevLightboxPhoto()
    if (e.key === 'Escape') closeLightbox()
  }
}

onMounted(() => {
  startAutoplay()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopAutoplay()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="relative w-full my-10 select-none" @mouseenter="isPaused = true" @mouseleave="isPaused = false">
    <!-- Encabezado sutil del carrusel -->
    <div class="flex items-center justify-between mb-5 px-1">
      <div class="flex items-center gap-2.5">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-[11px] font-bold uppercase tracking-wider text-[#F5EEDC]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#E53924] animate-pulse" />
          <span>Evidencia de Viajes</span>
        </span>
        <span class="text-xs text-zinc-400 hidden sm:inline">
          La previa, la ruta y la llegada en fotos reales de nuestros pasajeros
        </span>
      </div>

      <!-- Controles de navegación minimalistas con dos flechas -->
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-mono text-zinc-400 mr-2">
          <strong class="text-[#F5EEDC]">{{ String(currentIndex + 1).padStart(2, '0') }}</strong> / {{
            String(totalPhotos).padStart(2, '0') }}
        </span>

        <!-- Flecha Anterior -->
        <button type="button"
          class="w-9 h-9 rounded-full bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924] text-zinc-300 hover:text-white hover:bg-[#E53924] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          aria-label="Foto anterior de la experiencia" title="Ver foto anterior" @click="prevSlide">
          <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
        </button>

        <!-- Flecha Siguiente -->
        <button type="button"
          class="w-9 h-9 rounded-full bg-[#14141B] border border-[#2A2A38] hover:border-[#E53924] text-zinc-300 hover:text-white hover:bg-[#E53924] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          aria-label="Foto siguiente de la experiencia" title="Ver foto siguiente" @click="nextSlide">
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Contenedor del Carrusel con Máscara y Scroll Nativo Snap -->
    <div class="relative rounded-2xl overflow-hidden">
      <!-- Gradientes sutiles en los extremos para estética editorial -->
      <div
        class="pointer-events-none absolute left-0 inset-y-0 w-6 sm:w-12 bg-gradient-to-r from-[#0F0F12] to-transparent z-10" />
      <div
        class="pointer-events-none absolute right-0 inset-y-0 w-6 sm:w-12 bg-gradient-to-l from-[#0F0F12] to-transparent z-10" />

      <!-- Track deslizable con scroll suave -->
      <div ref="scrollContainer"
        class="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth scrollbar-none py-2 px-1 focus:outline-none"
        tabindex="0" aria-label="Carrusel de fotos de experiencia Tripu" @scroll.passive="handleScroll">
        <div v-for="photo in photos" :key="photo.id"
          class="shrink-0 w-[72%] sm:w-[38%] md:w-[28%] lg:w-[22%] group cursor-pointer focus:outline-none" tabindex="0"
          role="button" :aria-label="`Ampliar foto: ${photo.caption}`" @click="openLightbox(photo)"
          @keydown.enter.prevent="openLightbox(photo)" @keydown.space.prevent="openLightbox(photo)">
          <div
            class="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#14141B] border border-[#2A2A38] group-hover:border-[#E53924]/60 transition-all duration-300 shadow-xl shadow-black/50">
            <!-- Imagen con Lazy Loading y Decoding Asíncrono sin bloquear el hilo principal -->
            <img :src="photo.src" :alt="photo.alt" loading="lazy" decoding="async" width="960" height="1280"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />

            <!-- Gradiente inferior e información de la postal -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-85 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <span class="text-[10px] uppercase font-bold tracking-wider text-[#FF6B55] mb-0.5">
                Tripu Experiencia
              </span>
              <p
                class="text-xs sm:text-sm font-bold text-[#F5EEDC] line-clamp-1 group-hover:text-white transition-colors">
                {{ photo.caption }}
              </p>
            </div>

            <!-- Botón flotante de zoom -->
            <div
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
              <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Lightbox (Zoom en Pantalla Completa) -->
    <Teleport to="body">
      <div v-if="isLightboxOpen && selectedPhoto"
        class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in"
        role="dialog" aria-modal="true" :aria-label="selectedPhoto.alt" @click.self="closeLightbox">
        <!-- Botón Cerrar -->
        <button type="button"
          class="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-[#14141B]/90 hover:bg-[#E53924] border border-[#2A2A38] text-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-lg"
          aria-label="Cerrar visor de foto" @click="closeLightbox">
          <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
        </button>

        <!-- Flecha Anterior Lightbox -->
        <button type="button"
          class="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#14141B]/90 hover:bg-[#E53924] border border-[#2A2A38] text-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-lg"
          aria-label="Foto anterior" @click="prevLightboxPhoto">
          <UIcon name="i-heroicons-chevron-left" class="w-7 h-7" />
        </button>

        <!-- Flecha Siguiente Lightbox -->
        <button type="button"
          class="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#14141B]/90 hover:bg-[#E53924] border border-[#2A2A38] text-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-lg"
          aria-label="Foto siguiente" @click="nextLightboxPhoto">
          <UIcon name="i-heroicons-chevron-right" class="w-7 h-7" />
        </button>

        <!-- Contenedor central de la foto -->
        <div class="max-w-4xl max-h-[90vh] flex flex-col items-center">
          <img :src="selectedPhoto.src" :alt="selectedPhoto.alt" decoding="async"
            class="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-[#2A2A38]" />
          <div class="mt-4 text-center">
            <p class="text-sm sm:text-base font-bold text-[#F5EEDC]">
              {{ selectedPhoto.caption }}
            </p>
            <p class="text-xs text-zinc-400 mt-0.5">
              Tripu Producciones • El viaje es parte de la experiencia
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Ocultar barra de scroll nativa */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>
