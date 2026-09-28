<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>

<template>
  <div class="space-y-6">
    <div class="pb-4 border-b border-[#2A2A38]">
      <NuxtLink to="/admin/viajes" class="text-xs text-zinc-400 hover:text-[#E53924] flex items-center gap-1 mb-2">
        <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
        <span>Volver a salidas</span>
      </NuxtLink>
      <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
        Publicar Nuevo Viaje
      </h1>
      <p class="text-xs text-zinc-400 mt-1">
        Carga de flyer, selección de transporte, recinto e itinerario.
      </p>
    </div>

    <UCard class="bg-[#1A1A22] border-[#2A2A38] text-center py-12">
      <div class="space-y-3">
        <UIcon name="i-heroicons-document-plus" class="w-12 h-12 mx-auto text-zinc-600" />
        <h3 class="text-sm font-semibold text-zinc-300">Formulario en Desarrollo (Sprint 2 - US-05)</h3>
        <p class="text-xs text-zinc-500 max-w-sm mx-auto">
          Asistente de publicación de salidas con subida de afiches a Supabase Storage.
        </p>
      </div>
    </UCard>
  </div>
</template>
