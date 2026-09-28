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
          Gestión de Salidas y Viajes
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Listado de salidas programadas hacia recitales y festivales.
        </p>
      </div>
      <UButton
        to="/admin/viajes/nuevo"
        size="sm"
        class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold"
        icon="i-heroicons-plus"
      >
        Publicar Viaje
      </UButton>
    </div>

    <UCard class="bg-[#1A1A22] border-[#2A2A38] text-center py-12">
      <div class="space-y-3">
        <UIcon name="i-heroicons-ticket" class="w-12 h-12 mx-auto text-zinc-600" />
        <h3 class="text-sm font-semibold text-zinc-300">Módulo en Desarrollo (Sprint 2)</h3>
        <p class="text-xs text-zinc-500 max-w-sm mx-auto">
          Aquí podrás gestionar la agenda de salidas, vincular recintos y flota, y actualizar precios rápidamente.
        </p>
      </div>
    </UCard>
  </div>
</template>
