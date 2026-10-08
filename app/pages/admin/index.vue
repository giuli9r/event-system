<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { EventWithRelations, EventStatus } from '~/composables/useEvents'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Panel de Operaciones | Tripu Admin'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient<Database>()
const toast = useToast()

// Composable useEvents con arquitectura de caché reactiva en memoria (ADR-05)
const {
  events,
  loading: eventsLoading,
  error: eventsError,
  fetchEvents,
  updateEventStatus
} = useEvents()

// Filtro ágil para el paneo de los próximos 5 Viajes (Todos / Publicados / Sold Out)
const statusFilter = ref<'all' | 'published' | 'sold_out'>('all')

// Consultas rápidas para los contadores del dashboard
const stats = reactive({
  eventsCount: 0,
  transportsCount: 0,
  driversCount: 0,
  venuesCount: 0,
  loading: true
})

async function fetchStats() {
  stats.loading = true
  try {
    const [eventsRes, transportsRes, driversRes, venuesRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('transports').select('id', { count: 'exact', head: true }),
      supabase.from('drivers').select('id', { count: 'exact', head: true }),
      supabase.from('venues').select('id', { count: 'exact', head: true })
    ])

    stats.eventsCount = eventsRes.count || 0
    stats.transportsCount = transportsRes.count || 0
    stats.driversCount = driversRes.count || 0
    stats.venuesCount = venuesRes.count || 0
  } catch (error) {
    console.error('Error cargando estadísticas del dashboard:', error)
  } finally {
    stats.loading = false
  }
}

async function refreshDashboard() {
  await Promise.all([
    fetchStats(),
    fetchEvents({ force: true })
  ])
}

// Helpers de formato para fechas y horarios
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

// Configuración visual de badges según estado operativo
function getStatusBadge(status: EventStatus) {
  switch (status) {
    case 'published':
      return {
        label: 'Publicado',
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: 'i-heroicons-check-circle'
      }
    case 'sold_out':
      return {
        label: 'Sold Out',
        class: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: 'i-heroicons-fire'
      }
    case 'draft':
      return {
        label: 'Borrador',
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: 'i-heroicons-pencil-square'
      }
    case 'rescheduled':
      return {
        label: 'Reprogramado',
        class: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: 'i-heroicons-calendar-days'
      }
    case 'canceled':
      return {
        label: 'Cancelado',
        class: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        icon: 'i-heroicons-no-symbol'
      }
    case 'completed':
      return {
        label: 'Finalizado',
        class: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        icon: 'i-heroicons-archive-box'
      }
    default:
      return {
        label: status,
        class: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        icon: 'i-heroicons-ticket'
      }
  }
}

// Selector rápido de estado en tabla con sincronización reactiva local
async function handleQuickStatusChange(ev: EventWithRelations, newStatus: EventStatus) {
  if (ev.status === newStatus) return
  try {
    const { error: err } = await updateEventStatus(ev.id, newStatus)
    if (err) throw err
    toast.add({
      title: 'Estado actualizado',
      description: `"${ev.title}" pasó a estado ${getStatusBadge(newStatus).label}.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error al cambiar estado',
      description: err?.message || 'No se pudo actualizar el estado de la salida',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }
}

// Próximos 5 Viajes ordenados cronológicamente
const upcomingEvents = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Filtro de viajes que no hayan sido completados ni cancelados
  let list = events.value.filter((ev) => {
    if (ev.status === 'completed' || ev.status === 'canceled') return false
    if (statusFilter.value !== 'all' && ev.status !== statusFilter.value) return false
    const targetDate = new Date(ev.departure_time || ev.event_date)
    return targetDate >= now
  })

  // Fallback si no hay salidas futuras estrictas en base de datos local/dev
  if (list.length === 0 && events.value.length > 0) {
    list = events.value.filter((ev) => {
      if (ev.status === 'completed' || ev.status === 'canceled') return false
      if (statusFilter.value !== 'all' && ev.status !== statusFilter.value) return false
      return true
    })
  }

  // Ordenar por fecha cronológica ascendente (más próxima primero)
  list.sort((a, b) => {
    const timeA = new Date(a.departure_time || a.event_date).getTime()
    const timeB = new Date(b.departure_time || b.event_date).getTime()
    return timeA - timeB
  })

  return list.slice(0, 5)
})

onMounted(() => {
  fetchStats()
  fetchEvents()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Encabezado de Bienvenida -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#2A2A38]">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-[#F5EEDC] tracking-tight">
          Panel de Operaciones
        </h1>
        <p class="text-sm text-zinc-400 mt-1">
          Sesión activa iniciada como <span class="text-[#E53924] font-medium">{{ user?.email }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-arrow-path"
          :loading="stats.loading || eventsLoading" @click="refreshDashboard">
          Actualizar
        </UButton>
        <UButton to="/admin/viajes/nuevo" size="sm"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-md shadow-[#E53924]/20"
          icon="i-heroicons-plus">
          Publicar Viaje
        </UButton>
      </div>
    </div>

    <!-- Grilla de Tarjetas de Resumen (KPIs) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Tarjeta Viajes -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Viajes / Salidas
            </p>
            <p class="text-3xl font-black text-[#F5EEDC] mt-2">
              <span v-if="stats.loading">...</span>
              <span v-else>{{ stats.eventsCount }}</span>
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-[#E53924]/10 border border-[#E53924]/20 flex items-center justify-center text-[#E53924]">
            <UIcon name="i-heroicons-ticket" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/viajes"
            class="text-xs text-[#E53924] hover:underline flex items-center gap-1 font-medium">
            <span>Gestionar salidas</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </template>
      </UCard>

      <!-- Tarjeta Flota -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Flota de Vehículos
            </p>
            <p class="text-3xl font-black text-[#F5EEDC] mt-2">
              <span v-if="stats.loading">...</span>
              <span v-else>{{ stats.transportsCount }}</span>
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <UIcon name="i-heroicons-truck" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/transportes"
            class="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium">
            <span>Ver flota (combis/micros)</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </template>
      </UCard>

      <!-- Tarjeta Choferes -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Choferes Profesionales
            </p>
            <p class="text-3xl font-black text-[#F5EEDC] mt-2">
              <span v-if="stats.loading">...</span>
              <span v-else>{{ stats.driversCount }}</span>
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/choferes"
            class="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium">
            <span>Directorio de choferes</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </template>
      </UCard>

      <!-- Tarjeta Recintos -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38] rounded-xl hover:border-zinc-700 transition-colors">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Recintos / Estadios
            </p>
            <p class="text-3xl font-black text-[#F5EEDC] mt-2">
              <span v-if="stats.loading">...</span>
              <span v-else>{{ stats.venuesCount }}</span>
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UIcon name="i-heroicons-building-office-2" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/recintos"
            class="text-xs text-purple-400 hover:underline flex items-center gap-1 font-medium">
            <span>Ver destinos</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </template>
      </UCard>
    </div>

    <!-- Tabla de Próximos 5 Viajes (Paneo Operativo) -->
    <div class="space-y-4">
      <!-- Encabezado de la Sección -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5">
            <h2 class="text-lg sm:text-xl font-black text-[#F5EEDC] tracking-tight flex items-center gap-2">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-[#E53924]" />
              <span>Próximos 5 Viajes</span>
            </h2>
            <span
              class="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/20">
              {{ upcomingEvents.length }} salidas
            </span>
          </div>
          <p class="text-xs text-zinc-400 mt-0.5">
            Primer paneo de los próximos viajes programados en la cartelera operativa.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Filtro ágil por Estado -->
          <div class="flex items-center bg-[#14141A] p-0.5 rounded-lg border border-[#2A2A38]">
            <button type="button" class="px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer"
              :class="statusFilter === 'all'
                ? 'bg-[#E53924] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'" @click="statusFilter = 'all'">
              Todos
            </button>
            <button type="button" class="px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer"
              :class="statusFilter === 'published'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'" @click="statusFilter = 'published'">
              Publicados
            </button>
            <button type="button" class="px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer"
              :class="statusFilter === 'sold_out'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'" @click="statusFilter = 'sold_out'">
              Sold Out
            </button>
          </div>

          <!-- Enlace a Gestión Completa de Salidas -->
          <NuxtLink to="/admin/viajes"
            class="text-xs font-semibold text-[#E53924] hover:text-[#c9321f] hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E53924]/10 border border-[#E53924]/20 transition-colors">
            <span>Ver toda la agenda</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </div>

      <!-- Estado de Error de Conexión -->
      <UAlert v-if="eventsError" title="Error al cargar la agenda de salidas" :description="eventsError" color="error"
        variant="subtle" icon="i-heroicons-exclamation-triangle">
        <template #actions>
          <UButton size="xs" variant="solid" color="error" @click="fetchEvents({ force: true })">
            Reintentar
          </UButton>
        </template>
      </UAlert>

      <!-- Estado de Carga -->
      <div v-if="eventsLoading && events.length === 0"
        class="py-16 text-center bg-[#1A1A22] rounded-2xl border border-[#2A2A38]">
        <UIcon name="i-heroicons-arrow-path" class="w-7 h-7 mx-auto text-[#E53924] animate-spin mb-2" />
        <p class="text-xs text-zinc-400">Cargando los próximos viajes...</p>
      </div>

      <!-- Estado Vacío -->
      <UCard v-else-if="!eventsLoading && upcomingEvents.length === 0"
        class="bg-[#1A1A22] border-[#2A2A38] text-center py-12">
        <div class="max-w-md mx-auto space-y-3">
          <div
            class="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <UIcon name="i-heroicons-ticket" class="w-6 h-6" />
          </div>
          <h3 class="text-sm font-bold text-[#F5EEDC]">
            No hay salidas programadas
          </h3>
          <p class="text-xs text-zinc-400">
            {{ statusFilter !== 'all' ? 'No se encontraron viajes con el filtro de estado seleccionado.' : `Aún no tenés
            viajes próximos agendados.Podés publicar una nueva salida con su itinerario y tarifas.` }}
          </p>
          <div class="pt-2">
            <UButton to="/admin/viajes/nuevo" size="xs"
              class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-md shadow-[#E53924]/20"
              icon="i-heroicons-plus">
              Publicar Nuevo Viaje
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Tabla Semántica Novedosa y Accesible (ADR-06) -->
      <UCard v-else class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
        <div class="overflow-x-auto">
          <table class="w-full divide-y divide-[#2A2A38] text-left text-xs sm:text-sm">
            <thead class="bg-[#14141A] text-[11px] sm:text-xs uppercase font-semibold text-zinc-400">
              <tr>
                <th scope="col" class="px-4 py-3.5">Evento / Artista</th>
                <th scope="col" class="px-4 py-3.5 whitespace-nowrap">Fecha de Salida</th>
                <th scope="col" class="px-4 py-3.5">Recinto</th>
                <th scope="col" class="px-4 py-3.5">Estado</th>
                <th scope="col" class="px-4 py-3.5 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
              <tr v-for="ev in upcomingEvents" :key="ev.id" class="hover:bg-[#20202B] transition-colors">
                <!-- Columna: Evento / Artista -->
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-3">
                    <div
                      class="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-[#2A2A38] flex items-center justify-center">
                      <img v-if="ev.image_url" :src="ev.image_url" :alt="ev.title" class="w-full h-full object-cover"
                        loading="lazy" />
                      <UIcon v-else name="i-heroicons-ticket" class="w-5 h-5 text-zinc-500" />
                      <span v-if="ev.is_featured"
                        class="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
                        title="Evento Destacado" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-[#F5EEDC] text-xs sm:text-sm truncate max-w-[180px] sm:max-w-[240px] md:max-w-[280px]"
                        :title="ev.title">
                        {{ ev.title }}
                      </p>
                      <p class="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-[180px] sm:max-w-[240px]"
                        :title="ev.artist_headliner">
                        <UIcon name="i-heroicons-user" class="w-3 h-3 text-zinc-500 shrink-0" />
                        <span class="truncate">{{ ev.artist_headliner }}</span>
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Columna: Fecha de Salida -->
                <td class="px-4 py-3.5 whitespace-nowrap">
                  <div class="space-y-0.5">
                    <p class="text-xs font-semibold text-[#F5EEDC] flex items-center gap-1.5">
                      <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-[#E53924] shrink-0" />
                      <span>{{ formatDate(ev.departure_time) }} · {{ formatTime(ev.departure_time) }} hs</span>
                    </p>
                    <p class="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <UIcon name="i-heroicons-calendar" class="w-3 h-3 text-zinc-500 shrink-0" />
                      <span>Show: {{ formatDate(ev.event_date) }}</span>
                    </p>
                  </div>
                </td>

                <!-- Columna: Recinto -->
                <td class="px-4 py-3.5">
                  <div v-if="ev.venue" class="min-w-0">
                    <p class="font-semibold text-xs text-[#F5EEDC] truncate max-w-[140px] sm:max-w-[180px]"
                      :title="ev.venue.name">
                      {{ ev.venue.name }}
                    </p>
                    <p class="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-[140px]">
                      <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-zinc-500 shrink-0" />
                      <span class="truncate">{{ ev.venue.city }}</span>
                    </p>
                  </div>
                  <span v-else class="text-xs text-zinc-500 italic">Sin recinto</span>
                </td>

                <!-- Columna: Estado = Publicado | Sold Out -->
                <td class="px-4 py-3.5 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap shadow-sm"
                      :class="getStatusBadge(ev.status).class">
                      <UIcon :name="getStatusBadge(ev.status).icon" class="w-3 h-3 shrink-0" />
                      {{ getStatusBadge(ev.status).label }}
                    </span>

                    <!-- Selector rápido para alternar entre estados (Publicado / Sold Out / Borrador) -->
                    <select :value="ev.status"
                      class="rounded bg-[#14141A] border border-[#2A2A38] text-[10px] text-zinc-300 px-1.5 py-0.5 focus:outline-none focus:border-[#E53924] cursor-pointer"
                      title="Cambiar estado rápidamente"
                      @change="(e: any) => handleQuickStatusChange(ev, e.target.value as EventStatus)">
                      <option value="published">Publicado</option>
                      <option value="sold_out">Sold Out</option>
                      <option value="draft">Borrador</option>
                    </select>
                  </div>
                </td>

                <!-- Columna: Acciones / Botón de Edición -->
                <td class="px-4 py-3.5 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <NuxtLink :to="`/admin/viajes/${ev.id}/editar`"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2A2A38]/50 hover:bg-[#E53924] text-zinc-200 hover:text-white transition-colors border border-[#2A2A38] hover:border-[#E53924]"
                      title="Editar viaje completo">
                      <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </NuxtLink>

                    <NuxtLink :to="`/viajes/${ev.slug}`" target="_blank"
                      class="inline-flex items-center p-1.5 text-zinc-400 hover:text-[#F5EEDC] rounded-lg hover:bg-[#2A2A38]/60 transition-colors"
                      title="Ver ficha pública en nueva pestaña">
                      <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Panel de Estado de Seguridad e Infraestructura -->
    <div class="p-6 bg-[#1A1A22] border border-[#2A2A38] rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-[#F5EEDC] flex items-center gap-2">
          <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-emerald-500" />
          <span>Estado de la Infraestructura Operativa</span>
        </h3>
        <span
          class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
          Sistema Operativo
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 pt-2">
        <div class="p-3 bg-[#0F0F12] rounded-xl border border-[#2A2A38] space-y-1">
          <p class="font-semibold text-zinc-300">Base de Datos PostgreSQL</p>
          <p class="text-emerald-400 flex items-center gap-1">
            <span>●</span> 8 Tablas con Row Level Security activo
          </p>
        </div>
        <div class="p-3 bg-[#0F0F12] rounded-xl border border-[#2A2A38] space-y-1">
          <p class="font-semibold text-zinc-300">Autenticación Supabase</p>
          <p class="text-emerald-400 flex items-center gap-1">
            <span>●</span> Tokens JWT firmados en cookies HttpOnly
          </p>
        </div>
        <div class="p-3 bg-[#0F0F12] rounded-xl border border-[#2A2A38] space-y-1">
          <p class="font-semibold text-zinc-300">Protección de Rutas</p>
          <p class="text-emerald-400 flex items-center gap-1">
            <span>●</span> Middleware auth activo en /admin/*
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
