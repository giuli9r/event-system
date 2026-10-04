<script setup lang="ts">
interface Props {
  cities: string[]
  months: Array<{ value: string; label: string }>
  totalCount: number
  filteredCount: number
}

const props = defineProps<Props>()

const {
  searchQuery,
  selectedCity,
  selectedMonth,
  statusFilter,
  resetFilters
} = usePublicEvents()

const hasActiveFilters = computed(() => {
  return Boolean(
    searchQuery.value.trim() !== '' ||
    selectedCity.value !== 'all' ||
    selectedMonth.value !== 'all' ||
    statusFilter.value !== 'all'
  )
})
</script>

<template>
  <div class="w-full bg-[#14141B] border border-[#2A2A38] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
    <!-- FILA SUPERIOR: BUSCADOR PRINCIPAL Y SELECTORES -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
      <!-- 1. Buscador de Texto (Ocupa 5 columnas en desktop) -->
      <div class="lg:col-span-5 relative">
        <div class="relative flex items-center">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="absolute left-3.5 w-5 h-5 text-zinc-400 pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por banda, show o estadio..."
            class="w-full pl-11 pr-10 py-2.5 rounded-xl bg-[#0F0F12] border border-[#2A2A38] text-sm text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] transition-colors"
          />
          <button
            v-if="searchQuery"
            type="button"
            aria-label="Limpiar búsqueda"
            class="absolute right-3 text-zinc-400 hover:text-[#F5EEDC] p-1"
            @click="searchQuery = ''"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 2. Filtro de Ciudad (3 columnas) -->
      <div class="lg:col-span-3">
        <div class="relative flex items-center">
          <UIcon
            name="i-heroicons-map-pin"
            class="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none"
          />
          <select
            v-model="selectedCity"
            class="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0F0F12] border border-[#2A2A38] text-sm text-[#F5EEDC] focus:outline-none focus:border-[#E53924] appearance-none cursor-pointer transition-colors"
          >
            <option value="all">Todas las ciudades</option>
            <option v-for="c in cities" :key="c" :value="c">
              {{ c }}
            </option>
          </select>
          <UIcon
            name="i-heroicons-chevron-down"
            class="absolute right-3 w-4 h-4 text-zinc-500 pointer-events-none"
          />
        </div>
      </div>

      <!-- 3. Filtro de Mes (2 columnas) -->
      <div class="lg:col-span-2">
        <div class="relative flex items-center">
          <UIcon
            name="i-heroicons-calendar"
            class="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none"
          />
          <select
            v-model="selectedMonth"
            class="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0F0F12] border border-[#2A2A38] text-sm text-[#F5EEDC] focus:outline-none focus:border-[#E53924] appearance-none cursor-pointer transition-colors"
          >
            <option value="all">Todos los meses</option>
            <option v-for="m in months" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>
          <UIcon
            name="i-heroicons-chevron-down"
            class="absolute right-3 w-4 h-4 text-zinc-500 pointer-events-none"
          />
        </div>
      </div>

      <!-- 4. Filtro de Disponibilidad (2 columnas) -->
      <div class="lg:col-span-2">
        <div class="relative flex items-center">
          <UIcon
            name="i-heroicons-ticket"
            class="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none"
          />
          <select
            v-model="statusFilter"
            class="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0F0F12] border border-[#2A2A38] text-sm text-[#F5EEDC] focus:outline-none focus:border-[#E53924] appearance-none cursor-pointer transition-colors"
          >
            <option value="all">Todos los cupos</option>
            <option value="available">Solo Disponibles</option>
            <option value="sold_out">Solo Agotados</option>
          </select>
          <UIcon
            name="i-heroicons-chevron-down"
            class="absolute right-3 w-4 h-4 text-zinc-500 pointer-events-none"
          />
        </div>
      </div>
    </div>

    <!-- FILA INFERIOR: CONTADOR DE RESULTADOS Y RESET -->
    <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#2A2A38]/50 text-xs text-zinc-400">
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-[#E53924]" />
        <span>
          Mostrando <strong class="text-[#F5EEDC]">{{ filteredCount }}</strong> de {{ totalCount }} salidas
        </span>
      </div>

      <!-- Botón de Limpiar Filtros -->
      <button
        v-if="hasActiveFilters"
        type="button"
        class="inline-flex items-center gap-1.5 text-xs text-[#E53924] hover:text-[#ff5a47] font-semibold transition-colors"
        @click="resetFilters"
      >
        <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" />
        <span>Limpiar filtros</span>
      </button>
    </div>
  </div>
</template>
