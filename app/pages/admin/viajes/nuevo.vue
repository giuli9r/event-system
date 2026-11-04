<script setup lang="ts">
import {
  useEvents,
  eventFormSchema,
  generateSlug,
  type PackageTierFormInput,
  type EventStatus
} from '~/composables/useEvents'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const toast = useToast()
const router = useRouter()

const { createEventWithTiers, loading: submitting } = useEvents()
const { venues, fetchVenues } = useVenues()
const { transports, fetchTransports } = useTransports()

// Estado del formulario
const formState = reactive({
  title: '',
  slug: '',
  artist_headliner: '',
  venue_id: null as string | null,
  transport_id: null as string | null,
  coordinator_id: null as string | null,
  event_date: '',
  departure_time: '',
  departure_location: 'Terminal - San Francisco',
  return_policy: 'Regreso 60 minutos finalizado el show',
  includes_summary: 'Traslado ida y vuelta en unidad habilitada CNRT, coordinación en viaje, bebidas a bordo y seguro de pasajero.',
  full_itinerary: '',
  image_url: '',
  status: 'published' as EventStatus,
  is_featured: false,
  tiers: [
    {
      name: 'Solo Traslado (Ida y Vuelta)',
      price: 45000,
      includes_ticket: false,
      early_bird: false,
      currency: 'ARS',
      payment_methods: 'efectivo, transferencia, cuotas, tarjeta',
      is_available: true
    }
  ] as PackageTierFormInput[]
})

// Control de modificación manual de slug
const isSlugManual = ref(false)

// Recinto y transporte seleccionados en memoria
const selectedVenue = computed(() => {
  return venues.value.find(v => v.id === formState.venue_id) || null
})

const selectedTransport = computed(() => {
  return transports.value.find(t => t.id === formState.transport_id) || null
})

// Generador reactivo de slug y título sugerido
watch(
  [() => formState.artist_headliner, () => formState.venue_id, () => formState.event_date],
  ([artist, venueId, date]) => {
    const venueName = selectedVenue.value?.name || ''

    // Auto-generación de slug si el operador no lo escribió manualmente
    if (!isSlugManual.value && (artist || venueName || date)) {
      formState.slug = generateSlug(artist, venueName, date)
    }

    // Auto-generación de título sugerido si está vacío
    if (!formState.title && artist) {
      formState.title = venueName ? `Viaje a ${artist} en ${venueName}` : `Viaje a ${artist}`
    }
  }
)

function onSlugInput() {
  isSlugManual.value = true
}

function resetAutoSlug() {
  isSlugManual.value = false
  const venueName = selectedVenue.value?.name || ''
  formState.slug = generateSlug(formState.artist_headliner, venueName, formState.event_date)
}

// Detección reactiva de conflicto de slug duplicado (PostgreSQL 23505)
const slugConflict = ref<{
  slug: string
  existingTitle: string
  existingId?: string
  searchQuery: string
} | null>(null)

watch(() => formState.slug, (newSlug) => {
  if (slugConflict.value && newSlug.trim() !== slugConflict.value.slug) {
    slugConflict.value = null
  }
})

function differentiateSlug() {
  isSlugManual.value = true;
  const current = formState.slug.trim();
  formState.slug = `${current}-2`;

  // const matchNum = current.match(/-(\d+)$/)
  // if (matchNum) {
  //   const nextNum = parseInt(matchNum[1], 10) + 1
  //   formState.slug = current.replace(/-(\d+)$/, `-${nextNum}`)
  // } else {
  //   formState.slug = `${current}-2`
  // }
  slugConflict.value = null
  toast.add({
    title: 'Enlace diferenciado',
    description: `Nuevo slug generado: "/viajes/${formState.slug}". Ya podés publicar la salida.`,
    color: 'info',
    icon: 'i-heroicons-sparkles'
  })
}

// Gestión del Repeater de Tarifas
function addTier() {
  formState.tiers.push({
    name: 'Traslado + Entrada',
    price: 95000,
    includes_ticket: true,
    early_bird: false,
    currency: 'ARS',
    payment_methods: 'efectivo, transferencia, cuotas, tarjeta',
    is_available: true
  })
}

function removeTier(index: number) {
  if (formState.tiers.length <= 1) {
    toast.add({
      title: 'Tarifa requerida',
      description: 'El viaje debe tener al menos una opción de paquete o precio.',
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }
  formState.tiers.splice(index, 1)
}

function duplicateTier(index: number) {
  const original = formState.tiers[index]
  if (!original) return
  formState.tiers.push({
    ...original,
    name: `${original.name} (Copia)`
  })
}

// Envío del Formulario
async function handleSubmit() {
  try {
    // 1. Validación estricta con Zod
    const validated = eventFormSchema.parse(formState)

    // Formatear fechas a ISO para timestamptz de PostgreSQL
    const eventDateIso = new Date(validated.event_date).toISOString()
    const departureIso = new Date(validated.departure_time).toISOString()

    const eventPayload = {
      title: validated.title.trim(),
      slug: validated.slug.trim(),
      artist_headliner: validated.artist_headliner.trim(),
      venue_id: validated.venue_id,
      transport_id: validated.transport_id,
      coordinator_id: validated.coordinator_id || null,
      event_date: eventDateIso,
      departure_time: departureIso,
      departure_location: validated.departure_location.trim(),
      return_policy: validated.return_policy?.trim() || null,
      includes_summary: validated.includes_summary?.trim() || null,
      full_itinerary: validated.full_itinerary?.trim() || null,
      image_url: validated.image_url?.trim() || null,
      status: validated.status,
      is_featured: validated.is_featured
    }

    const tiersPayload = validated.tiers.map(t => ({
      name: t.name.trim(),
      price: Number(t.price) || 0,
      includes_ticket: Boolean(t.includes_ticket),
      early_bird: Boolean(t.early_bird),
      currency: t.currency || 'ARS',
      payment_methods: t.payment_methods || 'efectivo, transferencia, cuotas, tarjeta',
      is_available: Boolean(t.is_available)
    }))

    const { data, error: err } = await createEventWithTiers(eventPayload, tiersPayload)
    if (err) throw err

    toast.add({
      title: '¡Viaje publicado!',
      description: `La salida para "${data?.title}" quedó registrada con ${tiersPayload.length} tarifas asociadas.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    await router.push('/admin/viajes')
  } catch (err: any) {
    console.error('Error al guardar viaje:', err)

    // Detección y tratamiento amigable para conflicto de slug duplicado (PostgreSQL 23505)
    if (err?.code === '23505' || err?.isSlugDuplicate || err?.message?.includes('events_slug_key')) {
      const conflictingSlug = formState.slug.trim()
      const existingTitle = err?.existingTitle || formState.title || 'Viaje previamente registrado'
      const existingId = err?.existingId
      const searchQuery = err?.searchQuery || existingTitle

      slugConflict.value = {
        slug: conflictingSlug,
        existingTitle,
        existingId,
        searchQuery
      }

      toast.add({
        title: 'El viaje ya fue creado previamente',
        description: `Existe una salida con este mismo enlace. Nombre en catálogo: "${existingTitle}". Podés buscarlo con el filtro o diferenciar el enlace.`,
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle'
      })

      if (import.meta.client) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    let errorMessage = err?.message || 'Ocurrió un error al registrar el viaje'

    // Tratamiento amigable para errores de validación de Zod
    if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      errorMessage = err.errors[0].message
    }

    toast.add({
      title: 'Error de validación',
      description: errorMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }
}

onMounted(() => {
  // Pre-cargar datos maestros en memoria (ADR-05 resolverá en 0 ms si ya están en caché)
  Promise.all([
    fetchVenues(),
    fetchTransports()
  ])
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-16">
    <!-- Encabezado con Retorno -->
    <div class="pb-4 border-b border-[#2A2A38]">
      <NuxtLink to="/admin/viajes"
        class="text-xs text-zinc-400 hover:text-[#E53924] inline-flex items-center gap-1.5 mb-2 transition-colors cursor-pointer">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        <span>Volver a salidas programadas</span>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
          Publicar Nuevo Viaje
        </h1>
        <span
          class="px-2 py-0.5 text-xs font-semibold rounded bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/20">
          Asistente de Salida
        </span>
      </div>
      <p class="text-xs text-zinc-400 mt-1">
        Completá los datos del espectáculo, vinculá el recinto y la unidad de transporte, y configurá las opciones de
        tarifas.
      </p>
    </div>

    <!-- Alerta amigable de Viaje Duplicado / Slug en uso (PostgreSQL 23505) -->
    <UAlert v-if="slugConflict" title="¡Este viaje ya fue creado previamente!" color="warning" variant="subtle"
      icon="i-heroicons-exclamation-triangle"
      :close-button="{ icon: 'i-heroicons-x-mark', color: 'neutral', variant: 'link' }" @close="slugConflict = null">
      <template #description>
        <div class="space-y-2 text-xs text-zinc-300">
          <p>
            Ya existe una salida registrada con el enlace permanente:
            <code class="font-mono text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50">
              /viajes/{{ slugConflict.slug }}
            </code>.
          </p>
          <div
            class="p-3 rounded-lg bg-[#14141A] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="text-[11px] uppercase tracking-wider text-amber-400 font-bold block">
                Nombre para buscar por filtro en salidas:
              </span>
              <p class="text-sm font-bold text-white">
                "{{ slugConflict.existingTitle }}"
              </p>
            </div>
            <UButton :to="`/admin/viajes?q=${encodeURIComponent(slugConflict.searchQuery)}`" size="xs" color="warning"
              variant="solid" icon="i-heroicons-magnifying-glass" class="font-bold shrink-0 cursor-pointer">
              Buscar por filtro en salidas
            </UButton>
          </div>
          <p class="text-zinc-400">
            Si estás organizando un segundo micro u otro horario para la misma fecha, hacé clic en <strong>"Diferenciar
              enlace de este viaje"</strong> o modificá el slug manualmente abajo para poder publicar.
          </p>
        </div>
      </template>
      <template #actions>
        <div class="flex items-center gap-2 flex-wrap mt-2">
          <UButton :to="`/admin/viajes?q=${encodeURIComponent(slugConflict.searchQuery)}`" size="xs" color="warning"
            variant="solid" icon="i-heroicons-magnifying-glass" class="font-bold cursor-pointer">
            Buscar en salidas programadas
          </UButton>
          <UButton v-if="slugConflict.existingId" :to="`/admin/viajes/${slugConflict.existingId}/editar`" size="xs"
            color="neutral" variant="outline" icon="i-heroicons-pencil-square" class="cursor-pointer">
            Editar viaje existente
          </UButton>
          <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-sparkles" class="cursor-pointer"
            @click="differentiateSlug">
            Diferenciar enlace de este viaje
          </UButton>
        </div>
      </template>
    </UAlert>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- BLOQUE 1: Datos del Show y Espectáculo -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-lg bg-red-950/60 border border-red-900/60 flex items-center justify-center text-[#E53924]">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-[#F5EEDC]">Paso 1: Espectáculo y Recinto</h2>
              <p class="text-[11px] text-zinc-400">Información del artista, locación y fechas del evento.</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Artista / Banda Principal" name="artist_headliner" required
              help="Ej. Los Piojos, Coldplay, Wos">
              <UInput v-model="formState.artist_headliner" placeholder="Ej. Los Piojos" class="w-full" />
            </UFormField>

            <UFormField label="Título Comercial del Viaje" name="title" required help="Nombre que verán los pasajeros">
              <UInput v-model="formState.title" placeholder="Ej. Viaje a Los Piojos en River Plate" class="w-full" />
            </UFormField>
          </div>

          <!-- Recinto y Fecha del Show -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Recinto / Estadio Destino" name="venue_id" required help="Seleccioná la sede homologada">
              <select v-model="formState.venue_id"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]">
                <option :value="null">-- Seleccionar recinto --</option>
                <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                  {{ venue.name }} ({{ venue.city }}) - {{ venue.tipo }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Fecha y Hora del Show" name="event_date" required help="Horario anunciado del recital">
              <UInput v-model="formState.event_date" type="datetime-local" class="w-full" />
            </UFormField>
          </div>

          <!-- Slug Canónico -->
          <UFormField label="Identificador de URL (Slug)" name="slug" required
            help="Ruta única en la web (ej. /viajes/los-piojos-river-plate-2026-10-15)">
            <div class="flex items-center gap-2">
              <div class="flex-1 flex items-center rounded-md bg-[#14141A] border px-3 py-1.5 text-xs transition-colors"
                :class="slugConflict && slugConflict.slug === formState.slug ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-[#2A2A38]'">
                <span class="text-zinc-500 font-mono select-none">/viajes/</span>
                <input v-model="formState.slug" type="text"
                  class="bg-transparent font-mono w-full focus:outline-none ml-1"
                  :class="slugConflict && slugConflict.slug === formState.slug ? 'text-amber-400 font-bold' : 'text-emerald-400'"
                  placeholder="artista-recinto-fecha" @input="onSlugInput" />
              </div>
              <UButton size="xs" variant="subtle" color="neutral" icon="i-heroicons-arrow-path"
                title="Regenerar automáticamente" @click="resetAutoSlug">
                Auto
              </UButton>
            </div>
            <!-- Feedback inline de slug duplicado -->
            <div v-if="slugConflict && slugConflict.slug === formState.slug"
              class="mt-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300 space-y-1">
              <div class="flex items-center gap-1.5 font-bold">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-400 shrink-0" />
                <span>Este enlace ya está en uso por: "{{ slugConflict.existingTitle }}".</span>
              </div>
              <p class="text-[11px] text-zinc-400">
                Podés buscar por filtro: <strong>"{{ slugConflict.searchQuery }}"</strong> o hacer clic en "Diferenciar
                enlace".
              </p>
              <div class="pt-1 flex items-center gap-3">
                <NuxtLink :to="`/admin/viajes?q=${encodeURIComponent(slugConflict.searchQuery)}`"
                  class="text-amber-400 hover:text-white underline font-bold inline-flex items-center gap-1 cursor-pointer">
                  <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5" />
                  Buscar por filtro en el catálogo
                </NuxtLink>
                <button type="button" class="text-zinc-300 hover:text-white underline cursor-pointer"
                  @click="differentiateSlug">
                  Diferenciar enlace
                </button>
              </div>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- BLOQUE 2: Logística, Flota y Punto de Encuentro -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <UIcon name="i-heroicons-truck" class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-[#F5EEDC]">Paso 2: Logística y Transporte Asignado</h2>
              <p class="text-[11px] text-zinc-400">Unidad de la flota, punto de salida y horario de citación.</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Vehículo Asignado" name="transport_id" required help="Unidad de traslado de la flota">
              <select v-model="formState.transport_id"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]">
                <option :value="null">-- Seleccionar vehículo --</option>
                <option v-for="t in transports" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.capacity }} pax) - {{ t.origin }} {{ t.driver ? `[Chofer: ${t.driver.lastname}]` :
                    '' }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Fecha y Hora de Salida (Citación)" name="departure_time" required
              help="Horario de partida del micro/combi">
              <UInput v-model="formState.departure_time" type="datetime-local" class="w-full" />
            </UFormField>
          </div>

          <!-- Preview de unidad seleccionada -->
          <div v-if="selectedTransport"
            class="p-3 rounded-lg bg-[#14141A] border border-[#2A2A38] flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded bg-blue-950/80 border border-blue-900 flex items-center justify-center text-blue-300 font-bold">
                {{ selectedTransport.capacity }}
              </div>
              <div>
                <p class="font-bold text-[#F5EEDC]">{{ selectedTransport.name }} ({{ selectedTransport.vehicle_type }})
                </p>
                <p class="text-zinc-400">Salida desde: {{ selectedTransport.origin }} • Patente: {{
                  selectedTransport.license_plate || 'Sin patente' }}</p>
              </div>
            </div>
            <div class="text-right">
              <span
                class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {{ selectedTransport.capacity }} plazas disponibles
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Punto de Encuentro" name="departure_location" required
              help="Lugar físico de partida del contingente">
              <UInput v-model="formState.departure_location" placeholder="Terminal - San Francisco"
                icon="i-heroicons-map-pin" class="w-full" />
            </UFormField>

            <UFormField label="Política de Regreso" name="return_policy" help="Condiciones de desconcentración">
              <UInput v-model="formState.return_policy" placeholder="Regreso 60 minutos finalizado el show"
                class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Servicios y Beneficios Incluidos" name="includes_summary"
            help="Resumen para la tarjeta pública">
            <UTextarea v-model="formState.includes_summary" rows="2"
              placeholder="Traslado ida y vuelta, coordinación en viaje, seguro y bebidas..." class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- BLOQUE 3: Gestor Dinámico de Paquetes y Tarifas (Repeater) -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-[#F5EEDC]">Paso 3: Paquetes y Opciones de Precios</h2>
                <p class="text-[11px] text-zinc-400">Configurá las variantes disponibles para los pasajeros.</p>
              </div>
            </div>
            <UButton size="xs" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              icon="i-heroicons-plus" @click="addTier">
              Agregar Paquete
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-for="(tier, idx) in formState.tiers" :key="idx"
            class="p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-3 relative group">
            <div class="flex items-center justify-between pb-2 border-b border-[#2A2A38]">
              <div class="flex items-center gap-2">
                <span
                  class="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <span class="text-xs font-semibold text-[#F5EEDC]">Opción de Viaje</span>
              </div>
              <div class="flex items-center gap-1">
                <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-document-duplicate"
                  title="Duplicar este paquete" @click="duplicateTier(idx)" />
                <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash" title="Eliminar este paquete"
                  :disabled="formState.tiers.length <= 1" @click="removeTier(idx)" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Nombre del Paquete" required help="Ej. Solo Traslado, Traslado + Campo">
                <UInput v-model="tier.name" placeholder="Ej. Solo Traslado (Ida y Vuelta)" class="w-full" />
              </UFormField>

              <UFormField label="Precio Final (ARS)" required help="Valor total por pasajero">
                <UInput v-model.number="tier.price" type="number" min="0" step="500" icon="i-heroicons-currency-dollar"
                  class="w-full font-mono font-bold" />
              </UFormField>
            </div>

            <div class="flex flex-wrap items-center gap-6 pt-1 text-xs">
              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-300">
                <input v-model="tier.includes_ticket" type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-[#E53924] focus:ring-0 w-4 h-4" />
                <span>¿Incluye Entrada al Show?</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-300">
                <input v-model="tier.early_bird" type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-amber-500 focus:ring-0 w-4 h-4" />
                <span>Tarifa Preventa (Early Bird)</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-300">
                <input v-model="tier.is_available" type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-emerald-500 focus:ring-0 w-4 h-4" />
                <span>Habilitado para reserva</span>
              </label>
            </div>
          </div>
        </div>
      </UCard>

      <!-- BLOQUE 4: Multimedia y Publicación -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-900/60 flex items-center justify-center text-purple-400">
              <UIcon name="i-heroicons-photo" class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-[#F5EEDC]">Paso 4: Flyer Promocional y Estado</h2>
              <p class="text-[11px] text-zinc-400">Imagen de portada para la web y visibilidad de la salida.</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="URL del Flyer / Afiche Oficial" name="image_url"
              help="Enlace web directo HTTPS a la imagen">
              <UInput v-model="formState.image_url" placeholder="https://ejemplo.com/flyer-recital.jpg"
                icon="i-heroicons-photo" class="w-full" />
            </UFormField>

            <UFormField label="Estado Inicial de la Salida" name="status" help="Visibilidad para los pasajeros">
              <select v-model="formState.status"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]">
                <option value="published">Publicado (Visible en web pública)</option>
                <option value="draft">Borrador (Solo visible en admin)</option>
                <option value="sold_out">Sold Out (Cupos agotados)</option>
                <option value="rescheduled">Reprogramado (Fecha diferida)</option>
                <option value="canceled">Cancelado (Salida cancelada)</option>
                <option value="completed">Finalizado (Show concluido)</option>
              </select>
            </UFormField>
          </div>

          <!-- Previsualización del Flyer -->
          <div v-if="formState.image_url" class="p-3 rounded-lg bg-[#14141A] border border-[#2A2A38]">
            <span class="text-xs text-zinc-400 block mb-2">Vista previa del afiche:</span>
            <div class="max-w-xs h-48 rounded-lg overflow-hidden border border-[#2A2A38] bg-[#0F0F12]">
              <img :src="formState.image_url" alt="Vista previa del afiche" class="w-full h-full object-cover"
                @error="(e: any) => e.target.classList.add('hidden')" />
            </div>
          </div>

          <div class="pt-2">
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input v-model="formState.is_featured" type="checkbox"
                class="rounded bg-[#0F0F12] border-[#2A2A38] text-amber-500 focus:ring-0 w-4 h-4" />
              <span class="font-semibold text-[#F5EEDC]">Destacar este viaje en la portada principal</span>
              <span class="text-zinc-100">Aparecerá en el banner principal superior</span>
            </label>
          </div>
        </div>
      </UCard>

      <!-- Botones de Acción -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
        <UButton to="/admin/viajes" variant="ghost" color="neutral" class="cursor-pointer">
          Cancelar
        </UButton>
        <UButton type="submit"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-bold px-6 py-2.5 cursor-pointer shadow-xl shadow-[#E53924]/20"
          :loading="submitting">
          Publicar Viaje Definitivo
        </UButton>
      </div>
    </form>
  </div>
</template>
