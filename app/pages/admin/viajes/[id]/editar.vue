<script setup lang="ts">
import {
  useEvents,
  eventFormSchema,
  generateSlug,
  type PackageTierFormInput,
  type EventStatus,
  type EventWithRelations
} from '~/composables/useEvents'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const eventId = computed(() => route.params.id as string)

const {
  fetchEventById,
  updateEventWithTiers,
  loading: composableLoading
} = useEvents()

const { venues, fetchVenues } = useVenues()
const { transports, fetchTransports } = useTransports()

const pageLoading = ref(true)
const submitting = ref(false)
const loadedEvent = ref<EventWithRelations | null>(null)
const notFound = ref(false)

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
  includes_summary: '',
  full_itinerary: '',
  image_url: '',
  status: 'published' as EventStatus,
  is_featured: false,
  tiers: [] as PackageTierFormInput[]
})

// Control de modificación manual de slug
const isSlugManual = ref(true)

// Helper para convertir ISO timestamptz a formato input datetime-local (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoStr: string | null | undefined): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

// Recinto y transporte seleccionados en memoria
const selectedVenue = computed(() => {
  return venues.value.find(v => v.id === formState.venue_id) || null
})

const selectedTransport = computed(() => {
  return transports.value.find(t => t.id === formState.transport_id) || null
})

function onSlugInput() {
  isSlugManual.value = true
}

function resetAutoSlug() {
  isSlugManual.value = false
  const venueName = selectedVenue.value?.name || ''
  formState.slug = generateSlug(formState.artist_headliner, venueName, formState.event_date)
}

// Gestión del Repeater de Tarifas
function addTier() {
  formState.tiers.push({
    name: 'Opción de Viaje',
    price: 50000,
    includes_ticket: false,
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
    id: undefined, // Nueva copia sin ID para que se inserte como nuevo tier
    name: `${original.name} (Copia)`
  })
}

// Carga e hidratación reactiva del viaje
async function loadData() {
  pageLoading.value = true
  notFound.value = false

  try {
    // 1. Cargar catálogos maestros si no están cargados (ADR-05 resuelve en 0ms si hay caché)
    await Promise.all([
      fetchVenues(),
      fetchTransports()
    ])

    // 2. Recuperar el viaje por ID
    const { data: ev, error: err } = await fetchEventById(eventId.value)
    if (err || !ev) {
      notFound.value = true
      return
    }

    loadedEvent.value = ev

    // 3. Hidratar el formulario
    formState.title = ev.title
    formState.slug = ev.slug
    formState.artist_headliner = ev.artist_headliner
    formState.venue_id = ev.venue_id
    formState.transport_id = ev.transport_id
    formState.coordinator_id = ev.coordinator_id
    formState.event_date = toDatetimeLocal(ev.event_date)
    formState.departure_time = toDatetimeLocal(ev.departure_time)
    formState.departure_location = ev.departure_location || 'Terminal - San Francisco'
    formState.return_policy = ev.return_policy || 'Regreso 60 minutos finalizado el show'
    formState.includes_summary = ev.includes_summary || ''
    formState.full_itinerary = ev.full_itinerary || ''
    formState.image_url = ev.image_url || ''
    formState.status = ev.status
    formState.is_featured = Boolean(ev.is_featured)

    // Hidratar tarifas existentes
    if (ev.package_tiers && ev.package_tiers.length > 0) {
      formState.tiers = ev.package_tiers.map(t => ({
        id: t.id,
        name: t.name,
        price: Number(t.price) || 0,
        includes_ticket: Boolean(t.includes_ticket),
        early_bird: Boolean(t.early_bird),
        currency: t.currency || 'ARS',
        payment_methods: t.payment_methods || 'efectivo, transferencia, cuotas, tarjeta',
        is_available: Boolean(t.is_available)
      }))
    } else {
      formState.tiers = [
        {
          name: 'Solo Traslado (Ida y Vuelta)',
          price: 45000,
          includes_ticket: false,
          early_bird: false,
          currency: 'ARS',
          payment_methods: 'efectivo, transferencia, cuotas, tarjeta',
          is_available: true
        }
      ]
    }
  } catch (err: any) {
    console.error('Error cargando viaje para editar:', err)
    notFound.value = true
  } finally {
    pageLoading.value = false
  }
}

// Envío del Formulario de Edición
async function handleSubmit() {
  submitting.value = true

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

    const tiersPayload: PackageTierFormInput[] = validated.tiers.map(t => ({
      id: t.id,
      name: t.name.trim(),
      price: Number(t.price) || 0,
      includes_ticket: Boolean(t.includes_ticket),
      early_bird: Boolean(t.early_bird),
      currency: t.currency || 'ARS',
      payment_methods: t.payment_methods || 'efectivo, transferencia, cuotas, tarjeta',
      is_available: Boolean(t.is_available)
    }))

    const { data, error: err } = await updateEventWithTiers(eventId.value, eventPayload, tiersPayload)
    if (err) throw err

    toast.add({
      title: '¡Viaje actualizado!',
      description: `Los cambios para "${data?.title}" fueron guardados correctamente.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    await router.push('/admin/viajes')
  } catch (err: any) {
    console.error('Error al actualizar viaje:', err)
    let errorMessage = err?.message || 'Ocurrió un error al guardar los cambios'

    if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      errorMessage = err.errors[0].message
    }

    toast.add({
      title: 'Error de validación',
      description: errorMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-16">
    <!-- Encabezado con Retorno -->
    <div class="pb-4 border-b border-[#2A2A38]">
      <NuxtLink
        to="/admin/viajes"
        class="text-xs text-zinc-400 hover:text-[#E53924] inline-flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        <span>Volver a salidas programadas</span>
      </NuxtLink>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Editar Salida Programada
          </h1>
          <span class="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Modificación Integral
          </span>
        </div>

        <div v-if="loadedEvent" class="flex items-center gap-2">
          <span class="text-xs text-zinc-400 font-mono">ID: {{ loadedEvent.id.slice(0, 8) }}...</span>
          <NuxtLink
            :to="`/viajes/${loadedEvent.slug}`"
            target="_blank"
            class="text-xs text-zinc-400 hover:text-[#F5EEDC] inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#14141A] border border-[#2A2A38]"
          >
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
            <span>Ver Ficha Pública</span>
          </NuxtLink>
        </div>
      </div>
      <p class="text-xs text-zinc-400 mt-1">
        Modificá fechas, reprogramaciones, colectivos asignados, tarifas o afiches promocionales.
      </p>
    </div>

    <!-- Estado de Carga -->
    <div v-if="pageLoading" class="py-20 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando datos del viaje...</p>
    </div>

    <!-- Estado No Encontrado -->
    <UCard v-else-if="notFound" class="bg-[#1A1A22] border-[#2A2A38] text-center py-16">
      <div class="max-w-md mx-auto space-y-3">
        <div class="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center mx-auto text-[#E53924]">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6" />
        </div>
        <h3 class="text-base font-bold text-[#F5EEDC]">El viaje solicitado no existe o fue eliminado</h3>
        <p class="text-xs text-zinc-400">
          No pudimos localizar la salida con el ID especificado en la base de datos.
        </p>
        <div class="pt-2">
          <UButton
            to="/admin/viajes"
            size="sm"
            color="neutral"
            variant="subtle"
            icon="i-heroicons-arrow-left"
          >
            Volver al Catálogo
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Formulario de Edición -->
    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- BLOQUE 1: Datos del Show y Espectáculo -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-red-950/60 border border-red-900/60 flex items-center justify-center text-[#E53924]">
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
            <UFormField label="Artista / Banda Principal" name="artist_headliner" required help="Ej. Los Piojos, Coldplay, Wos">
              <UInput
                v-model="formState.artist_headliner"
                placeholder="Ej. Los Piojos"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Título Comercial del Viaje" name="title" required help="Nombre que verán los pasajeros">
              <UInput
                v-model="formState.title"
                placeholder="Ej. Viaje a Los Piojos en River Plate"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Recinto y Fecha del Show -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Recinto / Estadio Destino" name="venue_id" required help="Seleccioná la sede homologada">
              <select
                v-model="formState.venue_id"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]"
              >
                <option :value="null">-- Seleccionar recinto --</option>
                <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                  {{ venue.name }} ({{ venue.city }}) - {{ venue.tipo }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Fecha y Hora del Show" name="event_date" required help="Horario anunciado del recital">
              <UInput
                v-model="formState.event_date"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Slug Canónico -->
          <UFormField
            label="Identificador de URL (Slug)"
            name="slug"
            required
            help="Ruta única en la web (ej. /viajes/los-piojos-river-plate-2026-10-15)"
          >
            <div class="flex items-center gap-2">
              <div class="flex-1 flex items-center rounded-md bg-[#14141A] border border-[#2A2A38] px-3 py-1.5 text-xs">
                <span class="text-zinc-500 font-mono select-none">/viajes/</span>
                <input
                  v-model="formState.slug"
                  type="text"
                  class="bg-transparent text-emerald-400 font-mono w-full focus:outline-none ml-1"
                  placeholder="artista-recinto-fecha"
                  @input="onSlugInput"
                />
              </div>
              <UButton
                size="xs"
                variant="subtle"
                color="neutral"
                icon="i-heroicons-arrow-path"
                title="Regenerar automáticamente"
                @click="resetAutoSlug"
              >
                Auto
              </UButton>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- BLOQUE 2: Logística, Flota y Punto de Encuentro -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
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
              <select
                v-model="formState.transport_id"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]"
              >
                <option :value="null">-- Seleccionar vehículo --</option>
                <option v-for="t in transports" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.capacity }} pax) - {{ t.origin }} {{ t.driver ? `[Chofer: ${t.driver.lastname}]` : '' }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Fecha y Hora de Salida (Citación)" name="departure_time" required help="Horario de partida del micro/combi">
              <UInput
                v-model="formState.departure_time"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Preview de unidad seleccionada -->
          <div v-if="selectedTransport" class="p-3 rounded-lg bg-[#14141A] border border-[#2A2A38] flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded bg-blue-950/80 border border-blue-900 flex items-center justify-center text-blue-300 font-bold">
                {{ selectedTransport.capacity }}
              </div>
              <div>
                <p class="font-bold text-[#F5EEDC]">{{ selectedTransport.name }} ({{ selectedTransport.vehicle_type }})</p>
                <p class="text-zinc-400">Salida desde: {{ selectedTransport.origin }} • Patente: {{ selectedTransport.license_plate || 'Sin patente' }}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {{ selectedTransport.capacity }} plazas disponibles
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Punto de Encuentro" name="departure_location" required help="Lugar físico de partida del contingente">
              <UInput
                v-model="formState.departure_location"
                placeholder="Terminal - San Francisco"
                icon="i-heroicons-map-pin"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Política de Regreso" name="return_policy" help="Condiciones de desconcentración">
              <UInput
                v-model="formState.return_policy"
                placeholder="Regreso 60 minutos finalizado el show"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Servicios y Beneficios Incluidos" name="includes_summary" help="Resumen para la tarjeta pública">
            <UTextarea
              v-model="formState.includes_summary"
              rows="2"
              placeholder="Traslado ida y vuelta, coordinación en viaje, seguro y bebidas..."
              class="w-full"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- BLOQUE 3: Gestor Dinámico de Paquetes y Tarifas (Repeater) -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-[#F5EEDC]">Paso 3: Paquetes y Opciones de Precios</h2>
                <p class="text-[11px] text-zinc-400">Configurá las variantes disponibles para los pasajeros.</p>
              </div>
            </div>
            <UButton
              size="xs"
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              icon="i-heroicons-plus"
              @click="addTier"
            >
              Agregar Paquete
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="(tier, idx) in formState.tiers"
            :key="tier.id || idx"
            class="p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-3 relative group"
          >
            <div class="flex items-center justify-between pb-2 border-b border-[#2A2A38]">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <span class="text-xs font-semibold text-[#F5EEDC]">Opción de Viaje</span>
                <span v-if="tier.id" class="text-[10px] text-zinc-500 font-mono">
                  (Existente)
                </span>
                <span v-else class="text-[10px] text-emerald-400 font-semibold">
                  (Nuevo)
                </span>
              </div>
              <div class="flex items-center gap-1">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-document-duplicate"
                  title="Duplicar este paquete"
                  @click="duplicateTier(idx)"
                />
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  title="Eliminar este paquete"
                  :disabled="formState.tiers.length <= 1"
                  @click="removeTier(idx)"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Nombre del Paquete" required help="Ej. Solo Traslado, Traslado + Campo">
                <UInput
                  v-model="tier.name"
                  placeholder="Ej. Solo Traslado (Ida y Vuelta)"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Precio Final (ARS)" required help="Valor total por pasajero">
                <UInput
                  v-model.number="tier.price"
                  type="number"
                  min="0"
                  step="500"
                  icon="i-heroicons-currency-dollar"
                  class="w-full font-mono font-bold"
                />
              </UFormField>
            </div>

            <div class="flex flex-wrap items-center gap-6 pt-1 text-xs">
              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  v-model="tier.includes_ticket"
                  type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-[#E53924] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>¿Incluye Entrada al Show?</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  v-model="tier.early_bird"
                  type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Tarifa Preventa (Early Bird)</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  v-model="tier.is_available"
                  type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>Habilitado para reserva</span>
              </label>
            </div>
          </div>
        </div>
      </UCard>

      <!-- BLOQUE 4: Multimedia y Estado de Publicación -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-900/60 flex items-center justify-center text-purple-400">
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
            <UFormField label="URL del Flyer / Afiche Oficial" name="image_url" help="Enlace web directo HTTPS a la imagen">
              <UInput
                v-model="formState.image_url"
                placeholder="https://ejemplo.com/flyer-recital.jpg"
                icon="i-heroicons-photo"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Estado de la Salida" name="status" help="Visibilidad para los pasajeros">
              <select
                v-model="formState.status"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]"
              >
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
              <img
                :src="formState.image_url"
                alt="Vista previa del afiche"
                class="w-full h-full object-cover"
                @error="(e: any) => e.target.classList.add('hidden')"
              />
            </div>
          </div>

          <div class="pt-2">
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                v-model="formState.is_featured"
                type="checkbox"
                class="rounded bg-[#0F0F12] border-[#2A2A38] text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span class="font-semibold text-[#F5EEDC]">Destacar este viaje en la portada principal</span>
              <span class="text-zinc-500">(Aparecerá en el banner principal superior)</span>
            </label>
          </div>
        </div>
      </UCard>

      <!-- Botones de Acción -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
        <UButton
          to="/admin/viajes"
          variant="ghost"
          color="neutral"
          class="cursor-pointer"
        >
          Cancelar
        </UButton>
        <UButton
          type="submit"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-bold px-6 py-2.5 cursor-pointer shadow-xl shadow-[#E53924]/20"
          :loading="submitting || composableLoading"
        >
          Guardar Cambios del Viaje
        </UButton>
      </div>
    </form>
  </div>
</template>
