<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Panel de Operaciones | Tripu Admin'
})

const user = useSupabaseUser()
const supabase = useSupabaseClient<Database>()

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

onMounted(() => {
  fetchStats()
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
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          icon="i-heroicons-arrow-path"
          :loading="stats.loading"
          @click="fetchStats"
        >
          Actualizar
        </UButton>
        <UButton
          to="/admin/viajes/nuevo"
          size="sm"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-md shadow-[#E53924]/20"
          icon="i-heroicons-plus"
        >
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
          <div class="w-12 h-12 rounded-xl bg-[#E53924]/10 border border-[#E53924]/20 flex items-center justify-center text-[#E53924]">
            <UIcon name="i-heroicons-ticket" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/viajes" class="text-xs text-[#E53924] hover:underline flex items-center gap-1 font-medium">
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
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <UIcon name="i-heroicons-truck" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/transportes" class="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium">
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
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/choferes" class="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium">
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
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UIcon name="i-heroicons-building-office-2" class="w-6 h-6" />
          </div>
        </div>
        <template #footer>
          <NuxtLink to="/admin/recintos" class="text-xs text-purple-400 hover:underline flex items-center gap-1 font-medium">
            <span>Ver destinos</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </template>
      </UCard>
    </div>

    <!-- Panel de Estado de Seguridad e Infraestructura -->
    <div class="p-6 bg-[#1A1A22] border border-[#2A2A38] rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-[#F5EEDC] flex items-center gap-2">
          <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-emerald-500" />
          <span>Estado de la Infraestructura Operativa</span>
        </h3>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
          Sistema Operativo
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 pt-2">
        <div class="p-3 bg-[#0F0F12] rounded-xl border border-[#2A2A38] space-y-1">
          <p class="font-semibold text-zinc-300">Base de Datos PostgreSQL</p>
          <p class="text-emerald-400 flex items-center gap-1">
            <span>●</span> 7 Tablas con Row Level Security activo
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
