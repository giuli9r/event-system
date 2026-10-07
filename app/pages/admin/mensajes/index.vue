<script setup lang="ts">
import type { ContactMessage } from '~/composables/useContactMessages'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const {
  filteredMessages,
  unreadCount,
  loading,
  error,
  searchQuery,
  statusFilter,
  fetchMessages,
  updateMessageStatus,
  formatDate
} = useContactMessages()

// Carga inicial
onMounted(() => {
  fetchMessages()
})

// Modal / Visor de detalle de mensaje
const selectedMessage = ref<ContactMessage | null>(null)
const isDetailOpen = ref(false)

function openDetail(msg: ContactMessage) {
  selectedMessage.value = msg
  isDetailOpen.value = true

  // Si está como nuevo, marcarlo como leído automáticamente
  if (msg.status === 'nuevo') {
    updateMessageStatus(msg.id, 'leido')
  }
}

async function setStatus(msg: ContactMessage, newStatus: string) {
  await updateMessageStatus(msg.id, newStatus)
  if (selectedMessage.value && selectedMessage.value.id === msg.id) {
    selectedMessage.value.status = newStatus
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'nuevo':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'leido':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'respondido':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    case 'archivado':
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700'
  }
}

function getWhatsAppReplyUrl(msg: ContactMessage) {
  if (!msg.phone) return '#'
  const cleanPhone = msg.phone.replace(/[^\d]/g, '')
  const text = encodeURIComponent(
    `¡Hola ${msg.name}! 👋 Te escribimos desde Tripu Producciones respecto a tu consulta en la web sobre ${msg.selected_event || 'nuestros viajes a recitales'}.`
  )
  return `https://wa.me/${cleanPhone}?text=${text}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado del Módulo -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Bandeja de Consultas
          </h1>
          <span
            v-if="unreadCount > 0"
            class="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#E53924] text-white"
          >
            {{ unreadCount }} nuevas
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Mensajes y consultas recibidas a través del formulario público de la web.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1A1A22] border border-[#2A2A38] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
        :disabled="loading"
        @click="fetchMessages({ force: true })"
      >
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
        <span>Actualizar</span>
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="relative flex-1 w-full">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, email, teléfono, evento o mensaje..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14141B] border border-[#2A2A38] text-xs text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] transition-colors"
        />
      </div>

      <!-- Selector de Estados -->
      <div class="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <button
          v-for="st in [
            { id: 'all', label: 'Todos' },
            { id: 'nuevo', label: 'Nuevos' },
            { id: 'leido', label: 'Leídos' },
            { id: 'respondido', label: 'Respondidos' },
            { id: 'archivado', label: 'Archivados' }
          ]"
          :key="st.id"
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
          :class="statusFilter === st.id
            ? 'bg-[#E53924] text-white'
            : 'bg-[#14141B] text-zinc-400 hover:text-[#F5EEDC] border border-[#2A2A38]'"
          @click="statusFilter = st.id as any"
        >
          {{ st.label }}
        </button>
      </div>
    </div>

    <!-- TABLA DE MENSAJES -->
    <UCard class="bg-[#14141B] border-[#2A2A38] p-0 overflow-hidden shadow-xl">
      <div v-if="loading && filteredMessages.length === 0" class="p-12 text-center text-zinc-400 text-xs">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2 text-[#E53924]" />
        Cargando bandeja de consultas...
      </div>

      <div v-else-if="filteredMessages.length === 0" class="p-12 text-center space-y-2">
        <UIcon name="i-heroicons-inbox" class="w-10 h-10 text-zinc-600 mx-auto" />
        <p class="text-sm font-semibold text-zinc-300">No se encontraron consultas</p>
        <p class="text-xs text-zinc-500">
          {{ searchQuery ? 'Probá cambiando los términos de búsqueda o el filtro de estado.' : 'Aún no hay mensajes en esta bandeja.' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-[#2A2A38] bg-[#1A1A22]/60 text-zinc-400 uppercase tracking-wider font-bold">
              <th class="py-3.5 px-4">Estado</th>
              <th class="py-3.5 px-4">Remitente</th>
              <th class="py-3.5 px-4">Show / Evento</th>
              <th class="py-3.5 px-4">Mensaje</th>
              <th class="py-3.5 px-4">Fecha</th>
              <th class="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38]/50">
            <tr
              v-for="msg in filteredMessages"
              :key="msg.id"
              class="hover:bg-[#1A1A22]/40 transition-colors cursor-pointer"
              :class="msg.status === 'nuevo' ? 'bg-[#E53924]/5 font-semibold' : ''"
              @click="openDetail(msg)"
            >
              <!-- Estado -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                  :class="getStatusBadgeClass(msg.status)"
                >
                  {{ msg.status }}
                </span>
              </td>

              <!-- Remitente -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-[#F5EEDC]">{{ msg.name }}</div>
                <div class="text-[11px] text-zinc-400">{{ msg.email }}</div>
                <div v-if="msg.phone" class="text-[10px] text-zinc-500">Tel: {{ msg.phone }}</div>
              </td>

              <!-- Evento de Interés -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span v-if="msg.selected_event" class="text-zinc-300 font-medium">
                  {{ msg.selected_event }}
                </span>
                <span v-else class="text-zinc-500 italic">Consulta general</span>
              </td>

              <!-- Mensaje Resumido -->
              <td class="py-3.5 px-4 max-w-xs sm:max-w-md truncate text-zinc-300">
                {{ msg.message }}
              </td>

              <!-- Fecha -->
              <td class="py-3.5 px-4 whitespace-nowrap text-zinc-400">
                {{ formatDate(msg.created_at) }}
              </td>

              <!-- Acciones -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap" @click.stop>
                <div class="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg hover:bg-[#2A2A38] text-zinc-400 hover:text-[#F5EEDC] transition-colors"
                    title="Ver detalle"
                    @click="openDetail(msg)"
                  >
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                  </button>

                  <a
                    v-if="msg.phone"
                    :href="getWhatsAppReplyUrl(msg)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-1.5 rounded-lg hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                    title="Responder por WhatsApp"
                  >
                    <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4" />
                  </a>

                  <a
                    :href="`mailto:${msg.email}?subject=${encodeURIComponent(`Respuesta a tu consulta en Tripu - ${msg.selected_event || 'Viajes'}`)}`"
                    class="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                    title="Responder por Email"
                  >
                    <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- MODAL DETALLE DE CONSULTA -->
    <UModal v-model:open="isDetailOpen">
      <template #content>
        <div v-if="selectedMessage" class="p-6 bg-[#14141B] border border-[#2A2A38] rounded-2xl text-[#F5EEDC] space-y-5">
          <!-- Cabecera del Modal -->
          <div class="flex items-start justify-between pb-4 border-b border-[#2A2A38]">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#E53924]">Detalle de Consulta Web</span>
              <h2 class="text-xl font-black uppercase text-[#F5EEDC]">
                {{ selectedMessage.name }}
              </h2>
              <span class="text-xs text-zinc-400">Recibido el {{ formatDate(selectedMessage.created_at) }}</span>
            </div>
            <button
              type="button"
              class="text-zinc-400 hover:text-[#F5EEDC] p-1"
              @click="isDetailOpen = false"
            >
              <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
            </button>
          </div>

          <!-- Datos de Contacto -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#1A1A22] border border-[#2A2A38] text-xs">
            <div>
              <span class="text-zinc-500 block">Email:</span>
              <a :href="`mailto:${selectedMessage.email}`" class="text-[#FF6B55] hover:underline font-bold">
                {{ selectedMessage.email }}
              </a>
            </div>
            <div>
              <span class="text-zinc-500 block">Teléfono / WhatsApp:</span>
              <span class="text-[#F5EEDC] font-bold">
                {{ selectedMessage.phone || 'No especificado' }}
              </span>
            </div>
            <div class="sm:col-span-2">
              <span class="text-zinc-500 block">Show de interés:</span>
              <span class="text-emerald-400 font-bold">
                {{ selectedMessage.selected_event || 'Consulta general' }}
              </span>
            </div>
          </div>

          <!-- Mensaje Completo -->
          <div class="space-y-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Contenido del Mensaje:</span>
            <div class="p-4 rounded-xl bg-[#0F0F12] border border-[#2A2A38] text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
              {{ selectedMessage.message }}
            </div>
          </div>

          <!-- Gestión de Estados y Respuesta -->
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#2A2A38]">
            <div class="flex items-center gap-1.5 w-full sm:w-auto">
              <span class="text-[11px] font-bold text-zinc-400 mr-1">Marcar como:</span>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors"
                :class="selectedMessage.status === 'leido' ? 'bg-blue-600 text-white' : 'bg-[#1A1A22] text-zinc-400 border border-[#2A2A38]'"
                @click="setStatus(selectedMessage, 'leido')"
              >
                Leído
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors"
                :class="selectedMessage.status === 'respondido' ? 'bg-purple-600 text-white' : 'bg-[#1A1A22] text-zinc-400 border border-[#2A2A38]'"
                @click="setStatus(selectedMessage, 'respondido')"
              >
                Respondido
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors"
                :class="selectedMessage.status === 'archivado' ? 'bg-zinc-600 text-white' : 'bg-[#1A1A22] text-zinc-400 border border-[#2A2A38]'"
                @click="setStatus(selectedMessage, 'archivado')"
              >
                Archivar
              </button>
            </div>

            <!-- Botones de Acción de Respuesta -->
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                v-if="selectedMessage.phone"
                :href="getWhatsAppReplyUrl(selectedMessage)"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase bg-[#25D366] hover:bg-[#20ba5a] text-[#0F0F12] flex items-center gap-1.5 shadow-md shadow-[#25D366]/20 transition-all"
                @click="setStatus(selectedMessage, 'respondido')"
              >
                <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4 stroke-[2]" />
                <span>Responder por WhatsApp</span>
              </a>

              <a
                :href="`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Respuesta Tripu - ${selectedMessage.selected_event || 'Consulta'}`)}`"
                class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase bg-[#1A1A22] hover:bg-[#2A2A38] text-white border border-[#2A2A38] flex items-center gap-1.5 transition-colors"
                @click="setStatus(selectedMessage, 'respondido')"
              >
                <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
