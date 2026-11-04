<script setup lang="ts">
import { z } from 'zod'
import { type MerchItem, type MerchCategory, useMerch } from '~/composables/useMerch'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Merchandising Oficial | Tripu Admin'
})

const toast = useToast()
const {
  merchItems,
  loading,
  error,
  isDbReady,
  fetchMerch,
  createMerchItem,
  updateMerchItem,
  deleteMerchItem
} = useMerch()

// Filtros y Búsqueda
const searchQuery = ref('')
const categoryFilter = ref<'all' | MerchCategory>('all')

// Esquema Zod para validación de producto
const merchSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  category: z.enum(['indumentaria', 'accesorios', 'calcos', 'combos', 'otros']),
  price: z.number().min(0, 'El precio debe ser igual o mayor a 0'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  description: z.string().optional(),
  sizesString: z.string().optional(),
  is_active: z.boolean()
})

type MerchForm = z.infer<typeof merchSchema>

// Estado del Modal de Creación / Edición
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedItemId = ref<string | null>(null)
const submitting = ref(false)

const formState = reactive<MerchForm>({
  name: '',
  category: 'indumentaria',
  price: 0,
  stock: 0,
  description: '',
  sizesString: '',
  is_active: true
})

// Modal de Eliminación
const isDeleteModalOpen = ref(false)
const itemToDelete = ref<MerchItem | null>(null)
const deleting = ref(false)

// Categorías disponibles
const categoryOptions: { label: string; value: 'all' | MerchCategory }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Indumentaria', value: 'indumentaria' },
  { label: 'Accesorios', value: 'accesorios' },
  { label: 'Calcomanías', value: 'calcos' },
  { label: 'Combos & Packs', value: 'combos' },
  { label: 'Otros', value: 'otros' }
]

const formCategoryOptions = [
  { label: 'Indumentaria (Remeras, Buzos)', value: 'indumentaria' },
  { label: 'Accesorios (Gorras, Mochilas)', value: 'accesorios' },
  { label: 'Calcomanías & Stickers', value: 'calcos' },
  { label: 'Combos & Packs de Viaje', value: 'combos' },
  { label: 'Otros Artículos', value: 'otros' }
]

// Filtrado reactivo de productos
const filteredItems = computed(() => {
  let list = merchItems.value

  if (categoryFilter.value !== 'all') {
    list = list.filter(item => item.category === categoryFilter.value)
  }

  const query = searchQuery.value.toLowerCase().trim()
  if (query) {
    list = list.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    )
  }

  return list
})

// Métricas de telemetría del catálogo
const totalProducts = computed(() => merchItems.value.length)
const totalStock = computed(() => merchItems.value.reduce((acc, item) => acc + (item.stock || 0), 0))
const totalInventoryValue = computed(() =>
  merchItems.value.reduce((acc, item) => acc + (item.price * (item.stock || 0)), 0)
)
const activeCategoriesCount = computed(() => new Set(merchItems.value.map(i => i.category)).size)

function getCategoryBadge(cat: MerchCategory) {
  switch (cat) {
    case 'indumentaria':
      return { label: 'Indumentaria', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
    case 'accesorios':
      return { label: 'Accesorios', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
    case 'calcos':
      return { label: 'Calcomanías', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
    case 'combos':
      return { label: 'Combo Especial', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    default:
      return { label: 'General', class: 'bg-zinc-800 text-zinc-300 border-zinc-700' }
  }
}

function openCreateModal() {
  isEditing.value = false
  selectedItemId.value = null
  formState.name = ''
  formState.category = 'indumentaria'
  formState.price = 0
  formState.stock = 0
  formState.description = ''
  formState.sizesString = 'S, M, L, XL'
  formState.is_active = true
  isModalOpen.value = true
}

function openEditModal(item: MerchItem) {
  isEditing.value = true
  selectedItemId.value = item.id
  formState.name = item.name
  formState.category = item.category
  formState.price = item.price
  formState.stock = item.stock
  formState.description = item.description || ''
  formState.sizesString = item.sizes ? item.sizes.join(', ') : ''
  formState.is_active = item.is_active
  isModalOpen.value = true
}

function confirmDelete(item: MerchItem) {
  itemToDelete.value = item
  isDeleteModalOpen.value = true
}

async function handleSaveItem() {
  submitting.value = true
  try {
    const sizes = formState.sizesString
      ? formState.sizesString.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : null

    const payload = {
      name: formState.name.trim(),
      category: formState.category,
      price: Number(formState.price),
      stock: Number(formState.stock),
      description: formState.description?.trim() || null,
      sizes: sizes && sizes.length > 0 ? sizes : null,
      is_active: formState.is_active
    }

    if (isEditing.value && selectedItemId.value) {
      await updateMerchItem(selectedItemId.value, payload)
      toast.add({
        title: 'Producto actualizado',
        description: `"${payload.name}" fue actualizado correctamente.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      await createMerchItem(payload)
      toast.add({
        title: 'Producto registrado',
        description: `"${payload.name}" se agregó al inventario de merchandising.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
    isModalOpen.value = false
  } catch (err: any) {
    toast.add({
      title: 'Error al procesar producto',
      description: err?.message || 'Ocurrió un error inesperado',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submitting.value = false
  }
}

async function handleConfirmDelete() {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteMerchItem(itemToDelete.value.id)
    toast.add({
      title: 'Producto eliminado',
      description: `"${itemToDelete.value.name}" fue dado de baja del catálogo.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    isDeleteModalOpen.value = false
    itemToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al eliminar',
      description: err?.message || 'No se pudo eliminar el artículo',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchMerch()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado Principal de la Sección -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Merchandising Oficial
          </h1>
          <span
            class="text-xs px-2.5 py-0.5 rounded-full bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/30 font-bold uppercase tracking-wider">
            Mejoras • En Preparación
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Estructura Inicial
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Catálogo oficial de productos, indumentaria para recitales, control de talles y stock de Tripu Producciones.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton size="md" variant="subtle" color="neutral" icon="i-heroicons-arrow-path" :loading="loading"
          title="Refrescar catálogo" @click="fetchMerch({ force: true })" />
        <UButton size="md"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-lg shadow-[#E53924]/20"
          icon="i-heroicons-plus" @click="openCreateModal">
          Nuevo Producto
        </UButton>
      </div>
    </div>

    <!-- Barra de Estado: Sección en Construcción -->
    <div
      class="relative overflow-hidden rounded-2xl border border-[#E53924]/30 bg-gradient-to-r from-[#1A1A22] via-[#14141B] to-[#1A1A22] p-5 shadow-xl">
      <div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#E53924]/10 blur-3xl pointer-events-none" />
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div class="flex items-start gap-3.5">
          <div
            class="w-10 h-10 rounded-xl bg-[#E53924]/15 border border-[#E53924]/30 flex items-center justify-center text-[#E53924] shrink-0 mt-0.5">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 animate-pulse" />
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-[#F5EEDC]">
                Próximamente: Módulo de Merchandising Tripu
              </span>
              <span
                class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                En Construcción
              </span>
            </div>
            <p class="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              Integración visual y arquitectónica del catálogo de Merch. Acá podrás crear, editar, fijar precios y
              gestionar el stock físico de remeras, buzos, gorras y combos exclusivos.
              La vinculación con la base de datos Supabase se activará en la próxima fase.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
          <div class="text-right hidden lg:block">
            <p class="text-[11px] text-zinc-400">Estado de arquitectura</p>
            <p class="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
              <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" />
              <span>CRUD local operativo</span>
            </p>
          </div>
          <UButton size="xs" variant="outline" color="neutral" class="cursor-pointer"
            icon="i-heroicons-question-mark-circle"
            @click="toast.add({ title: 'Módulo en Construcción', description: 'El esquema de base de datos se creará próximamente junto con la vinculación a ventas.', color: 'info' })">
            Detalles
          </UButton>
        </div>
      </div>
    </div>

    <!-- Barra de Métricas y KPIs de Merchandising -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Artículos Activos</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalProducts }}</p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-900/50 flex items-center justify-center text-blue-400">
            <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Stock Total Físico</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalStock }} un.</p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
            <UIcon name="i-heroicons-archive-box" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Valor Estimado</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">
              ${{ totalInventoryValue.toLocaleString('es-AR') }}
            </p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center text-[#E53924]">
            <UIcon name="i-heroicons-banknotes" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Categorías</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ activeCategoriesCount }}</p>
          </div>
          <div
            class="w-10 h-10 rounded-lg bg-purple-950/40 border border-purple-900/50 flex items-center justify-center text-purple-400">
            <UIcon name="i-heroicons-tag" class="w-5 h-5" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div class="flex-1 max-w-md">
        <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por producto, descripción o categoría..." class="w-full" />
      </div>

      <!-- Filtros por Categoría -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <button v-for="opt in categoryOptions" :key="opt.value" type="button"
          class="px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer whitespace-nowrap" :class="categoryFilter === opt.value
            ? 'bg-[#E53924] border-[#E53924] text-white font-semibold shadow-sm shadow-[#E53924]/30'
            : 'bg-[#14141A] border-[#2A2A38] text-zinc-300 hover:border-zinc-500'" @click="categoryFilter = opt.value">
          {{ opt.label }}
          <span class="text-[11px] opacity-75">
            ({{opt.value === 'all' ? merchItems.length : merchItems.filter(i => i.category === opt.value).length}})
          </span>
        </button>
      </div>
    </div>

    <!-- Tabla Catálogo de Merchandising -->
    <UCard class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-[#2A2A38] text-left text-xs sm:text-sm">
          <thead class="bg-[#14141A] text-[11px] sm:text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-4 py-3.5">Artículo / Producto</th>
              <th scope="col" class="px-4 py-3.5">Categoría</th>
              <th scope="col" class="px-4 py-3.5">Talles / Variantes</th>
              <th scope="col" class="px-4 py-3.5">Stock</th>
              <th scope="col" class="px-4 py-3.5">Precio Unitario</th>
              <th scope="col" class="px-4 py-3.5">Estado</th>
              <th scope="col" class="px-4 py-3.5 text-right whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr v-if="filteredItems.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-zinc-400">
                <UIcon name="i-heroicons-inbox" class="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                <p class="text-sm font-semibold text-[#F5EEDC]">No se encontraron artículos</p>
                <p class="text-xs text-zinc-500 mt-0.5">Probá cambiando el filtro o agregá un nuevo producto.</p>
              </td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-[#20202B] transition-colors">
              <!-- Producto -->
              <td class="px-4 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg bg-zinc-800/80 border border-[#2A2A38] flex items-center justify-center shrink-0 text-zinc-400">
                    <UIcon name="i-heroicons-tag" class="w-5 h-5 text-[#E53924]" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-[#F5EEDC] text-xs sm:text-sm truncate max-w-[220px]" :title="item.name">
                      {{ item.name }}
                    </p>
                    <p class="text-[11px] text-zinc-400 truncate max-w-[240px]" :title="item.description || ''">
                      {{ item.description || 'Sin descripción detallada' }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Categoría -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                  :class="getCategoryBadge(item.category).class">
                  {{ getCategoryBadge(item.category).label }}
                </span>
              </td>

              <!-- Talles -->
              <td class="px-4 py-3.5">
                <div v-if="item.sizes && item.sizes.length > 0" class="flex items-center gap-1 flex-wrap">
                  <span v-for="size in item.sizes" :key="size"
                    class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                    {{ size }}
                  </span>
                </div>
                <span v-else class="text-zinc-500 text-xs">No aplica</span>
              </td>

              <!-- Stock -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" :class="item.stock > 15 ? 'bg-emerald-400' : 'bg-amber-400'" />
                  <span class="font-bold text-xs" :class="item.stock <= 10 ? 'text-amber-400' : 'text-[#F5EEDC]'">
                    {{ item.stock }} un.
                  </span>
                </div>
              </td>

              <!-- Precio -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="font-bold text-sm text-[#F5EEDC]">
                  ${{ item.price.toLocaleString('es-AR') }}
                </span>
              </td>

              <!-- Estado -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border" :class="item.is_active
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'">
                  {{ item.is_active ? 'Activo' : 'Pausado' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3.5 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-1">
                  <button type="button"
                    class="p-1.5 rounded-lg hover:bg-[#2A2A38] text-zinc-400 hover:text-[#F5EEDC] transition-colors cursor-pointer"
                    title="Editar producto" @click="openEditModal(item)">
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>
                  <button type="button"
                    class="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Eliminar producto" @click="confirmDelete(item)">
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal de Creación / Edición de Producto -->
    <UModal v-model:open="isModalOpen"
      :title="isEditing ? 'Editar Artículo de Merchandising' : 'Registrar Nuevo Artículo de Merch'"
      :description="isEditing ? 'Modificá los datos del artículo, precios y existencias en inventario.' : 'Completá los datos del nuevo producto para sumarlo a la tienda oficial.'">
      <template #body>
        <UForm :schema="merchSchema" :state="formState" class="space-y-4 pt-2" @submit="handleSaveItem">
          <UFormField label="Nombre del Producto" name="name" required help="Ej. Remera Oficial Tripu Tour 2026">
            <UInput v-model="formState.name" placeholder="Nombre descriptivo del producto..." class="w-full" />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Categoría" name="category" required>
              <USelect v-model="formState.category" :items="formCategoryOptions" class="w-full" />
            </UFormField>

            <UFormField label="Precio Unitario ($ ARS)" name="price" required help="Valor de venta al público">
              <UInput v-model.number="formState.price" type="number" placeholder="22000" icon="i-heroicons-banknotes"
                class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Stock Físico Inicial" name="stock" required help="Unidades disponibles en depósito">
              <UInput v-model.number="formState.stock" type="number" placeholder="50" icon="i-heroicons-archive-box"
                class="w-full" />
            </UFormField>

            <UFormField label="Talles / Variantes" name="sizesString" help="Separados por coma: S, M, L, XL">
              <UInput v-model="formState.sizesString" placeholder="S, M, L, XL, XXL" icon="i-heroicons-tag"
                class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Descripción del Producto" name="description">
            <UTextarea v-model="formState.description"
              placeholder="Detalles de tela, confección, materiales o especificaciones..." rows="3" class="w-full" />
          </UFormField>

          <div class="flex items-center justify-between pt-2">
            <span class="text-xs text-zinc-400">Estado de disponibilidad comercial</span>
            <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input v-model="formState.is_active" type="checkbox"
                class="rounded border-zinc-700 text-[#E53924] focus:ring-[#E53924]" />
              <span :class="formState.is_active ? 'text-emerald-400' : 'text-zinc-500'">
                {{ formState.is_active ? 'Producto Activo para Venta' : 'Pausado Temporalmente' }}
              </span>
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
            <UButton variant="ghost" color="neutral" class="cursor-pointer" @click="isModalOpen = false">
              Cancelar
            </UButton>
            <UButton type="submit"
              class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-md shadow-[#E53924]/20"
              :loading="submitting">
              {{ isEditing ? 'Guardar Cambios' : 'Registrar Producto' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Modal de Confirmación de Eliminación -->
    <UModal v-model:open="isDeleteModalOpen" title="Eliminar Artículo de Merchandising"
      description="¿Estás seguro de que deseas eliminar este artículo del catálogo?">
      <template #body>
        <div class="space-y-3 py-2">
          <p class="text-sm text-zinc-300">
            Estás a punto de eliminar
            <strong class="text-[#F5EEDC]">{{ itemToDelete?.name }}</strong>.
          </p>
          <div class="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs space-y-1">
            <div class="flex items-center gap-1.5 font-semibold">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-400" />
              <span>Aviso de inventario:</span>
            </div>
            <p>
              Esta acción dará de baja el producto y sus existencias de stock del catálogo operativo.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton variant="ghost" color="neutral" class="cursor-pointer" @click="isDeleteModalOpen = false">
            Cancelar
          </UButton>
          <UButton color="error" variant="solid"
            class="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer" :loading="deleting"
            @click="handleConfirmDelete">
            Sí, Eliminar Artículo
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
