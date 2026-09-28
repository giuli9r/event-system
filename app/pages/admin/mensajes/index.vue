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
          Bandeja de Consultas
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Mensajes recibidos a través del formulario de contacto web.
        </p>
      </div>
    </div>

    <UCard class="bg-[#1A1A22] border-[#2A2A38] text-center py-12">
      <div class="space-y-3">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 mx-auto text-zinc-600" />
        <h3 class="text-sm font-semibold text-zinc-300">Bandeja en Desarrollo (Sprint 5)</h3>
        <p class="text-xs text-zinc-500 max-w-sm mx-auto">
          Gestión de mensajes y consultas enviadas por usuarios desde la plataforma pública.
        </p>
      </div>
    </UCard>
  </div>
</template>
