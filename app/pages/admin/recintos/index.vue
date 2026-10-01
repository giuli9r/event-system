<script setup lang="ts">
import { z } from 'zod'
import type { Venue, VenueType } from '~/composables/useVenues'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const toast = useToast()
const { venues, loading, error, isCacheValid, fetchVenues, createVenue, updateVenue, deleteVenue } = useVenues()

// Tipologías oficiales de recintos (incluye 'predio' y 'complejo')
const venueTypeOptions: { value: VenueType; label: string; icon: string }[] = [
  { value: 'estadio', label: 'Estadio', icon: 'i-heroicons-building-office-2' },
  { value: 'arena', label: 'Arena / Microestadio', icon: 'i-heroicons-sparkles' },
  { value: 'predio', label: 'Predio', icon: 'i-heroicons-map' },
  { value: 'complejo', label: 'Complejo', icon: 'i-heroicons-building-library' },
  { value: 'campo', label: 'Campo / Aire Libre', icon: 'i-heroicons-globe-americas' },
  { value: 'club', label: 'Club / Sede Deportiva', icon: 'i-heroicons-user-group' },
  { value: 'sala', label: 'Sala / Teatro', icon: 'i-heroicons-ticket' },
  { value: 'boliche', label: 'Boliche / Club Nocturno', icon: 'i-heroicons-musical-note' },
  { value: 'estudio', label: 'Estudio / Auditorio', icon: 'i-heroicons-microphone' },
  { value: 'bar', label: 'Bar / Café Concert', icon: 'i-heroicons-beaker' },
  { value: 'sitio_publico', label: 'Espacio Público', icon: 'i-heroicons-flag' },
  { value: 'edificio', label: 'Edificio / Salón', icon: 'i-heroicons-building-office' }
]

// Presets ágiles de aforo
const capacityPresets = [
  { label: '1.5k (Teatro)', value: 1500 },
  { label: '5k (Auditorio)', value: 5000 },
  { label: '15k (Arena)', value: 15000 },
  { label: '35k (Predio)', value: 35000 },
  { label: '50k (Estadio)', value: 50000 },
  { label: '85k (Monumental)', value: 85000 }
]

/**
 * Validador estricto para enlaces de Google Maps.
 * Acepta únicamente URLs oficiales de la app y web de Google Maps:
 * - maps.app.goo.gl/... (enlace directo desde la app móvil)
 * - goo.gl/maps/... (enlace acortado legacy de Google Maps)
 * - maps.google.com o maps.google.com.ar (subdominio oficial)
 * - google.com/maps/... o google.com.ar/maps/... (ruta web estándar)
 */
function isValidGoogleMapsUrl(val?: string | null): boolean {
  if (!val || val.trim() === '') return true
  try {
    const parsed = new URL(val.trim())
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false
    }

    const host = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname.toLowerCase()

    // 1. Enlace móvil oficial de Google Maps app
    if (host === 'maps.app.goo.gl') return true

    // 2. Enlace acortado legacy oficial
    if (host === 'goo.gl' && pathname.startsWith('/maps')) return true

    // 3. Subdominios maps.google.* (internacionales y locales)
    if (host === 'maps.google.com' || /^maps\.google\.[a-z]{2,}(\.[a-z]{2})?$/.test(host)) return true

    // 4. Dominios oficiales google.*/maps o google.*/local
    const isGoogleDomain = host === 'google.com' || host === 'www.google.com' ||
      /^(www\.)?google\.[a-z]{2,}(\.[a-z]{2})?$/.test(host)
    if (isGoogleDomain && (pathname.startsWith('/maps') || pathname.startsWith('/local'))) return true

    return false
  } catch {
    return false
  }
}

/**
 * Validador para URLs de imágenes.
 * Requiere protocolo HTTP/HTTPS y descarta esquemas inseguros (javascript:, data:, file:)
 */
function isValidImageUrl(val?: string | null): boolean {
  if (!val || val.trim() === '') return true
  try {
    const parsed = new URL(val.trim())
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// Esquema de validación Zod
const venueSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  address: z.string().optional(),
  google_maps_url: z.string().optional().refine(isValidGoogleMapsUrl, {
    message: 'Debe ser un enlace oficial de Google Maps (maps.app.goo.gl, maps.google.com o google.com/maps)'
  }),
  capacity: z.number({ invalid_type_error: 'La capacidad debe ser numérica' }).min(0, 'La capacidad no puede ser negativa'),
  tipo: z.enum([
    'estadio',
    'campo',
    'arena',
    'club',
    'sala',
    'estudio',
    'boliche',
    'bar',
    'sitio_publico',
    'edificio',
    'predio',
    'complejo'
  ] as const, { required_error: 'Seleccioná un tipo de recinto' }),
  image: z.string().optional().refine(isValidImageUrl, {
    message: 'Debe ser una URL válida con protocolo HTTP o HTTPS'
  })
})

type VenueForm = z.infer<typeof venueSchema>

// Estado del formulario
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedVenueId = ref<string | null>(null)
const submitting = ref(false)

const formState = reactive<VenueForm>({
  name: '',
  city: '',
  address: '',
  google_maps_url: '',
  capacity: 0,
  tipo: 'estadio',
  image: ''
})

// Modal de eliminación
const isDeleteModalOpen = ref(false)
const venueToDelete = ref<Venue | null>(null)
const deleting = ref(false)

// Búsqueda y filtrado reactivo
const searchQuery = ref('')
const selectedTypeFilter = ref<string>('all')

const filteredVenues = computed(() => {
  return venues.value.filter((v) => {
    // Filtro por tipo
    if (selectedTypeFilter.value !== 'all' && v.tipo !== selectedTypeFilter.value) {
      return false
    }
    // Filtro por texto predictivo
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) return true

    return (
      v.name.toLowerCase().includes(query) ||
      v.city.toLowerCase().includes(query) ||
      (v.address && v.address.toLowerCase().includes(query))
    )
  })
})

// Métricas y KPIs de Recintos
const totalVenues = computed(() => venues.value.length)

const totalCapacity = computed(() => {
  return venues.value.reduce((acc, v) => acc + (v.capacity || 0), 0)
})

const totalCities = computed(() => {
  const cities = new Set(venues.value.map(v => v.city.trim().toLowerCase()).filter(Boolean))
  return cities.size
})

const massiveVenues = computed(() => {
  return venues.value.filter(v =>
    v.capacity >= 15000 ||
    ['estadio', 'arena', 'predio', 'complejo', 'campo'].includes(v.tipo)
  ).length
})

// Helper visual para badges de tipo
function getVenueTypeBadge(tipo: VenueType) {
  switch (tipo) {
    case 'estadio':
      return { label: 'Estadio', class: 'bg-red-500/10 text-red-400 border-red-500/30', icon: 'i-heroicons-building-office-2' }
    case 'arena':
      return { label: 'Arena', class: 'bg-purple-500/10 text-purple-300 border-purple-500/30', icon: 'i-heroicons-sparkles' }
    case 'predio':
      return { label: 'Predio', class: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30', icon: 'i-heroicons-map' }
    case 'complejo':
      return { label: 'Complejo', class: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30', icon: 'i-heroicons-building-library' }
    case 'campo':
      return { label: 'Campo / Aire Libre', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', icon: 'i-heroicons-globe-americas' }
    case 'club':
      return { label: 'Club', class: 'bg-amber-500/10 text-amber-300 border-amber-500/30', icon: 'i-heroicons-user-group' }
    case 'sala':
      return { label: 'Sala / Teatro', class: 'bg-rose-500/10 text-rose-300 border-rose-500/30', icon: 'i-heroicons-ticket' }
    case 'boliche':
      return { label: 'Boliche', class: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30', icon: 'i-heroicons-musical-note' }
    default:
      return { label: tipo, class: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: 'i-heroicons-building-office' }
  }
}

// Generador de enlace a Google Maps
function getMapsLink(venue: Venue): string {
  if (venue.google_maps_url && venue.google_maps_url.trim() !== '') {
    return venue.google_maps_url
  }
  const query = encodeURIComponent(`${venue.name}, ${venue.city}, Argentina`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

function openCreateModal() {
  isEditing.value = false
  selectedVenueId.value = null
  formState.name = ''
  formState.city = ''
  formState.address = ''
  formState.google_maps_url = ''
  formState.capacity = 0
  formState.tipo = 'estadio'
  formState.image = ''
  isModalOpen.value = true
}

function openEditModal(venue: Venue) {
  isEditing.value = true
  selectedVenueId.value = venue.id
  formState.name = venue.name
  formState.city = venue.city
  formState.address = venue.address || ''
  formState.google_maps_url = venue.google_maps_url || ''
  formState.capacity = venue.capacity || 0
  formState.tipo = venue.tipo
  formState.image = venue.image || ''
  isModalOpen.value = true
}

function applyCapacityPreset(val: number) {
  formState.capacity = val
}

async function handleSaveVenue() {
  submitting.value = true
  try {
    const validated = venueSchema.parse(formState)
    const payload = {
      name: validated.name.trim(),
      city: validated.city.trim(),
      address: validated.address?.trim() || null,
      google_maps_url: validated.google_maps_url?.trim() || null,
      capacity: Number(validated.capacity) || 0,
      tipo: validated.tipo,
      image: validated.image?.trim() || null
    }

    if (isEditing.value && selectedVenueId.value) {
      const { error: err } = await updateVenue(selectedVenueId.value, payload)
      if (err) throw err
      toast.add({
        title: 'Recinto actualizado',
        description: `Los datos de "${payload.name}" fueron guardados con éxito.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      const { error: err } = await createVenue(payload)
      if (err) throw err
      toast.add({
        title: 'Recinto registrado',
        description: `"${payload.name}" fue incorporado al catálogo oficial.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
    isModalOpen.value = false
  } catch (err: any) {
    toast.add({
      title: 'Error al procesar el recinto',
      description: err?.message || 'Ocurrió un error inesperado al conectar con Supabase',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submitting.value = false
  }
}

function openDeleteModal(venue: Venue) {
  venueToDelete.value = venue
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!venueToDelete.value) return
  deleting.value = true
  try {
    const { error: err } = await deleteVenue(venueToDelete.value.id)
    if (err) throw err
    toast.add({
      title: 'Recinto eliminado',
      description: `El recinto "${venueToDelete.value.name}" fue retirado del catálogo.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    isDeleteModalOpen.value = false
    venueToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'No se pudo eliminar el recinto',
      description: err?.message || 'Verificá si existen eventos o viajes asignados a este recinto.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchVenues()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado Operativo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Maestro de Recintos
          </h1>
          <span class="px-2 py-0.5 text-xs font-semibold rounded bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/20">
            Sprint 2 • US-04
          </span>
          <span
            v-if="isCacheValid"
            class="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            title="Caché reactiva ADR-05 activa (TTL 30 min)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Caché 30m activa
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Directorio de estadios, arenas, predios, teatros y complejos para eventos masivos y traslados.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          size="md"
          variant="subtle"
          color="neutral"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          title="Sincronizar con base de datos (forzar refresco de red)"
          @click="fetchVenues({ force: true })"
        />
        <UButton
          size="md"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-lg shadow-[#E53924]/20"
          icon="i-heroicons-plus"
          @click="openCreateModal"
        >
          Registrar Recinto
        </UButton>
      </div>
    </div>

    <!-- Barra de Métricas & KPIs de Aforo y Sedes -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Recintos</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalVenues }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-building-office-2" class="w-5 h-5 text-[#E53924]" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Aforo Global</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">
              {{ totalCapacity.toLocaleString('es-AR') }}
              <span class="text-xs font-normal text-zinc-400">pax</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Ciudades Sedes</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalCities }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Gran Escala</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">
              {{ massiveVenues }}
              <span class="text-xs font-normal text-zinc-400">sedes</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Barra de Filtros y Búsqueda Predictiva -->
    <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div class="flex-1 max-w-md">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por nombre de recinto, ciudad o dirección..."
          class="w-full"
        />
      </div>

      <!-- Selector Rápido de Categoría / Tipo -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <button
          type="button"
          class="px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer whitespace-nowrap"
          :class="selectedTypeFilter === 'all'
            ? 'bg-[#E53924] border-[#E53924] text-white font-semibold shadow-sm shadow-[#E53924]/30'
            : 'bg-[#14141A] border-[#2A2A38] text-zinc-300 hover:border-zinc-500'"
          @click="selectedTypeFilter = 'all'"
        >
          Todos ({{ venues.length }})
        </button>
        <button
          v-for="opt in venueTypeOptions.slice(0, 6)"
          :key="opt.value"
          type="button"
          class="px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          :class="selectedTypeFilter === opt.value
            ? 'bg-[#E53924] border-[#E53924] text-white font-semibold shadow-sm shadow-[#E53924]/30'
            : 'bg-[#14141A] border-[#2A2A38] text-zinc-300 hover:border-zinc-500'"
          @click="selectedTypeFilter = opt.value"
        >
          <UIcon :name="opt.icon" class="w-3.5 h-3.5" />
          <span>{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- Estado de Error de Red -->
    <UAlert
      v-if="error"
      title="Error al conectar con la base de datos de recintos"
      :description="error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
    >
      <template #actions>
        <UButton size="xs" variant="solid" color="error" @click="fetchVenues({ force: true })">
          Reintentar Carga
        </UButton>
      </template>
    </UAlert>

    <!-- Estado de Carga Inicial -->
    <div v-if="loading && venues.length === 0" class="py-16 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando catálogo oficial de recintos...</p>
    </div>

    <!-- Estado Vacío -->
    <UCard
      v-else-if="!loading && venues.length === 0"
      class="bg-[#1A1A22] border-[#2A2A38] text-center py-16"
    >
      <div class="max-w-md mx-auto space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
          <UIcon name="i-heroicons-building-office-2" class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-[#F5EEDC]">No hay recintos registrados todavía</h3>
        <p class="text-xs text-zinc-400">
          Registrá los estadios, salas, arenas o predios donde se realizan los conciertos para asociarlos a los viajes.
        </p>
        <div class="pt-2">
          <UButton
            size="sm"
            class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            Registrar Primer Recinto
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Tabla Catálogo de Recintos -->
    <UCard
      v-else
      class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[#2A2A38] text-left text-sm">
          <thead class="bg-[#14141A] text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-6 py-3.5">Recinto / Estadio</th>
              <th scope="col" class="px-6 py-3.5">Tipo</th>
              <th scope="col" class="px-6 py-3.5">Ciudad / Ubicación</th>
              <th scope="col" class="px-6 py-3.5">Capacidad Oficial</th>
              <th scope="col" class="px-6 py-3.5">Geolocalización</th>
              <th scope="col" class="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr
              v-for="venue in filteredVenues"
              :key="venue.id"
              class="hover:bg-[#20202B] transition-colors"
            >
              <!-- Nombre e Imagen / Fallback -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="relative w-11 h-11 rounded-lg overflow-hidden border border-[#2A2A38] bg-[#0F0F12] shrink-0 flex items-center justify-center">
                    <img
                      v-if="venue.image"
                      :src="venue.image"
                      :alt="venue.name"
                      class="w-full h-full object-cover"
                      loading="lazy"
                      @error="(e: any) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden') }"
                    />
                    <div
                      class="flex items-center justify-center w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400"
                      :class="{ 'hidden': venue.image }"
                    >
                      <UIcon :name="getVenueTypeBadge(venue.tipo).icon" class="w-5 h-5 text-zinc-400" />
                    </div>
                  </div>
                  <div>
                    <p class="font-bold text-[#F5EEDC] text-sm">
                      {{ venue.name }}
                    </p>
                    <p v-if="venue.address" class="text-xs text-zinc-400 truncate max-w-[220px]" :title="venue.address">
                      {{ venue.address }}
                    </p>
                    <p v-else class="text-xs text-zinc-500 italic">
                      Sin dirección exacta
                    </p>
                  </div>
                </div>
              </td>

              <!-- Tipo / Badge -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
                  :class="getVenueTypeBadge(venue.tipo).class"
                >
                  <UIcon :name="getVenueTypeBadge(venue.tipo).icon" class="w-3.5 h-3.5" />
                  {{ getVenueTypeBadge(venue.tipo).label }}
                </span>
              </td>

              <!-- Ciudad -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5 text-zinc-200">
                  <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-[#E53924]" />
                  <span class="font-medium text-xs">{{ venue.city }}</span>
                </div>
              </td>

              <!-- Capacidad Oficial -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span
                    class="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                    :class="venue.capacity >= 30000
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700/60'"
                  >
                    {{ (venue.capacity || 0).toLocaleString('es-AR') }} pax
                  </span>
                </div>
              </td>

              <!-- Geolocalización / Google Maps -->
              <td class="px-6 py-4 whitespace-nowrap">
                <a
                  :href="getMapsLink(venue)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors"
                  :class="venue.google_maps_url
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50'
                    : 'bg-zinc-800/70 text-zinc-400 border border-zinc-700/60 hover:text-zinc-200'"
                  :title="venue.google_maps_url ? 'Abrir enlace exacto de Google Maps' : 'Buscar dirección en Google Maps'"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                  <span>{{ venue.google_maps_url ? 'Ver en Maps' : 'Buscar en Maps' }}</span>
                </a>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <UButton
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  icon="i-heroicons-pencil-square"
                  class="cursor-pointer"
                  title="Editar recinto"
                  @click="openEditModal(venue)"
                />
                <UButton
                  size="xs"
                  variant="subtle"
                  color="error"
                  icon="i-heroicons-trash"
                  class="cursor-pointer"
                  title="Eliminar recinto"
                  @click="openDeleteModal(venue)"
                />
              </td>
            </tr>

            <tr v-if="filteredVenues.length === 0 && (searchQuery || selectedTypeFilter !== 'all')">
              <td colspan="6" class="px-6 py-8 text-center text-xs text-zinc-500">
                No se encontraron recintos que coincidan con los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal de Creación / Edición de Recinto -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEditing ? 'Editar Recinto' : 'Registrar Nuevo Recinto'"
      :description="isEditing ? 'Modificá las especificaciones y capacidad de la sede.' : 'Ingresá los datos del nuevo estadio, sala o predio para eventos de Tripu.'"
    >
      <template #body>
        <UForm
          :schema="venueSchema"
          :state="formState"
          class="space-y-4 pt-2"
          @submit="handleSaveVenue"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Nombre del Recinto" name="name" required help="Ej. Estadio Más Monumental">
              <UInput
                v-model="formState.name"
                placeholder="Ej. Estadio River Plate"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Ciudad / Localidad" name="city" required help="Ej. Buenos Aires">
              <UInput
                v-model="formState.city"
                placeholder="Ej. Buenos Aires"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Tipo de Recinto" name="tipo" required help="Categoría física del establecimiento">
              <select
                v-model="formState.tipo"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]"
              >
                <option v-for="opt in venueTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Dirección Física" name="address" help="Calle y numeración exacta">
              <UInput
                v-model="formState.address"
                placeholder="Ej. Av. Figueroa Alcorta 7597"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Presets y Capacidad -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-zinc-400 font-medium">Aforos habituales:</span>
              <span class="text-[11px] text-zinc-500">Hacé click para autocompletar</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="preset in capacityPresets"
                :key="preset.value"
                type="button"
                class="px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer"
                :class="formState.capacity === preset.value
                  ? 'bg-[#E53924] border-[#E53924] text-white font-semibold shadow-sm shadow-[#E53924]/30'
                  : 'bg-[#14141A] border-[#2A2A38] text-zinc-300 hover:border-zinc-500'"
                @click="applyCapacityPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Capacidad Oficial (Pax)" name="capacity" required help="Aforo total habilitado">
              <UInput
                v-model.number="formState.capacity"
                type="number"
                min="0"
                step="100"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Enlace de Google Maps" name="google_maps_url" help="URL oficial de Google Maps (maps.app.goo.gl, maps.google.com o google.com/maps)">
              <UInput
                v-model="formState.google_maps_url"
                placeholder="https://maps.app.goo.gl/..."
                icon="i-heroicons-map-pin"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="URL de Imagen de Portada" name="image" help="Enlace HTTPS directo a una fotografía o render del recinto">
            <UInput
              v-model="formState.image"
              placeholder="https://ejemplo.com/imagenes/estadio.jpg"
              icon="i-heroicons-photo"
              class="w-full"
            />
          </UFormField>

          <!-- Previsualización de imagen si existe -->
          <div v-if="formState.image" class="pt-1">
            <span class="text-xs text-zinc-400 block mb-1">Previsualización:</span>
            <div class="w-full h-32 rounded-lg border border-[#2A2A38] bg-[#0F0F12] overflow-hidden flex items-center justify-center">
              <img
                :src="formState.image"
                alt="Vista previa"
                class="w-full h-full object-cover"
                @error="(e: any) => e.target.classList.add('hidden')"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
            <UButton
              variant="ghost"
              color="neutral"
              class="cursor-pointer"
              @click="isModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-lg shadow-[#E53924]/20"
              :loading="submitting"
            >
              {{ isEditing ? 'Guardar Cambios' : 'Registrar Recinto' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Modal de Confirmación de Baja / Eliminación -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Eliminar Recinto"
      description="Esta acción eliminará el recinto del catálogo oficial de Tripu."
    >
      <template #body>
        <div class="space-y-4 pt-1">
          <div class="p-3.5 rounded-lg bg-red-950/30 border border-red-900/50 text-xs text-red-300 space-y-2">
            <div class="flex items-center gap-2 font-bold text-red-200">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-[#E53924] shrink-0" />
              <span>Advertencia de Integridad Referencial</span>
            </div>
            <p>
              Estás a punto de dar de baja: <strong class="text-white">{{ venueToDelete?.name }}</strong> ({{ venueToDelete?.city }}).
            </p>
            <p class="text-red-400">
              Si existen viajes o eventos programados vinculados a este recinto, la base de datos podría restringir la baja física o desvincular la sede.
            </p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              class="cursor-pointer"
              @click="isDeleteModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              variant="solid"
              color="error"
              class="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
              icon="i-heroicons-trash"
              :loading="deleting"
              @click="handleConfirmDelete"
            >
              Confirmar Eliminación
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
