<script setup lang="ts">
import { z } from 'zod'
import type { TransportWithDriver } from '~/composables/useTransports'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const toast = useToast()
const { transports, loading, error, fetchTransports, createTransport, updateTransport, deleteTransport } = useTransports()
const { drivers, fetchDrivers } = useDrivers()

// Esquema de validación Zod
const transportSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  vehicle_type: z.string().min(2, 'El tipo de vehículo es requerido'),
  capacity: z.number().int().min(1, 'La capacidad mínima es de 1 plaza').max(90, 'La capacidad máxima es de 90 plazas'),
  origin: z.string().min(2, 'La ciudad de origen es requerida'),
  license_plate: z.string().optional(),
  driver_id: z.string().nullable().optional(),
  cellphone: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional()
})

type TransportForm = z.infer<typeof transportSchema>

// Estado del formulario
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedTransportId = ref<string | null>(null)
const submitting = ref(false)

const formState = reactive<TransportForm>({
  name: '',
  vehicle_type: 'Combi',
  capacity: 19,
  origin: 'Rosario',
  license_plate: '',
  driver_id: null,
  cellphone: '',
  phone: '',
  notes: ''
})

// Modal de eliminación
const isDeleteModalOpen = ref(false)
const transportToDelete = ref<TransportWithDriver | null>(null)
const deleting = ref(false)

// Búsqueda y filtrado
const searchQuery = ref('')
const capacityFilter = ref<'all' | 'combis' | 'micros'>('all')

const filteredTransports = computed(() => {
  let list = transports.value

  // Filtro por tipo de capacidad
  if (capacityFilter.value === 'combis') {
    list = list.filter(t => t.capacity <= 24)
  } else if (capacityFilter.value === 'micros') {
    list = list.filter(t => t.capacity > 24)
  }

  // Filtro por búsqueda de texto
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return list

  return list.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.origin.toLowerCase().includes(query) ||
    (t.license_plate && t.license_plate.toLowerCase().includes(query)) ||
    (t.vehicle_type && t.vehicle_type.toLowerCase().includes(query)) ||
    (t.driver && (
      t.driver.name.toLowerCase().includes(query) ||
      t.driver.lastname.toLowerCase().includes(query)
    ))
  )
})

// Métricas de flota
const totalUnits = computed(() => transports.value.length)
const totalSeats = computed(() => transports.value.reduce((acc, t) => acc + (t.capacity || 0), 0))
const totalCombis = computed(() => transports.value.filter(t => t.capacity <= 24).length)
const totalMicros = computed(() => transports.value.filter(t => t.capacity > 24).length)

// Presets de vehículos comunes en Tripu
const capacityPresets = [
  { label: 'Combi (19 pax)', type: 'Combi', capacity: 19 },
  { label: 'Minibus (24 pax)', type: 'Minibus', capacity: 24 },
  { label: 'Micro Simple (45 pax)', type: 'Micro Piso Simple', capacity: 45 },
  { label: 'Micro Doble Piso (56 pax)', type: 'Micro Doble Piso', capacity: 56 },
  { label: 'Doble Piso Plus (60 pax)', type: 'Micro Doble Piso', capacity: 60 }
]

function applyPreset(preset: typeof capacityPresets[0]) {
  formState.capacity = preset.capacity
  formState.vehicle_type = preset.type
}

function openCreateModal() {
  isEditing.value = false
  selectedTransportId.value = null
  formState.name = ''
  formState.vehicle_type = 'Combi'
  formState.capacity = 19
  formState.origin = 'Rosario'
  formState.license_plate = ''
  formState.driver_id = null
  formState.cellphone = ''
  formState.phone = ''
  formState.notes = ''
  isModalOpen.value = true
}

function openEditModal(transport: TransportWithDriver) {
  isEditing.value = true
  selectedTransportId.value = transport.id
  formState.name = transport.name
  formState.vehicle_type = transport.vehicle_type
  formState.capacity = transport.capacity
  formState.origin = transport.origin
  formState.license_plate = transport.license_plate || ''
  formState.driver_id = transport.driver_id || null
  formState.cellphone = transport.cellphone || ''
  formState.phone = transport.phone || ''
  formState.notes = transport.notes || ''
  isModalOpen.value = true
}

async function handleSaveTransport() {
  submitting.value = true
  try {
    const payload = {
      name: formState.name.trim(),
      vehicle_type: formState.vehicle_type.trim(),
      capacity: Number(formState.capacity),
      origin: formState.origin.trim(),
      license_plate: formState.license_plate?.trim().toUpperCase() || null,
      driver_id: formState.driver_id || null,
      cellphone: formState.cellphone?.trim() || null,
      phone: formState.phone?.trim() || null,
      notes: formState.notes?.trim() || null
    }

    if (isEditing.value && selectedTransportId.value) {
      const { error: err } = await updateTransport(selectedTransportId.value, payload)
      if (err) throw err
      toast.add({
        title: 'Vehículo actualizado',
        description: `${payload.name} (${payload.capacity} pax) fue actualizado con éxito.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      const { error: err } = await createTransport(payload)
      if (err) throw err
      toast.add({
        title: 'Vehículo registrado',
        description: `${payload.name} (${payload.capacity} pax) fue dado de alta en la flota.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
    isModalOpen.value = false
  } catch (err: any) {
    toast.add({
      title: 'Error al guardar vehículo',
      description: err?.message || 'Ocurrió un error inesperado',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submitting.value = false
  }
}

function openDeleteModal(transport: TransportWithDriver) {
  transportToDelete.value = transport
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!transportToDelete.value) return
  deleting.value = true
  try {
    const { error: err } = await deleteTransport(transportToDelete.value.id)
    if (err) throw err
    toast.add({
      title: 'Vehículo eliminado',
      description: `El vehículo ${transportToDelete.value.name} fue retirado de la flota.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    isDeleteModalOpen.value = false
    transportToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al eliminar',
      description: err?.message || 'No se pudo eliminar el vehículo',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    fetchTransports(),
    fetchDrivers()
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado Operativo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Flota de Vehículos
          </h1>
          <span class="px-2 py-0.5 text-xs font-semibold rounded bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/20">
            Sprint 2 • US-03
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Control de unidades de transporte: combis (19 pax), minibuses y colectivos de larga distancia (56 pax).
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          size="md"
          variant="subtle"
          color="neutral"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          title="Sincronizar con base de datos (forzar refresco)"
          @click="fetchTransports({ force: true })"
        />
        <UButton
          size="md"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-lg shadow-[#E53924]/20"
          icon="i-heroicons-plus"
          @click="openCreateModal"
        >
          Registrar Vehículo
        </UButton>
      </div>
    </div>

    <!-- Barra de Métricas y KPIs de Flota -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Flota</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalUnits }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-truck" class="w-5 h-5 text-[#E53924]" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Plazas Totales</p>
            <p class="text-2xl font-black text-emerald-400 mt-1">{{ totalSeats }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Combis (&le;24)</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalCombis }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
            <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-zinc-300" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Micros (&gt;24)</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalMicros }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
            <UIcon name="i-heroicons-archive-box" class="w-5 h-5 text-zinc-300" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Barra de Búsqueda y Filtros Rápidos -->
    <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#1A1A22] p-4 rounded-xl border border-[#2A2A38]">
      <div class="w-full sm:w-80">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por modelo, patente, origen o chofer..."
          class="w-full"
        />
      </div>

      <div class="flex items-center gap-1.5 self-end sm:self-auto text-xs">
        <span class="text-zinc-500 mr-1 font-medium">Filtrar:</span>
        <button
          class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          :class="capacityFilter === 'all' ? 'bg-[#E53924] text-white font-semibold' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
          @click="capacityFilter = 'all'"
        >
          Todos
        </button>
        <button
          class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          :class="capacityFilter === 'combis' ? 'bg-[#E53924] text-white font-semibold' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
          @click="capacityFilter = 'combis'"
        >
          Combis (19-24)
        </button>
        <button
          class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          :class="capacityFilter === 'micros' ? 'bg-[#E53924] text-white font-semibold' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
          @click="capacityFilter = 'micros'"
        >
          Micros (45-60)
        </button>
      </div>
    </div>

    <!-- Estado de Error -->
    <UAlert
      v-if="error"
      title="Error al conectar con la base de datos"
      :description="error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
    >
      <template #actions>
        <UButton size="xs" variant="solid" color="error" @click="fetchTransports({ force: true })">
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <!-- Estado de Carga -->
    <div v-if="loading && transports.length === 0" class="py-16 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando flota de transportes...</p>
    </div>

    <!-- Estado Vacío -->
    <UCard
      v-else-if="!loading && transports.length === 0"
      class="bg-[#1A1A22] border-[#2A2A38] text-center py-16"
    >
      <div class="max-w-md mx-auto space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
          <UIcon name="i-heroicons-truck" class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-[#F5EEDC]">No hay vehículos registrados en la flota</h3>
        <p class="text-xs text-zinc-400">
          Registrá combis y colectivos para habilitar su asignación a viajes y eventos programados.
        </p>
        <div class="pt-2">
          <UButton
            size="sm"
            class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            Registrar Primer Vehículo
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Tabla de Flota -->
    <UCard
      v-else
      class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[#2A2A38] text-left text-sm">
          <thead class="bg-[#14141A] text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-6 py-3.5">Unidad / Modelo</th>
              <th scope="col" class="px-6 py-3.5">Patente</th>
              <th scope="col" class="px-6 py-3.5">Capacidad</th>
              <th scope="col" class="px-6 py-3.5">Origen Salida</th>
              <th scope="col" class="px-6 py-3.5">Chofer Asignado</th>
              <th scope="col" class="px-6 py-3.5">Teléfono Guardia</th>
              <th scope="col" class="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr
              v-for="unit in filteredTransports"
              :key="unit.id"
              class="hover:bg-[#20202B] transition-colors"
            >
              <!-- Modelo y Tipo -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
                    :class="unit.capacity <= 24 ? 'bg-amber-950/60 border border-amber-800/60 text-amber-300' : 'bg-blue-950/60 border border-blue-800/60 text-blue-300'"
                  >
                    <UIcon :name="unit.capacity <= 24 ? 'i-heroicons-squares-2x2' : 'i-heroicons-truck'" class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="font-semibold text-[#F5EEDC]">
                      {{ unit.name }}
                    </p>
                    <p class="text-xs text-zinc-400">
                      {{ unit.vehicle_type }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Patente (Chapa) -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="unit.license_plate"
                  class="font-mono text-xs font-bold px-2 py-0.5 rounded border border-[#2A2A38] bg-black text-[#F5EEDC] tracking-widest uppercase shadow-sm"
                >
                  {{ unit.license_plate }}
                </span>
                <span v-else class="text-xs text-zinc-500 italic">Sin patente</span>
              </td>

              <!-- Capacidad (Plazas) -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-bold"
                    :class="unit.capacity <= 24 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'"
                  >
                    {{ unit.capacity }} plazas
                  </span>
                </div>
              </td>

              <!-- Origen -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1 text-xs text-zinc-300">
                  <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-[#E53924]" />
                  {{ unit.origin }}
                </span>
              </td>

              <!-- Chofer Asignado -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="unit.driver" class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-user" class="w-3.5 h-3.5 text-zinc-400" />
                  <span class="text-xs font-medium text-zinc-200">
                    {{ unit.driver.lastname }}, {{ unit.driver.name }}
                  </span>
                </div>
                <span v-else class="text-xs text-zinc-500 italic">
                  Sin chofer asignado
                </span>
              </td>

              <!-- Contacto de Guardia -->
              <td class="px-6 py-4 whitespace-nowrap">
                <a
                  v-if="unit.cellphone || unit.driver?.cellphone"
                  :href="`https://wa.me/${(unit.cellphone || unit.driver?.cellphone || '').replace(/[^0-9]/g, '')}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  title="Contactar guardia vía WhatsApp"
                >
                  <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 text-emerald-500" />
                  <span>{{ unit.cellphone || unit.driver?.cellphone }}</span>
                </a>
                <span v-else-if="unit.phone" class="text-xs text-zinc-400">
                  Tel: {{ unit.phone }}
                </span>
                <span v-else class="text-xs text-zinc-500 italic">—</span>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <UButton
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  icon="i-heroicons-pencil-square"
                  class="cursor-pointer"
                  title="Editar transporte"
                  @click="openEditModal(unit)"
                />
                <UButton
                  size="xs"
                  variant="subtle"
                  color="error"
                  icon="i-heroicons-trash"
                  class="cursor-pointer"
                  title="Eliminar transporte"
                  @click="openDeleteModal(unit)"
                />
              </td>
            </tr>

            <tr v-if="filteredTransports.length === 0 && searchQuery">
              <td colspan="7" class="px-6 py-8 text-center text-xs text-zinc-500">
                No se encontraron vehículos que coincidan con "{{ searchQuery }}".
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal de Creación / Edición de Transporte -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEditing ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'"
      :description="isEditing ? 'Modificá la configuración del vehículo de la flota.' : 'Ingresá los datos del vehículo para sumarlo a la flota de Tripu.'"
    >
      <template #body>
        <UForm
          :schema="transportSchema"
          :state="formState"
          class="space-y-4 pt-2"
          @submit="handleSaveTransport"
        >
          <!-- Presets rápidos -->
          <div class="space-y-1.5">
            <span class="text-xs text-zinc-400 font-medium">Presets rápidos de flota:</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="preset in capacityPresets"
                :key="preset.capacity"
                type="button"
                class="px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer"
                :class="formState.capacity === preset.capacity ? 'bg-[#E53924] border-[#E53924] text-white font-semibold shadow-sm shadow-[#E53924]/30' : 'bg-[#14141A] border-[#2A2A38] text-zinc-300 hover:border-zinc-500'"
                @click="applyPreset(preset)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Modelo / Nombre" name="name" required help="Ej. Mercedes Sprinter 515">
              <UInput
                v-model="formState.name"
                placeholder="Ej. Mercedes Benz Sprinter"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Tipo de Vehículo" name="vehicle_type" required help="Ej. Combi, Minibus, Micro">
              <UInput
                v-model="formState.vehicle_type"
                placeholder="Ej. Combi 19 pax"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UFormField label="Plazas / Capacidad" name="capacity" required>
              <UInput
                v-model.number="formState.capacity"
                type="number"
                min="1"
                max="90"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Patente (Dominio)" name="license_plate" help="Ej. AF 123 CD">
              <UInput
                v-model="formState.license_plate"
                placeholder="AF 123 CD"
                class="w-full uppercase font-mono"
              />
            </UFormField>

            <UFormField label="Ciudad de Salida" name="origin" required help="Ej. Rosario">
              <UInput
                v-model="formState.origin"
                placeholder="Rosario"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Chofer Asignado" name="driver_id" help="Chofer habitual responsable">
              <select
                v-model="formState.driver_id"
                class="w-full rounded-md bg-[#14141A] border border-[#2A2A38] text-zinc-200 text-sm px-3 py-2 focus:outline-none focus:border-[#E53924]"
              >
                <option :value="null">-- Sin chofer asignado --</option>
                <option
                  v-for="driver in drivers"
                  :key="driver.id"
                  :value="driver.id"
                >
                  {{ driver.lastname }}, {{ driver.name }} {{ driver.company ? `(${driver.company})` : '' }}
                </option>
              </select>
            </UFormField>

            <UFormField label="Celular de Guardia / Titular" name="cellphone" help="Número de coordinación">
              <UInput
                v-model="formState.cellphone"
                placeholder="Ej. 3415551234"
                icon="i-heroicons-phone"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Notas Operativas" name="notes" help="Detalles de bodega, aire acondicionado, habilitación CNRT...">
            <UTextarea
              v-model="formState.notes"
              placeholder="Habilitación CNRT vigente, calefacción, bodegas amplias..."
              rows="3"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
            <UButton
              variant="ghost"
              color="neutral"
              class="cursor-pointer"
              @click="isModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-md shadow-[#E53924]/20"
              :loading="submitting"
            >
              {{ isEditing ? 'Guardar Cambios' : 'Registrar Vehículo' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Modal de Confirmación de Eliminación -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Eliminar Vehículo"
      description="¿Estás seguro de que deseas eliminar este vehículo de la flota?"
    >
      <template #body>
        <div class="space-y-3 py-2">
          <p class="text-sm text-zinc-300">
            Estás a punto de retirar de la flota a:
            <strong class="text-white">{{ transportToDelete?.name }}</strong>
            <span v-if="transportToDelete?.license_plate" class="text-zinc-400"> ({{ transportToDelete?.license_plate }})</span>.
          </p>
          <div class="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-red-200 text-xs space-y-1">
            <div class="flex items-center gap-1.5 font-semibold">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-400" />
              <span>Advertencia:</span>
            </div>
            <p>
              Esta acción eliminará el vehículo permanentemente. Si este vehículo está asignado a viajes activos, esos viajes quedarán sin vehículo asignado.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="ghost"
            color="neutral"
            class="cursor-pointer"
            @click="isDeleteModalOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="error"
            variant="solid"
            class="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
            :loading="deleting"
            @click="handleConfirmDelete"
          >
            Sí, Retirar Vehículo
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
