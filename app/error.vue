<script setup lang="ts">
import type { NuxtError } from '#app'

interface Props {
  error: NuxtError
}

const props = defineProps<Props>()

const is404 = computed(() => props.error?.statusCode === 404)

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] flex items-center justify-center p-4 sm:p-6 selection:bg-[#E53924] selection:text-white">
    <div class="max-w-xl w-full text-center space-y-8">
      <!-- Icono y Código de Estado -->
      <div class="space-y-4">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#14141B] border border-[#2A2A38] shadow-2xl text-[#E53924] mx-auto">
          <UIcon
            :name="is404 ? 'i-heroicons-map-pin' : 'i-heroicons-exclamation-triangle'"
            class="w-10 h-10"
          />
        </div>
        <div>
          <span class="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-[#E53924] block drop-shadow-sm">
            {{ error?.statusCode || 500 }}
          </span>
          <h1 class="text-2xl sm:text-3xl font-black uppercase text-[#F5EEDC] tracking-tight mt-2">
            {{ is404 ? 'Viaje o Página No Encontrada' : 'Ocurrió un error inesperado' }}
          </h1>
        </div>
      </div>

      <!-- Descripción -->
      <p class="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
        <template v-if="is404">
          La ruta que buscás no existe o el viaje fue reprogramado. Podés regresar a la cartelera oficial para explorar todos los recitales disponibles.
        </template>
        <template v-else>
          {{ error?.message || 'Se produjo una falla momentánea al procesar la solicitud. Nuestro equipo técnico fue notificado.' }}
        </template>
      </p>

      <!-- Botones de Acción -->
      <div class="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          class="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#E53924] hover:bg-[#d0301d] text-white shadow-xl shadow-[#E53924]/20 transition-all active:scale-95 cursor-pointer"
          @click="handleError"
        >
          Volver a la Cartelera
        </button>

        <NuxtLink
          to="/contacto"
          class="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#14141B] hover:bg-[#1A1A22] text-[#F5EEDC] border border-[#2A2A38] hover:border-[#E53924]/50 transition-all"
        >
          Contactar a Tripu
        </NuxtLink>
      </div>

      <!-- Footer de Marca -->
      <div class="pt-8 border-t border-[#1A1A22] text-xs text-zinc-600 font-mono">
        Tripu Producciones • El viaje es parte de la experiencia
      </div>
    </div>
  </div>
</template>
