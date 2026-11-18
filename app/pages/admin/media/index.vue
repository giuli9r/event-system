<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  type MediaAsset,
  type AssetType,
  type ImageAnalysis,
  useMedia,
  analyzeImageFile,
  generateMediaFilename,
  getFolderForAssetType
} from '~/composables/useMedia'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Gestión de Multimedia & Storage | Tripu Admin'
})

const toast = useToast()
const {
  mediaItems,
  loading,
  error,
  fetchMedia,
  uploadMedia,
  deleteMedia,
  MAX_FILE_SIZE_BYTES
} = useMedia()

// Filtros y Búsqueda
const searchQuery = ref('')
const selectedTypeFilter = ref<'all' | AssetType>('all')

// Estado del Modal de Subida
const isUploadModalOpen = ref(false)
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const analysis = ref<ImageAnalysis | null>(null)
const analyzing = ref(false)

const uploadForm = reactive<{
  name: string
  assetType: AssetType
}>({
  name: '',
  assetType: 'flyer'
})

// Estado del Modal de Detalle / Inspección
const isDetailModalOpen = ref(false)
const selectedAssetForDetail = ref<MediaAsset | null>(null)

// Estado del Modal de Eliminación
const isDeleteModalOpen = ref(false)
const assetToDelete = ref<MediaAsset | null>(null)
const deleting = ref(false)

// Opciones de tipo para el filtro y para el formulario
const filterOptions: { label: string; value: 'all' | AssetType; icon: string }[] = [
  { label: 'Todos los Archivos', value: 'all', icon: 'i-heroicons-rectangle-stack' },
  { label: 'Flyers de Viajes', value: 'flyer', icon: 'i-heroicons-ticket' },
  { label: 'Merchandise', value: 'merch', icon: 'i-heroicons-shopping-bag' },
  { label: 'Recintos & Sedes', value: 'venue', icon: 'i-heroicons-building-office-2' },
  { label: 'Banners & General', value: 'general', icon: 'i-heroicons-photo' }
]

const formTypeOptions: { label: string; value: AssetType; desc: string; ratioHint: string }[] = [
  {
    label: 'Flyer Oficial de Viaje / Recital',
    value: 'flyer',
    desc: 'Afiches de recitales para portada y ficha pública.',
    ratioHint: 'Recomendado: Proporción 4:5 (Ej: 1080×1350 px o 800×1000 px)'
  },
  {
    label: 'Catálogo de Merchandise',
    value: 'merch',
    desc: 'Fotografías de remeras, gorras, calcos y combos.',
    ratioHint: 'Recomendado: Proporción cuadrada 1:1 (Ej: 1000×1000 px o 800×800 px)'
  },
  {
    label: 'Recinto / Estadio',
    value: 'venue',
    desc: 'Fotografías de estadios, anfiteatros o sedes.',
    ratioHint: 'Recomendado: Panorámico 16:9 (Ej: 1920×1080 px)'
  },
  {
    label: 'Banner & Gráfica General',
    value: 'general',
    desc: 'Imágenes institucionales, contingentes y banners.',
    ratioHint: 'Resolución libre (hasta 5 MB)'
  }
]

onMounted(async () => {
  await fetchMedia()
})

// Filtrado reactivo de assets
const filteredAssets = computed(() => {
  let list = mediaItems.value

  if (selectedTypeFilter.value !== 'all') {
    list = list.filter(item => item.asset_type === selectedTypeFilter.value)
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

// Métricas de Telemetría
const totalAssetsCount = computed(() => mediaItems.value.length)
const totalFlyersCount = computed(() => mediaItems.value.filter(i => i.asset_type === 'flyer').length)
const totalMerchCount = computed(() => mediaItems.value.filter(i => i.asset_type === 'merch').length)
const totalStorageBytes = computed(() =>
  mediaItems.value.reduce((acc, item) => acc + (item.file_size_bytes || 0), 0)
)

function formatBytes(bytes: number | null): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '-'
  const d = new Date(isoDate)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Vista previa del nombre formateado en tiempo real
const generatedFilenamePreview = computed(() => {
  if (!uploadForm.name || !selectedFile.value) return ''
  const folder = getFolderForAssetType(uploadForm.assetType)
  const filename = generateMediaFilename(uploadForm.name, selectedFile.value.name)
  return `${folder}/${filename}`
})

// Copiar URL al portapapeles
async function copyToClipboard(url: string, name: string) {
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      title: 'URL Copiada al portapapeles',
      description: `Enlace directo de "${name}" listo para compartir.`,
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: 'Error al copiar',
      description: 'No se pudo acceder al portapapeles.',
      color: 'error'
    })
  }
}

// Métodos de Subida
function openUploadModal() {
  resetUploadForm()
  isUploadModalOpen.value = true
}

function resetUploadForm() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = null
  previewUrl.value = null
  analysis.value = null
  uploadForm.name = ''
  uploadForm.assetType = selectedTypeFilter.value !== 'all' ? selectedTypeFilter.value : 'flyer'
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  await processSelectedFile(file)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  processSelectedFile(file)
}

async function processSelectedFile(file: File) {
  if (!file.type.startsWith('image/')) {
    toast.add({
      title: 'Formato no soportado',
      description: 'Solo se permiten imágenes (WebP, JPG, PNG, AVIF).',
      color: 'error'
    })
    return
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.add({
      title: 'Archivo demasiado pesado',
      description: 'El tamaño excede el límite máximo permitido de 5 MB.',
      color: 'error'
    })
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  // Autocompletar nombre sugerido si está vacío
  if (!uploadForm.name) {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    uploadForm.name = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  }

  analyzing.value = true
  try {
    analysis.value = await analyzeImageFile(file)
  } catch (err: any) {
    console.error('Error al analizar archivo:', err)
  } finally {
    analyzing.value = false
  }
}

async function handleUploadSubmit() {
  if (!selectedFile.value || !uploadForm.name.trim()) {
    toast.add({
      title: 'Campos requeridos',
      description: 'Selecciona una imagen e ingresa un nombre para identificarla.',
      color: 'warning'
    })
    return
  }

  uploading.value = true
  try {
    const createdAsset = await uploadMedia(selectedFile.value, {
      name: uploadForm.name.trim(),
      assetType: uploadForm.assetType
    })

    toast.add({
      title: '¡Imagen almacenada con éxito!',
      description: `Guardada en Supabase Storage como ${createdAsset.file_path}`,
      color: 'success'
    })

    isUploadModalOpen.value = false
    resetUploadForm()
  } catch (err: any) {
    toast.add({
      title: 'Error de almacenamiento',
      description: err.message || 'No se pudo subir la imagen a Supabase.',
      color: 'error'
    })
  } finally {
    uploading.value = false
  }
}

// Métodos de Inspección / Detalle
function openDetailModal(asset: MediaAsset) {
  selectedAssetForDetail.value = asset
  isDetailModalOpen.value = true
}

// Métodos de Eliminación
function confirmDelete(asset: MediaAsset) {
  assetToDelete.value = asset
  isDeleteModalOpen.value = true
}

async function handleDeleteAsset() {
  if (!assetToDelete.value) return

  deleting.value = true
  try {
    await deleteMedia(assetToDelete.value.id, assetToDelete.value.file_path)
    toast.add({
      title: 'Imagen eliminada',
      description: `Se eliminó el archivo físico y el registro de "${assetToDelete.value.name}".`,
      color: 'success'
    })
    isDeleteModalOpen.value = false
    assetToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al eliminar',
      description: err.message || 'No se pudo eliminar el archivo multimedia.',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

function getBadgeForType(type: AssetType) {
  switch (type) {
    case 'flyer':
      return { label: 'Flyer Oficial', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
    case 'merch':
      return { label: 'Merchandise', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
    case 'venue':
      return { label: 'Recinto', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
    default:
      return { label: 'General', class: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- ENCABEZADO PRINCIPAL -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-black tracking-tight text-[#F5EEDC]">
            Gestión Multimedia & Storage
          </h1>
          <UBadge color="primary" variant="subtle" size="sm" class="font-mono text-[10px]">
            tripu-assets
          </UBadge>
        </div>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1">
          Almacenamiento oficial en Supabase Storage para afiches de recitales, catálogo de merchandising y banco institucional.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          class="cursor-pointer"
          title="Refrescar catálogo"
          @click="fetchMedia({ force: true })"
        />
        <UButton
          size="sm"
          color="primary"
          variant="solid"
          icon="i-heroicons-cloud-arrow-up"
          class="cursor-pointer font-bold shadow-md shadow-[#E53924]/20"
          @click="openUploadModal"
        >
          Subir Nueva Imagen
        </UButton>
      </div>
    </div>

    <!-- TARJETAS DE TELEMETRÍA OPERATIVA -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total Archivos -->
      <div class="p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-1">
        <div class="flex items-center justify-between text-zinc-400">
          <span class="text-xs font-semibold">Total de Archivos</span>
          <UIcon name="i-heroicons-photo" class="w-4 h-4 text-[#E53924]" />
        </div>
        <div class="text-2xl font-black text-[#F5EEDC]">
          {{ totalAssetsCount }}
        </div>
        <div class="text-[11px] text-zinc-500">
          En bucket activo
        </div>
      </div>

      <!-- Flyers de Viajes -->
      <div class="p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-1">
        <div class="flex items-center justify-between text-zinc-400">
          <span class="text-xs font-semibold">Flyers de Viajes</span>
          <UIcon name="i-heroicons-ticket" class="w-4 h-4 text-blue-400" />
        </div>
        <div class="text-2xl font-black text-blue-400">
          {{ totalFlyersCount }}
        </div>
        <div class="text-[11px] text-zinc-500">
          Carpeta /flyers
        </div>
      </div>

      <!-- Fotos de Merchandising -->
      <div class="p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-1">
        <div class="flex items-center justify-between text-zinc-400">
          <span class="text-xs font-semibold">Fotos de Merch</span>
          <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 text-purple-400" />
        </div>
        <div class="text-2xl font-black text-purple-400">
          {{ totalMerchCount }}
        </div>
        <div class="text-[11px] text-zinc-500">
          Carpeta /merch
        </div>
      </div>

      <!-- Espacio Total Utilizado -->
      <div class="p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] space-y-1">
        <div class="flex items-center justify-between text-zinc-400">
          <span class="text-xs font-semibold">Espacio Utilizado</span>
          <UIcon name="i-heroicons-server" class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-2xl font-black text-emerald-400 font-mono">
          {{ formatBytes(totalStorageBytes) }}
        </div>
        <div class="text-[11px] text-zinc-500">
          Cuota gratuita: 1 GB
        </div>
      </div>
    </div>

    <!-- BARRA DE FILTROS Y BÚSQUEDA -->
    <div class="p-3 sm:p-4 rounded-xl bg-[#14141A] border border-[#2A2A38] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Pestañas de Filtro -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer"
          :class="selectedTypeFilter === opt.value
            ? 'bg-[#E53924] text-white shadow-sm'
            : 'bg-[#1C1C24] text-zinc-400 hover:text-zinc-200 border border-[#2A2A38]'"
          @click="selectedTypeFilter = opt.value"
        >
          <UIcon :name="opt.icon" class="w-3.5 h-3.5" />
          <span>{{ opt.label }}</span>
        </button>
      </div>

      <!-- Buscador -->
      <div class="w-full sm:w-72 shrink-0">
        <UInput
          v-model="searchQuery"
          placeholder="Buscar imagen o ruta..."
          icon="i-heroicons-magnifying-glass"
          size="sm"
          class="w-full"
        />
      </div>
    </div>

    <!-- ESTADO DE CARGA -->
    <div v-if="loading && mediaItems.length === 0" class="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[#E53924]" />
      <p class="text-sm font-medium">Conectando con Supabase Storage...</p>
    </div>

    <!-- ESTADO VACÍO -->
    <div
      v-else-if="filteredAssets.length === 0"
      class="py-16 px-4 rounded-2xl border border-dashed border-[#2A2A38] text-center space-y-4 bg-[#14141A]/50"
    >
      <div class="w-14 h-14 mx-auto rounded-full bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-[#E53924]">
        <UIcon name="i-heroicons-photo" class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-base font-bold text-[#F5EEDC]">No hay imágenes registradas</h3>
        <p class="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          {{ searchQuery ? 'No encontramos activos multimedia que coincidan con la búsqueda.' : 'Aún no se han subido imágenes en esta categoría. Podés subir afiches o fotos del catálogo oficial.' }}
        </p>
      </div>
      <UButton
        size="sm"
        color="primary"
        variant="solid"
        icon="i-heroicons-cloud-arrow-up"
        class="cursor-pointer font-bold"
        @click="openUploadModal"
      >
        Subir Primera Imagen
      </UButton>
    </div>

    <!-- GRILLA MULTIMEDIA -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      <div
        v-for="asset in filteredAssets"
        :key="asset.id"
        class="group rounded-xl overflow-hidden border border-[#2A2A38] bg-[#14141A] transition-all hover:border-zinc-500 hover:shadow-lg flex flex-col"
      >
        <!-- Contenedor Visual de la Imagen -->
        <div class="relative w-full aspect-[4/5] bg-[#0F0F12] overflow-hidden cursor-pointer" @click="openDetailModal(asset)">
          <img
            :src="asset.public_url"
            :alt="asset.name"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <!-- Badge de Tipo Superior -->
          <div class="absolute top-2 left-2">
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md shadow-sm"
              :class="getBadgeForType(asset.asset_type).class"
            >
              {{ getBadgeForType(asset.asset_type).label }}
            </span>
          </div>

          <!-- Overlay de Hover con Acciones Rápidas -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
            <div class="flex justify-end">
              <span class="px-1.5 py-0.5 rounded bg-black/70 text-zinc-300 font-mono text-[10px]">
                {{ formatBytes(asset.file_size_bytes) }}
              </span>
            </div>

            <div class="space-y-1 text-center">
              <span v-if="asset.width && asset.height" class="block font-mono text-xs text-white font-bold">
                {{ asset.width }} × {{ asset.height }} px
              </span>
              <span class="text-[10px] text-zinc-300 block">Click para ver detalle</span>
            </div>

            <div class="flex items-center justify-center gap-1.5 pt-1" @click.stop>
              <button
                type="button"
                class="p-1.5 rounded-lg bg-[#1C1C24] text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shadow"
                title="Copiar URL directa"
                @click="copyToClipboard(asset.public_url, asset.name)"
              >
                <UIcon name="i-heroicons-link" class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 rounded-lg bg-[#1C1C24] text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer shadow"
                title="Eliminar de Storage"
                @click="confirmDelete(asset)"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Información de la Tarjeta -->
        <div class="p-2.5 flex-1 flex flex-col justify-between border-t border-[#2A2A38]/60">
          <div>
            <p class="text-xs font-bold text-[#F5EEDC] truncate" :title="asset.name">
              {{ asset.name }}
            </p>
            <p class="text-[10px] font-mono text-zinc-500 truncate mt-0.5" :title="asset.file_path">
              {{ asset.file_path }}
            </p>
          </div>

          <div class="flex items-center justify-between text-[10px] text-zinc-400 pt-2 mt-1 border-t border-[#2A2A38]/40">
            <span>{{ formatDate(asset.created_at) }}</span>
            <button
              type="button"
              class="text-xs text-[#E53924] hover:underline font-semibold cursor-pointer"
              @click="copyToClipboard(asset.public_url, asset.name)"
            >
              Copiar URL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE SUBIDA DE IMAGEN -->
    <UModal
      :open="isUploadModalOpen"
      title="Subir Activo a Supabase Storage"
      description="Seleccioná el archivo, asigná un nombre y se aplicará la convención de nomenclatura automáticamente."
      class="max-w-2xl"
      @update:open="isUploadModalOpen = $event"
    >
      <template #body>
        <div class="space-y-4">
          <!-- 1. Selección de Categoría / Tipo -->
          <div>
            <label class="block text-xs font-bold text-zinc-300 mb-1.5">
              Tipo de Activo Multimedia
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="opt in formTypeOptions"
                :key="opt.value"
                type="button"
                class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                :class="uploadForm.assetType === opt.value
                  ? 'bg-[#E53924]/10 border-[#E53924] ring-1 ring-[#E53924]'
                  : 'bg-[#14141A] border-[#2A2A38] hover:border-zinc-500'"
                @click="uploadForm.assetType = opt.value"
              >
                <div>
                  <p class="text-xs font-bold" :class="uploadForm.assetType === opt.value ? 'text-[#E53924]' : 'text-[#F5EEDC]'">
                    {{ opt.label }}
                  </p>
                  <p class="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    {{ opt.desc }}
                  </p>
                </div>
                <span class="text-[9px] font-semibold text-zinc-500 block mt-2">
                  {{ opt.ratioHint }}
                </span>
              </button>
            </div>
          </div>

          <!-- 2. Área de Drag & Drop -->
          <div
            class="border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer bg-[#14141A]/50 relative"
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
                    Imagen Lista
                  </span>
                  <span class="text-xs font-mono text-zinc-400 truncate">{{ selectedFile.name }}</span>
                </div>

                <!-- Análisis Técnico -->
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
                      v-if="uploadForm.assetType === 'flyer'"
                      class="font-semibold text-[11px]"
                      :class="analysis.isOptimalFlyerRatio ? 'text-emerald-400' : 'text-amber-400'"
                    >
                      {{ analysis.isOptimalFlyerRatio ? '✓ Óptima 4:5' : 'No estándar 4:5' }}
                    </span>
                    <span
                      v-else-if="uploadForm.assetType === 'merch'"
                      class="font-semibold text-[11px]"
                      :class="analysis.isOptimalMerchRatio ? 'text-emerald-400' : 'text-amber-400'"
                    >
                      {{ analysis.isOptimalMerchRatio ? '✓ Óptima 1:1' : 'No estándar 1:1' }}
                    </span>
                    <span v-else class="font-semibold text-[11px] text-zinc-400">
                      Libre
                    </span>
                  </div>
                </div>

                <p v-if="analysis?.isOverWeightWarning" class="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 shrink-0" />
                  <span>Pesa más de 1.5 MB. Te recomendamos comprimirla a formato WebP.</span>
                </p>
                <p class="text-[10px] text-zinc-500">
                  Hacé click para reemplazar el archivo seleccionado.
                </p>
              </div>
            </div>

            <!-- Placeholder Inicial -->
            <div v-else class="space-y-2 py-4">
              <div class="w-12 h-12 mx-auto rounded-full bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-[#E53924]">
                <UIcon name="i-heroicons-arrow-up-tray" class="w-6 h-6" />
              </div>
              <p class="text-sm font-bold text-[#F5EEDC]">
                Arrastrá tu archivo de imagen aquí o hacé click para explorar
              </p>
              <p class="text-xs text-zinc-400 max-w-sm mx-auto">
                Formatos permitidos: WebP, JPG, PNG, AVIF. Peso máximo: 5 MB.
              </p>
            </div>
          </div>

          <!-- 3. Formulario de Nombre y Nomenclatura -->
          <div class="space-y-3 p-4 rounded-xl bg-[#14141A] border border-[#2A2A38]">
            <UFormField
              label="Nombre Descriptivo de la Imagen"
              required
              help="Se usará para generar la URL limpia y para buscarla en el panel."
            >
              <UInput
                v-model="uploadForm.name"
                placeholder="Ej: Duki Estadio River Plate 2026, Remera Oficial Negra..."
                icon="i-heroicons-tag"
                class="w-full"
              />
            </UFormField>

            <!-- Previsualización del archivo generado con la convención -->
            <div v-if="generatedFilenamePreview" class="p-2.5 rounded-lg bg-[#0F0F12] border border-[#2A2A38] flex items-center gap-2">
              <UIcon name="i-heroicons-document-check" class="w-4 h-4 text-emerald-400 shrink-0" />
              <div class="min-w-0 text-xs">
                <span class="text-zinc-500 block text-[10px]">Ruta normalizada en Supabase Storage:</span>
                <span class="font-mono text-emerald-400 font-semibold truncate block">
                  {{ generatedFilenamePreview }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#2A2A38]">
              <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                class="cursor-pointer"
                @click="isUploadModalOpen = false"
              >
                Cancelar
              </UButton>
              <UButton
                size="sm"
                color="primary"
                variant="solid"
                icon="i-heroicons-cloud-arrow-up"
                :loading="uploading"
                :disabled="!selectedFile || !uploadForm.name.trim()"
                class="cursor-pointer font-bold"
                @click="handleUploadSubmit"
              >
                Subir a Storage
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL DE INSPECCIÓN / DETALLE -->
    <UModal
      :open="isDetailModalOpen"
      :title="selectedAssetForDetail?.name || 'Detalles de la Imagen'"
      description="Metadatos técnicos y previsualización completa en alta resolución."
      class="max-w-3xl"
      @update:open="isDetailModalOpen = $event"
    >
      <template #body>
        <div v-if="selectedAssetForDetail" class="space-y-4">
          <!-- Vista ampliada -->
          <div class="max-h-[50vh] rounded-xl overflow-hidden border border-[#2A2A38] bg-[#0F0F12] flex items-center justify-center p-2">
            <img
              :src="selectedAssetForDetail.public_url"
              :alt="selectedAssetForDetail.name"
              class="max-h-[46vh] max-w-full object-contain rounded-lg"
            />
          </div>

          <!-- Fila de Metadatos -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div class="p-2.5 rounded-lg bg-[#14141A] border border-[#2A2A38]">
              <span class="text-[10px] text-zinc-500 block">Tipo de Activo</span>
              <span class="font-bold text-[#F5EEDC] capitalize">{{ selectedAssetForDetail.asset_type }}</span>
            </div>
            <div class="p-2.5 rounded-lg bg-[#14141A] border border-[#2A2A38]">
              <span class="text-[10px] text-zinc-500 block">Resolución</span>
              <span class="font-mono font-bold text-[#F5EEDC]">
                {{ selectedAssetForDetail.width }} × {{ selectedAssetForDetail.height }} px
              </span>
            </div>
            <div class="p-2.5 rounded-lg bg-[#14141A] border border-[#2A2A38]">
              <span class="text-[10px] text-zinc-500 block">Peso</span>
              <span class="font-mono font-bold text-emerald-400">
                {{ formatBytes(selectedAssetForDetail.file_size_bytes) }}
              </span>
            </div>
            <div class="p-2.5 rounded-lg bg-[#14141A] border border-[#2A2A38]">
              <span class="text-[10px] text-zinc-500 block">Fecha de Subida</span>
              <span class="font-bold text-[#F5EEDC]">
                {{ formatDate(selectedAssetForDetail.created_at) }}
              </span>
            </div>
          </div>

          <!-- Ruta y URL -->
          <div class="space-y-2 p-3 rounded-lg bg-[#14141A] border border-[#2A2A38] text-xs">
            <div>
              <span class="text-[10px] text-zinc-500 block">Ruta en Supabase Storage:</span>
              <span class="font-mono text-zinc-300 select-all">{{ selectedAssetForDetail.file_path }}</span>
            </div>
            <div class="pt-2 border-t border-[#2A2A38]/60 flex items-center justify-between gap-2">
              <span class="font-mono text-[11px] text-zinc-400 truncate flex-1 select-all">
                {{ selectedAssetForDetail.public_url }}
              </span>
              <UButton
                size="xs"
                color="primary"
                variant="subtle"
                icon="i-heroicons-clipboard-document"
                class="cursor-pointer shrink-0"
                @click="copyToClipboard(selectedAssetForDetail.public_url, selectedAssetForDetail.name)"
              >
                Copiar URL
              </UButton>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <UButton
              size="sm"
              color="error"
              variant="soft"
              icon="i-heroicons-trash"
              class="cursor-pointer"
              @click="isDetailModalOpen = false; confirmDelete(selectedAssetForDetail)"
            >
              Eliminar Imagen
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              class="cursor-pointer"
              @click="isDetailModalOpen = false"
            >
              Cerrar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN -->
    <UModal
      :open="isDeleteModalOpen"
      title="Eliminar Activo Multimedia"
      description="Esta acción eliminará el archivo físico de Supabase Storage y su registro en la base de datos."
      @update:open="isDeleteModalOpen = $event"
    >
      <template #body>
        <div v-if="assetToDelete" class="space-y-4">
          <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-400 shrink-0" />
            <div class="space-y-0.5">
              <p class="font-bold">Advertencia importante</p>
              <p>Si este afiche o foto está asignado a un viaje o producto activo, la imagen dejará de verse en la web pública.</p>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-[#14141A] border border-[#2A2A38] flex items-center gap-3">
            <div class="w-12 h-16 rounded-lg overflow-hidden border border-[#2A2A38] bg-[#0F0F12] shrink-0">
              <img :src="assetToDelete.public_url" :alt="assetToDelete.name" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0 flex-1 text-xs">
              <p class="font-bold text-[#F5EEDC] truncate">{{ assetToDelete.name }}</p>
              <p class="font-mono text-[11px] text-zinc-500 truncate">{{ assetToDelete.file_path }}</p>
              <p class="text-[10px] text-zinc-400 mt-1">{{ formatBytes(assetToDelete.file_size_bytes) }}</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              class="cursor-pointer"
              @click="isDeleteModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="solid"
              icon="i-heroicons-trash"
              :loading="deleting"
              class="cursor-pointer font-bold"
              @click="handleDeleteAsset"
            >
              Confirmar Eliminación
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
