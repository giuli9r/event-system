<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-[#2A2A38]">
      <div>
        <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
          Recintos y Estadios
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Lugares físicos de espectáculos, capacidades oficiales y tipologías.
        </p>
      </div>
      <UButton
        size="sm"
        class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold"
        icon="i-heroicons-plus"
      >
        Registrar Recinto
      </UButton>
    </div>

    <UCard class="bg-[#1A1A22] border-[#2A2A38] text-center py-12">
      <div class="space-y-3">
        <UIcon name="i-heroicons-building-office-2" class="w-12 h-12 mx-auto text-zinc-600" />
        <h3 class="text-sm font-semibold text-zinc-300">Maestro de Recintos en Desarrollo (Sprint 2 - US-04)</h3>
        <p class="text-xs text-zinc-500 max-w-sm mx-auto">
          Control de estadios, arenas, teatros y clubes con geolocalización de Google Maps.
        </p>
      </div>
    </UCard>
  </div>
</template>
