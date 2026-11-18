<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  type MediaAsset,
  type AssetType,
  type ImageAnalysis,
  useMedia,
  analyzeImageFile,
  generateMediaFilename
} from '~/composables/useMedia'

const props = withDefaults(
  defineProps<{
    open: boolean
    targetType?: AssetType
    selectedUrl?: string
    title?: string
  }>(),
  {
    targetType: 'flyer',
    selectedUrl: '',
    title: 'Biblioteca de Flyers & Afiches Oficiales'
  }
)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'select', asset: MediaAsset): void
}>()

const toast = useToast()
const { mediaItems, loading, fetchMedia, uploadMedia, MAX_FILE_SIZE_BYTES } = useMedia()

// Modo de vista interna: 'browse' (explorar) o 'upload' (subir nuevo)
const activeTab = ref<'browse' | 'upload'>('browse')
const searchQuery = ref('')

// Estado para la subida rápida integrada
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const analysis = ref<ImageAnalysis | null>(null)
const analyzing = ref(false)
const uploading = ref(false)
const uploadName = ref('')
const uploadType = ref<AssetType>(props.targetType || 'flyer')

// Cargar medios al abrir el modal
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      activeTab.value = 'browse'
      uploadType.value = props.targetType || 'flyer'
      resetUploadForm()
      await fetchMedia({ type: props.targetType })
    }
  },
  { immediate: true }
)

// Filtrado de elementos
const filteredAssets = computed(() => {
  let list = mediaItems.value

  if (props.targetType) {
    list = list.filter(item => item.asset_type === props.targetType)
  }

  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.file_path.toLowerCase().includes(q)
    )
  }

  return list
})

// Vista previa del nombre formateado en tiempo real
const previewGeneratedFilename = computed(() => {
  if (!uploadName.value || !selectedFile.value) return ''
  return generateMediaFilename(uploadName.value, selectedFile.value.name)
})

function formatBytes(bytes: number | null): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function handleSelect(asset: MediaAsset) {
  emit('select', asset)
  emit('update:open', false)
}

// Métodos de Subida Rápida
async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  await processFile(file)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  processFile(file)
}

async function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    toast.add({
      title: 'Formato no soportado',
      description: 'Solo se permiten archivos de imagen (WebP, JPG, PNG, AVIF).',
      color: 'error'
    })
    return
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.add({
      title: 'Archivo demasiado pesado',
      description: 'El tamaño excede el límite máximo de 5 MB.',
      color: 'error'
    })
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  // Si el usuario aún no escribió un nombre, sugerir el nombre base del archivo sin extensión
  if (!uploadName.value) {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    uploadName.value = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  }

  analyzing.value = true
  try {
    analysis.value = await analyzeImageFile(file)
  } catch (err: any) {
    console.error('Error al analizar imagen:', err)
  } finally {
    analyzing.value = false
  }
}

function resetUploadForm() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = null
  previewUrl.value = null
  analysis.value = null
  uploadName.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function handleUploadAndSelect() {
  if (!selectedFile.value || !uploadName.value.trim()) {
    toast.add({
      title: 'Campos incompletos',
      description: 'Selecciona una imagen e ingresa un nombre para identificarla.',
      color: 'warning'
    })
    return
  }

  uploading.value = true
  try {
    const newAsset = await uploadMedia(selectedFile.value, {
      name: uploadName.value.trim(),
      assetType: uploadType.value
    })

    toast.add({
      title: '¡Flyer subido con éxito!',
      description: `Se almacenó como ${newAsset.file_path}`,
      color: 'success'
    })

    // Seleccionar automáticamente el flyer recién subido
    emit('select', newAsset)
    emit('update:open', false)
  } catch (err: any) {
    toast.add({
      title: 'Error de subida',
      description: err.message || 'No se pudo subir la imagen a Supabase Storage.',
      color: 'error'
    })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    description="Explorá el banco de imágenes oficial o subí un afiche nuevo directamente a Supabase Storage."
    class="max-w-4xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Switcher de Pestañas: Explorar vs Subir -->
        <div class="flex items-center justify-between border-b border-[#2A2A38] pb-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              :class="activeTab === 'browse'
                ? 'bg-[#E53924] text-white shadow-sm'
                : 'bg-[#1C1C24] text-zinc-400 hover:text-zinc-200 border border-[#2A2A38]'"
              @click="activeTab = 'browse'"
            >
              <UIcon name="i-heroicons-photo" class="w-4 h-4" />
              <span>Explorar Biblioteca</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-mono">
                {{ filteredAssets.length }}
              </span>
            </button>

            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              :class="activeTab === 'upload'
                ? 'bg-[#E53924] text-white shadow-sm'
                : 'bg-[#1C1C24] text-zinc-400 hover:text-zinc-200 border border-[#2A2A38]'"
              @click="activeTab = 'upload'"
            >
              <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
              <span>Subir Nuevo Flyer</span>
            </button>
          </div>

          <div v-if="activeTab === 'browse'" class="w-48 sm:w-64">
            <UInput
              v-model="searchQuery"
              placeholder="Buscar por nombre..."
              icon="i-heroicons-magnifying-glass"
              size="xs"
              class="w-full"
            />
          </div>
        </div>

        <!-- PESTAÑA 1: EXPLORAR BIBLIOTECA -->
        <div v-if="activeTab === 'browse'" class="space-y-3">
          <!-- Loading State -->
          <div v-if="loading && filteredAssets.length === 0" class="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[#E53924]" />
            <p class="text-xs">Cargando catálogo multimedia de Supabase...</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="filteredAssets.length === 0"
            class="py-12 px-4 rounded-xl border border-dashed border-[#2A2A38] text-center space-y-3 bg-[#14141A]/50"
          >
            <div class="w-12 h-12 mx-auto rounded-full bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-zinc-500">
              <UIcon name="i-heroicons-photo" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-sm font-bold text-[#F5EEDC]">No hay imágenes disponibles</p>
              <p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {{ searchQuery ? 'No se encontraron afiches que coincidan con la búsqueda.' : 'Aún no has subido afiches a la biblioteca oficial.' }}
              </p>
            </div>
            <UButton
              size="xs"
              color="primary"
              variant="solid"
              icon="i-heroicons-arrow-up-tray"
              class="cursor-pointer"
              @click="activeTab = 'upload'"
            >
              Subir el primer flyer
            </UButton>
          </div>

          <!-- Grilla de Imágenes -->
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto pr-1"
          >
            <div
              v-for="asset in filteredAssets"
              :key="asset.id"
              class="group relative rounded-xl overflow-hidden border transition-all cursor-pointer bg-[#14141A] flex flex-col"
              :class="asset.public_url === selectedUrl
                ? 'border-[#E53924] ring-2 ring-[#E53924]/40 shadow-lg shadow-[#E53924]/10'
                : 'border-[#2A2A38] hover:border-zinc-500 hover:shadow-md'"
              @click="handleSelect(asset)"
            >
              <!-- Contenedor de la Imagen con proporción 4:5 para afiches -->
              <div class="relative w-full aspect-[4/5] bg-[#0F0F12] overflow-hidden">
                <img
                  :src="asset.public_url"
                  :alt="asset.name"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <!-- Badge de Seleccionado Actual -->
                <div
                  v-if="asset.public_url === selectedUrl"
                  class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#E53924] text-white text-[10px] font-bold flex items-center gap-1 shadow"
                >
                  <UIcon name="i-heroicons-check" class="w-3 h-3" />
                  <span>En uso</span>
                </div>

                <!-- Overlay con dimensiones y peso al hacer hover -->
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-[10px] text-zinc-300">
                  <span v-if="asset.width && asset.height" class="font-mono text-white font-semibold">
                    {{ asset.width }} × {{ asset.height }} px
                  </span>
                  <span class="text-zinc-400">{{ formatBytes(asset.file_size_bytes) }}</span>
                  <span class="text-[#E53924] font-bold mt-1">Click para seleccionar</span>
                </div>
              </div>

              <!-- Pie de la tarjeta -->
              <div class="p-2 min-w-0 flex-1 flex flex-col justify-between">
                <p class="text-xs font-bold text-[#F5EEDC] truncate group-hover:text-white" :title="asset.name">
                  {{ asset.name }}
                </p>
                <div class="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                  <span class="capitalize">{{ asset.asset_type }}</span>
                  <span>{{ formatBytes(asset.file_size_bytes) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 2: SUBIR NUEVO FLYER -->
        <div v-else class="space-y-4">
          <!-- Zona de Drag & Drop -->
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer bg-[#14141A]/50 relative"
            :class="selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-[#2A2A38] hover:border-zinc-500'"
            @dragover.prevent
            @drop="onDrop"
            @click="fileInputRef?.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/webp,image/jpeg,image/png,image/avif"
              class="hidden"
              @change="onFileSelected"
            />

            <!-- Preview Si Ya Eligió Archivo -->
            <div v-if="selectedFile && previewUrl" class="flex flex-col sm:flex-row items-center gap-4 text-left">
              <div class="w-24 h-32 rounded-lg overflow-hidden border border-[#2A2A38] bg-[#0F0F12] shrink-0 shadow">
                <img :src="previewUrl" alt="Previsualización" class="w-full h-full object-cover" />
              </div>
              <div class="space-y-1.5 flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Archivo Cargado
                  </span>
                  <span class="text-xs font-mono text-zinc-400 truncate">{{ selectedFile.name }}</span>
                </div>

                <!-- Análisis de Dimensiones y Peso -->
                <div v-if="analysis" class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div class="p-2 rounded bg-[#1C1C24] border border-[#2A2A38]">
                    <span class="text-[10px] text-zinc-500 block">Resolución</span>
                    <span class="font-mono font-bold text-[#F5EEDC]">{{ analysis.width }} × {{ analysis.height }} px</span>
                  </div>
                  <div class="p-2 rounded bg-[#1C1C24] border border-[#2A2A38]">
                    <span class="text-[10px] text-zinc-500 block">Peso</span>
                    <span class="font-mono font-bold" :class="analysis.isOverWeightWarning ? 'text-amber-400' : 'text-emerald-400'">
                      {{ formatBytes(analysis.sizeBytes) }}
                    </span>
                  </div>
                  <div class="p-2 rounded bg-[#1C1C24] border border-[#2A2A38] col-span-2 sm:col-span-1">
                    <span class="text-[10px] text-zinc-500 block">Proporción</span>
                    <span
                      class="font-semibold text-[11px]"
                      :class="analysis.isOptimalFlyerRatio ? 'text-emerald-400' : 'text-amber-400'"
                    >
                      {{ analysis.isOptimalFlyerRatio ? '✓ Óptima 4:5 (Vertical)' : 'No estándar (se recortará)' }}
                    </span>
                  </div>
                </div>

                <!-- Advertencias ergonómicas -->
                <p v-if="analysis?.isOverWeightWarning" class="text-[11px] text-amber-400/90 flex items-center gap-1">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 shrink-0" />
                  <span>Pesa más de 1.5 MB. Te sugerimos exportar en WebP para máxima velocidad.</span>
                </p>
                <p class="text-[10px] text-zinc-500">
                  Haz click para elegir otra imagen.
                </p>
              </div>
            </div>

            <!-- Placeholder Inicial -->
            <div v-else class="space-y-2 py-4">
              <div class="w-12 h-12 mx-auto rounded-full bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-[#E53924]">
                <UIcon name="i-heroicons-arrow-up-tray" class="w-6 h-6" />
              </div>
              <p class="text-sm font-bold text-[#F5EEDC]">
                Arrastrá tu afiche aquí o hacé click para explorar
              </p>
              <p class="text-xs text-zinc-400 max-w-sm mx-auto">
                Soporta WebP, JPG o PNG. Tamaño máximo 5 MB.
              </p>
              <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#1C1C24] border border-[#2A2A38] text-[11px] text-zinc-400 mt-2">
                <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5 text-[#E53924]" />
                <span>Recomendado para flyers: <strong>Proporción 4:5</strong> (Ej: 1080×1350 px o 800×1000 px)</span>
              </div>
            </div>
          </div>

          <!-- Campos del Formulario de Subida -->
          <div class="space-y-3 p-4 rounded-xl bg-[#14141A] border border-[#2A2A38]">
            <UFormField label="Nombre Descriptivo del Flyer / Recital" required help="Ej: Duki River Plate 2026, Los Piojos La Plata">
              <UInput
                v-model="uploadName"
                placeholder="Nombre para identificar el afiche..."
                icon="i-heroicons-tag"
                class="w-full"
              />
            </UFormField>

            <!-- Previsualización del archivo generado con la convención -->
            <div v-if="previewGeneratedFilename" class="p-2.5 rounded-lg bg-[#0F0F12] border border-[#2A2A38] flex items-center gap-2">
              <UIcon name="i-heroicons-document-check" class="w-4 h-4 text-emerald-400 shrink-0" />
              <div class="min-w-0 text-xs">
                <span class="text-zinc-500 block text-[10px]">Ruta normalizada en Supabase Storage:</span>
                <span class="font-mono text-emerald-400 font-semibold truncate block">
                  flyers/{{ previewGeneratedFilename }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                class="cursor-pointer"
                @click="resetUploadForm(); activeTab = 'browse'"
              >
                Cancelar
              </UButton>
              <UButton
                size="sm"
                color="primary"
                variant="solid"
                icon="i-heroicons-cloud-arrow-up"
                :loading="uploading"
                :disabled="!selectedFile || !uploadName.trim()"
                class="cursor-pointer font-bold"
                @click="handleUploadAndSelect"
              >
                Subir y Asignar a este Viaje
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
