<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: () => [],
    placeholder: 'Escribe un tag y presiona Enter o coma...',
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const currentInput = ref('')

const quickPresets = [
  'rock-nacional',
  'los-piojos',
  'los-redondos',
  'babasonicos',
  'rock',
  'indie',
  'pop',
  'electronica',
  'metal',
  'trap'
]

function cleanTag(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[:,]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-áéíóúñ]/g, '')
}

function addTag(raw: string) {
  const cleaned = cleanTag(raw)
  if (!cleaned) return

  const currentTags = [...props.modelValue]
  if (!currentTags.includes(cleaned)) {
    emit('update:modelValue', [...currentTags, cleaned])
  }
  currentInput.value = ''
}

function removeTag(index: number) {
  if (props.disabled) return
  const currentTags = [...props.modelValue]
  currentTags.splice(index, 1)
  emit('update:modelValue', currentTags)
}

function handleKeyDown(event: KeyboardEvent) {
  if (props.disabled) return

  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag(currentInput.value)
  } else if (event.key === 'Backspace' && !currentInput.value && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  }
}

function handleInput(event: Event) {
  const val = (event.target as HTMLInputElement).value
  if (val.includes(',')) {
    const parts = val.split(',')
    parts.forEach(p => {
      if (p.trim()) addTag(p)
    })
    currentInput.value = ''
  }
}

function handlePresetClick(preset: string) {
  if (props.disabled) return
  if (!props.modelValue.includes(preset)) {
    emit('update:modelValue', [...props.modelValue, preset])
  }
}
</script>

<template>
  <div class="space-y-2">
    <!-- Contenedor Principal de Tags e Input -->
    <div
      class="min-h-[46px] w-full rounded-lg bg-[#14141B] border border-[#2A2A38] focus-within:border-[#E53924] focus-within:ring-1 focus-within:ring-[#E53924] px-3 py-2 flex flex-wrap items-center gap-1.5 transition-colors"
      :class="{ 'opacity-60 cursor-not-allowed': disabled }"
      @click="inputRef?.focus()"
    >
      <!-- Tags existentes -->
      <span
        v-for="(tag, index) in modelValue"
        :key="tag + index"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E53924]/15 text-[#FF6B55] border border-[#E53924]/30 select-none transition-all hover:bg-[#E53924]/25"
      >
        <span class="text-[#E53924]/70">#</span>
        <span>{{ tag }}</span>
        <button
          v-if="!disabled"
          type="button"
          class="hover:text-white transition-colors focus:outline-none ml-0.5 rounded-full p-0.5"
          title="Eliminar tag"
          @click.stop="removeTag(index)"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3 block" />
        </button>
      </span>

      <!-- Input para escribir nuevos tags -->
      <input
        ref="inputRef"
        v-model="currentInput"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : 'Agregar otro tag...'"
        :disabled="disabled"
        class="flex-1 min-w-[140px] bg-transparent text-sm text-[#F5EEDC] placeholder:text-zinc-500 focus:outline-none border-none p-0 py-0.5"
        @keydown="handleKeyDown"
        @input="handleInput"
      />
    </div>

    <!-- Presets Rápidos de Géneros / Bandas -->
    <div v-if="!disabled" class="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span class="text-[11px] text-zinc-400 font-medium mr-1 flex items-center gap-1">
        <UIcon name="i-heroicons-sparkles" class="w-3 h-3 text-[#E53924]" />
        Sugeridos:
      </span>
      <button
        v-for="preset in quickPresets"
        :key="preset"
        type="button"
        class="text-[10.5px] px-2 py-0.5 rounded border transition-colors"
        :class="modelValue.includes(preset)
          ? 'bg-[#E53924]/20 border-[#E53924]/50 text-[#FF6B55]'
          : 'bg-[#1A1A22] border-[#2A2A38] text-zinc-400 hover:text-[#F5EEDC] hover:border-[#E53924]/40'"
        @click.prevent="handlePresetClick(preset)"
      >
        +{{ preset }}
      </button>
    </div>
  </div>
</template>
