<script setup lang="ts">
import type { EventWithRelations } from '~/composables/useEvents'

const props = defineProps<{
  open: boolean
  event: EventWithRelations | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const { updatePackageTiers, loading: submitting } = useEvents()

interface EditableTier {
  id: string
  name: string
  price: number
  is_available: boolean
  early_bird: boolean
  includes_ticket: boolean
}

const localTiers = ref<EditableTier[]>([])

// Sincronizar estado local al abrir el modal o cambiar de evento
watch(
  () => props.event,
  (ev) => {
    if (ev && ev.package_tiers) {
      localTiers.value = ev.package_tiers.map(t => ({
        id: t.id,
        name: t.name,
        price: Number(t.price) || 0,
        is_available: Boolean(t.is_available),
        early_bird: Boolean(t.early_bird),
        includes_ticket: Boolean(t.includes_ticket)
      }))
    } else {
      localTiers.value = []
    }
  },
  { immediate: true }
)

function adjustPrice(index: number, delta: number) {
  const current = localTiers.value[index]?.price || 0
  const updated = Math.max(0, current + delta)
  if (localTiers.value[index]) {
    localTiers.value[index].price = updated
  }
}

async function handleSave() {
  if (!props.event) return

  // Validación básica: los precios deben ser números válidos >= 0
  for (const t of localTiers.value) {
    if (isNaN(t.price) || t.price < 0) {
      toast.add({
        title: 'Precio inválido',
        description: `El precio para "${t.name}" no puede ser negativo o nulo.`,
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle'
      })
      return
    }
  }

  try {
    const payload = localTiers.value.map(t => ({
      id: t.id,
      price: Number(t.price),
      is_available: t.is_available,
      early_bird: t.early_bird
    }))

    const { error: err } = await updatePackageTiers(props.event.id, payload)
    if (err) throw err

    toast.add({
      title: '¡Tarifas actualizadas!',
      description: `Se actualizaron los precios para "${props.event.title}" en menos de 10s.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    emit('saved')
    emit('update:open', false)
  } catch (err: any) {
    toast.add({
      title: 'Error al actualizar',
      description: err?.message || 'No se pudieron guardar las tarifas',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    title="Ajuste Rápido de Tarifas & Pricing"
    description="Modificá importes de venta y disponibilidad directamente en vivo."
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="event" class="space-y-4 pt-1">
        <!-- Encabezado del Evento -->
        <div class="p-3 rounded-xl bg-[#14141A] border border-[#2A2A38] flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-xs font-bold text-[#F5EEDC] truncate">{{ event.title }}</p>
            <p class="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>{{ event.artist_headliner }}</span>
              <span v-if="event.venue">• {{ event.venue.name }}</span>
            </p>
          </div>
          <span class="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            {{ localTiers.length }} {{ localTiers.length === 1 ? 'tarifa' : 'tarifas' }}
          </span>
        </div>

        <!-- Lista de Tarifas Editables -->
        <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="(tier, idx) in localTiers"
            :key="tier.id"
            class="p-3.5 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-3 transition-colors hover:border-zinc-700"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <span class="text-xs font-bold text-[#F5EEDC]">{{ tier.name }}</span>
                <span
                  v-if="tier.includes_ticket"
                  class="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-red-950/60 text-[#E53924] border border-red-900/40"
                >
                  Con Entrada
                </span>
              </div>
            </div>

            <!-- Input de Precio con Presets Rápidos -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-400 mb-1">
                Precio de Venta (ARS)
              </label>
              <div class="flex items-center gap-1.5">
                <UInput
                  v-model.number="tier.price"
                  type="number"
                  min="0"
                  step="500"
                  icon="i-heroicons-currency-dollar"
                  class="w-full font-mono font-bold text-sm"
                  @keydown.enter.prevent="handleSave"
                />
                <button
                  type="button"
                  class="px-2 py-1.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
                  title="Restar $1.000"
                  @click="adjustPrice(idx, -1000)"
                >
                  -$1k
                </button>
                <button
                  type="button"
                  class="px-2 py-1.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
                  title="Sumar $1.000"
                  @click="adjustPrice(idx, 1000)"
                >
                  +$1k
                </button>
                <button
                  type="button"
                  class="px-2 py-1.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
                  title="Sumar $5.000"
                  @click="adjustPrice(idx, 5000)"
                >
                  +$5k
                </button>
              </div>
            </div>

            <!-- Switches de Estado y Preventa -->
            <div class="flex items-center gap-5 pt-1 text-xs">
              <label class="inline-flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  v-model="tier.is_available"
                  type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span class="text-[11px]" :class="tier.is_available ? 'text-emerald-400 font-semibold' : 'text-zinc-500'">
                  {{ tier.is_available ? 'Disponible' : 'Pausado' }}
                </span>
              </label>

              <label class="inline-flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  v-model="tier.early_bird"
                  type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span class="text-[11px]" :class="tier.early_bird ? 'text-amber-400 font-semibold' : 'text-zinc-500'">
                  Preventa (Early Bird)
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-between pt-3 border-t border-[#2A2A38]">
          <span class="text-[10px] text-zinc-500">
            Enter para guardar • Esc para salir
          </span>
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              class="cursor-pointer"
              @click="handleClose"
            >
              Cancelar
            </UButton>
            <UButton
              variant="solid"
              color="primary"
              size="xs"
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              icon="i-heroicons-check"
              :loading="submitting"
              @click="handleSave"
            >
              Guardar Tarifas (&lt; 10s)
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
