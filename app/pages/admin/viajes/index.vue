<script setup lang="ts">
import type { EventWithRelations, EventStatus } from '~/composables/useEvents'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const toast = useToast()
const { events, loading, error, isCacheValid, fetchEvents, updateEventStatus, deleteEvent } = useEvents()

// Búsqueda y filtrado reactivo
const searchQuery = ref('')
const selectedStatusFilter = ref<string>('all')

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados', color: 'emerald' },
  { value: 'draft', label: 'Borradores', color: 'amber' },
  { value: 'sold_out', label: 'Sold Out', color: 'red' },
  { value: 'rescheduled', label: 'Reprogramados', color: 'purple' },
  { value: 'canceled', label: 'Cancelados', color: 'rose' },
  { value: 'completed', label: 'Finalizados', color: 'zinc' }
]

// Modal de baja / eliminación
const isDeleteModalOpen = ref(false)
const eventToDelete = ref<EventWithRelations | null>(null)
const deleting = ref(false)

// Modal de ajuste rápido de tarifas (< 10s)
const isQuickPriceModalOpen = ref(false)
const eventToQuickPrice = ref<EventWithRelations | null>(null)

function openQuickPriceModal(ev: EventWithRelations) {
  eventToQuickPrice.value = ev
  isQuickPriceModalOpen.value = true
}

// Filtrado predictivo
const filteredEvents = computed(() => {
  return events.value.filter((ev) => {
    // Filtro por estado
    if (selectedStatusFilter.value !== 'all' && ev.status !== selectedStatusFilter.value) {
      return false
    }

    // Filtro por texto predictivo
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true

    const artistMatch = ev.artist_headliner.toLowerCase().includes(q)
    const titleMatch = ev.title.toLowerCase().includes(q)
    const venueMatch = ev.venue?.name?.toLowerCase().includes(q) || false
    const locationMatch = ev.departure_location.toLowerCase().includes(q)

    return artistMatch || titleMatch || venueMatch || locationMatch
  })
})

// Métricas & KPIs de Salidas
const totalPublished = computed(() => events.value.filter(e => e.status === 'published').length)
const totalDrafts = computed(() => events.value.filter(e => e.status === 'draft').length)
const totalSoldOut = computed(() => events.value.filter(e => e.status === 'sold_out').length)

const totalCapacityOnStreet = computed(() => {
  return events.value
    .filter(e => e.status === 'published' || e.status === 'sold_out')
    .reduce((sum, e) => sum + (e.transport?.capacity || 0), 0)
})

// Helpers de formato
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return dateStr
  }
}

function getPriceRange(ev: EventWithRelations): string {
  if (!ev.package_tiers || ev.package_tiers.length === 0) {
    return 'Sin tarifas'
  }
  const prices = ev.package_tiers.map(t => Number(t.price))
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  if (min === max) {
    return `$${min.toLocaleString('es-AR')}`
  }
  return `$${min.toLocaleString('es-AR')} - $${max.toLocaleString('es-AR')}`
}

function getStatusBadge(status: EventStatus) {
  switch (status) {
    case 'published':
      return { label: 'Publicado', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: 'i-heroicons-check-circle' }
    case 'draft':
      return { label: 'Borrador', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: 'i-heroicons-pencil-square' }
    case 'sold_out':
      return { label: 'Sold Out', class: 'bg-red-500/10 text-red-400 border-red-500/30', icon: 'i-heroicons-fire' }
    case 'rescheduled':
      return { label: 'Reprogramado', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: 'i-heroicons-calendar-days' }
    case 'canceled':
      return { label: 'Cancelado', class: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: 'i-heroicons-no-symbol' }
    case 'completed':
      return { label: 'Finalizado', class: 'bg-zinc-800 text-zinc-400 border-zinc-700', icon: 'i-heroicons-archive-box' }
    default:
      return { label: status, class: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: 'i-heroicons-ticket' }
  }
}

async function handleQuickStatusChange(ev: EventWithRelations, newStatus: EventStatus) {
  if (ev.status === newStatus) return
  try {
    const { error: err } = await updateEventStatus(ev.id, newStatus)
    if (err) throw err
    toast.add({
      title: 'Estado actualizado',
      description: `El viaje "${ev.title}" ahora está en estado ${getStatusBadge(newStatus).label}.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error al cambiar estado',
      description: err?.message || 'No se pudo actualizar el estado',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }
}

function openDeleteModal(ev: EventWithRelations) {
  eventToDelete.value = ev
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!eventToDelete.value) return
  deleting.value = true
  try {
    const { error: err } = await deleteEvent(eventToDelete.value.id)
    if (err) throw err
    toast.add({
      title: 'Viaje eliminado',
      description: `La salida "${eventToDelete.value.title}" fue eliminada del sistema.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    isDeleteModalOpen.value = false
    eventToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al eliminar',
      description: err?.message || 'No se pudo eliminar el viaje',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado Operativo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Gestión de Salidas y Viajes
          </h1>
          <span class="px-2 py-0.5 text-xs font-semibold rounded bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/20">
            Sprint 2 • US-05
          </span>
          <span
            v-if="isCacheValid"
            class="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            title="Caché reactiva ADR-05 activa (TTL 5 min)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Caché 5m activa
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Agenda de traslados a recitales y festivales, asignación de unidades y control de cupos.
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
          @click="fetchEvents({ force: true })"
        />
        <UButton
          to="/admin/viajes/nuevo"
          size="md"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-lg shadow-[#E53924]/20"
          icon="i-heroicons-plus"
        >
          Publicar Nuevo Viaje
        </UButton>
      </div>
    </div>

    <!-- Barra de Métricas y KPIs de Salidas -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Salidas Activas</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalPublished }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-ticket" class="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Cupos en Calle</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">
              {{ totalCapacityOnStreet }}
              <span class="text-xs font-normal text-zinc-400">plazas</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-truck" class="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Borradores</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalDrafts }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Sold Out</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">
              {{ totalSoldOut }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-fire" class="w-5 h-5 text-[#E53924]" />
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
          placeholder="Buscar por artista, show, recinto o punto de salida..."
          class="w-full"
        />
      </div>

      <!-- Filtros Rápidos por Estado -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          type="button"
          class="px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer whitespace-nowrap"
          :class="selectedStatusFilter === opt.value
            ? 'bg-[#E53924] border-[#E53924] text-white font-semibold shadow-sm shadow-[#E53924]/30'
            : 'bg-[#14141A] border-[#2A2A38] text-zinc-300 hover:border-zinc-500'"
          @click="selectedStatusFilter = opt.value"
        >
          {{ opt.label }}
          <span class="text-[11px] opacity-75">
            ({{ opt.value === 'all' ? events.length : events.filter(e => e.status === opt.value).length }})
          </span>
        </button>
      </div>
    </div>

    <!-- Estado de Error de Red -->
    <UAlert
      v-if="error"
      title="Error al conectar con la base de datos de viajes"
      :description="error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
    >
      <template #actions>
        <UButton size="xs" variant="solid" color="error" @click="fetchEvents({ force: true })">
          Reintentar Carga
        </UButton>
      </template>
    </UAlert>

    <!-- Estado de Carga Inicial -->
    <div v-if="loading && events.length === 0" class="py-16 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando agenda de salidas...</p>
    </div>

    <!-- Estado Vacío -->
    <UCard
      v-else-if="!loading && events.length === 0"
      class="bg-[#1A1A22] border-[#2A2A38] text-center py-16"
    >
      <div class="max-w-md mx-auto space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
          <UIcon name="i-heroicons-ticket" class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-[#F5EEDC]">No hay viajes programados todavía</h3>
        <p class="text-xs text-zinc-400">
          Comenzá publicando tu primera salida hacia un festival o recital. Podrás vincular recintos, flota y tarifas.
        </p>
        <div class="pt-2">
          <UButton
            to="/admin/viajes/nuevo"
            size="sm"
            class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer"
            icon="i-heroicons-plus"
          >
            Publicar Primer Viaje
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Tabla Catálogo de Salidas -->
    <UCard
      v-else
      class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-[#2A2A38] text-left text-xs sm:text-sm">
          <thead class="bg-[#14141A] text-[11px] sm:text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-3.5 py-3 lg:px-4">Evento / Artista</th>
              <th scope="col" class="px-3 py-3 lg:px-4 whitespace-nowrap">Fecha & Salida</th>
              <th scope="col" class="px-3 py-3 lg:px-4">Recinto</th>
              <th scope="col" class="px-3 py-3 lg:px-4">Unidad & Plazas</th>
              <th scope="col" class="px-3 py-3 lg:px-4 whitespace-nowrap">Tarifas</th>
              <th scope="col" class="px-3 py-3 lg:px-4">Estado</th>
              <th scope="col" class="px-3 py-3 lg:px-4 text-right whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr
              v-for="ev in filteredEvents"
              :key="ev.id"
              class="hover:bg-[#20202B] transition-colors"
            >
              <!-- Evento / Artista & Flyer -->
              <td class="px-3.5 py-3 lg:px-4">
                <div class="flex items-center gap-2.5">
                  <div class="relative w-10 h-10 rounded-lg overflow-hidden border border-[#2A2A38] bg-[#0F0F12] shrink-0 flex items-center justify-center">
                    <img
                      v-if="ev.image_url"
                      :src="ev.image_url"
                      :alt="ev.title"
                      class="w-full h-full object-cover"
                      loading="lazy"
                      @error="(e: any) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden') }"
                    />
                    <div
                      class="flex items-center justify-center w-full h-full bg-gradient-to-br from-red-950/50 to-zinc-900 text-[#E53924]"
                      :class="{ 'hidden': ev.image_url }"
                    >
                      <UIcon name="i-heroicons-musical-note" class="w-5 h-5" />
                    </div>
                    <span
                      v-if="ev.is_featured"
                      class="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
                      title="Evento Destacado"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-[#F5EEDC] text-xs sm:text-sm truncate max-w-[140px] md:max-w-[170px] lg:max-w-[210px] xl:max-w-[270px]" :title="ev.title">
                      {{ ev.title }}
                    </p>
                    <p class="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-[140px] md:max-w-[170px] lg:max-w-[210px] xl:max-w-[270px]" :title="ev.artist_headliner">
                      <UIcon name="i-heroicons-user" class="w-3 h-3 text-zinc-500 shrink-0" />
                      <span class="truncate">{{ ev.artist_headliner }}</span>
                    </p>
                  </div>
                </div>
              </td>

              <!-- Fecha Show & Salida -->
              <td class="px-3 py-3 lg:px-4 whitespace-nowrap">
                <div class="space-y-0.5">
                  <p class="text-xs font-medium text-zinc-200 flex items-center gap-1">
                    <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5 text-[#E53924] shrink-0" />
                    <span>Show: {{ formatDate(ev.event_date) }}</span>
                  </p>
                  <p class="text-[11px] text-zinc-400 flex items-center gap-1">
                    <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>Salida: {{ formatTime(ev.departure_time) }} hs</span>
                  </p>
                </div>
              </td>

              <!-- Recinto & Destino -->
              <td class="px-3 py-3 lg:px-4">
                <div v-if="ev.venue" class="min-w-0">
                  <p class="font-semibold text-xs text-[#F5EEDC] truncate max-w-[110px] md:max-w-[130px] lg:max-w-[150px] xl:max-w-[180px]" :title="ev.venue.name">
                    {{ ev.venue.name }}
                  </p>
                  <p class="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-[110px] md:max-w-[130px] lg:max-w-[150px] xl:max-w-[180px]">
                    <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-zinc-500 shrink-0" />
                    <span class="truncate">{{ ev.venue.city }}</span>
                  </p>
                </div>
                <span v-else class="text-xs text-zinc-500 italic">Sin recinto</span>
              </td>

              <!-- Transporte & Plazas -->
              <td class="px-3 py-3 lg:px-4">
                <div v-if="ev.transport" class="min-w-0">
                  <p class="text-xs font-semibold text-zinc-200 truncate max-w-[100px] md:max-w-[120px] lg:max-w-[140px]" :title="ev.transport.name">
                    {{ ev.transport.name }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-[#2A2A38] text-zinc-300 shrink-0">
                      {{ ev.transport.capacity }} pax
                    </span>
                    <span v-if="ev.transport.driver" class="text-[11px] text-zinc-400 truncate max-w-[65px] md:max-w-[80px]" :title="ev.transport.driver.lastname">
                      {{ ev.transport.driver.lastname }}
                    </span>
                  </div>
                </div>
                <span v-else class="text-xs text-zinc-500 italic">Sin vehículo</span>
              </td>

              <!-- Tarifas (ARS) -->
              <td class="px-3.5 py-3 lg:px-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <div>
                    <p class="font-mono text-xs font-bold text-emerald-400">
                      {{ getPriceRange(ev) }}
                    </p>
                    <p class="text-[10px] text-zinc-400">
                      {{ ev.package_tiers?.length || 0 }} {{ ev.package_tiers?.length === 1 ? 'tarifa' : 'tarifas' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    title="Ajuste rápido de tarifas en < 10s"
                    @click="openQuickPriceModal(ev)"
                  >
                    <UIcon name="i-heroicons-banknotes" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>

              <!-- Estado Operativo & Selector Rápido -->
              <td class="px-3 py-3 lg:px-4">
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap"
                    :class="getStatusBadge(ev.status).class"
                  >
                    <UIcon :name="getStatusBadge(ev.status).icon" class="w-3 h-3 shrink-0" />
                    {{ getStatusBadge(ev.status).label }}
                  </span>

                  <!-- Selector Rápido de Estado -->
                  <select
                    :value="ev.status"
                    class="rounded bg-[#14141A] border border-[#2A2A38] text-[10px] text-zinc-300 px-1.5 py-0.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
                    title="Cambiar estado rápidamente"
                    @change="(e: any) => handleQuickStatusChange(ev, e.target.value as EventStatus)"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="rescheduled">Reprogramado</option>
                    <option value="canceled">Cancelado</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>
              </td>

              <!-- Acciones -->
              <td class="px-3 py-3 lg:px-4 whitespace-nowrap text-right space-x-1">
                <NuxtLink
                  :to="`/admin/viajes/${ev.id}/editar`"
                  class="inline-flex items-center p-1.5 text-zinc-400 hover:text-amber-400 rounded hover:bg-[#2A2A38]/50 transition-colors"
                  title="Editar viaje completo (4 pasos)"
                >
                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                </NuxtLink>
                <NuxtLink
                  :to="`/viajes/${ev.slug}`"
                  target="_blank"
                  class="inline-flex items-center p-1.5 text-zinc-400 hover:text-[#F5EEDC] rounded hover:bg-[#2A2A38]/50 transition-colors"
                  title="Ver página pública en nueva pestaña"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                </NuxtLink>
                <UButton
                  size="xs"
                  variant="subtle"
                  color="error"
                  icon="i-heroicons-trash"
                  class="cursor-pointer"
                  title="Eliminar salida"
                  @click="openDeleteModal(ev)"
                />
              </td>
            </tr>

            <tr v-if="filteredEvents.length === 0 && (searchQuery || selectedStatusFilter !== 'all')">
              <td colspan="7" class="px-6 py-8 text-center text-xs text-zinc-500">
                No se encontraron salidas que coincidan con los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal de Confirmación de Eliminación -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Eliminar Salida"
      description="Esta acción eliminará el viaje y todas sus tarifas configuradas."
    >
      <template #body>
        <div class="space-y-4 pt-1">
          <div class="p-3.5 rounded-lg bg-red-950/30 border border-red-900/50 text-xs text-red-300 space-y-2">
            <div class="flex items-center gap-2 font-bold text-red-200">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-[#E53924] shrink-0" />
              <span>Confirmación de Eliminación</span>
            </div>
            <p>
              Estás a punto de dar de baja la salida: <strong class="text-white">{{ eventToDelete?.title }}</strong>.
            </p>
            <p class="text-red-400">
              Se eliminarán también las {{ eventToDelete?.package_tiers?.length || 0 }} opciones de paquetes y precios asociados en cascada.
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

    <!-- Modal de Ajuste Rápido de Precios (< 10s) -->
    <QuickPriceModal
      v-model:open="isQuickPriceModalOpen"
      :event="eventToQuickPrice"
    />
  </div>
</template>
