<script setup lang="ts">
import { z } from 'zod'
import type { Driver } from '~/composables/useDrivers'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const toast = useToast()
const { drivers, loading, error, fetchDrivers, createDriver, updateDriver, deleteDriver } = useDrivers()

// Esquema de validación Zod
const driverSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  cellphone: z.string().min(6, 'El celular debe tener al menos 6 dígitos'),
  phone: z.string().optional(),
  licence: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional()
})

type DriverForm = z.infer<typeof driverSchema>

// Estado del formulario
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedDriverId = ref<string | null>(null)
const submitting = ref(false)

const formState = reactive<DriverForm>({
  name: '',
  lastname: '',
  cellphone: '',
  phone: '',
  licence: '',
  company: '',
  notes: ''
})

// Modal de eliminación
const isDeleteModalOpen = ref(false)
const driverToDelete = ref<Driver | null>(null)
const deleting = ref(false)

// Búsqueda y filtrado
const searchQuery = ref('')

const filteredDrivers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return drivers.value

  return drivers.value.filter(d =>
    d.name.toLowerCase().includes(query) ||
    d.lastname.toLowerCase().includes(query) ||
    (d.company && d.company.toLowerCase().includes(query)) ||
    (d.licence && d.licence.toLowerCase().includes(query)) ||
    (d.cellphone && d.cellphone.includes(query))
  )
})

// Métricas rápidas
const totalDrivers = computed(() => drivers.value.length)
const totalCompanies = computed(() => {
  const companies = new Set(drivers.value.map(d => d.company).filter(Boolean))
  return companies.size
})

function openCreateModal() {
  isEditing.value = false
  selectedDriverId.value = null
  formState.name = ''
  formState.lastname = ''
  formState.cellphone = ''
  formState.phone = ''
  formState.licence = ''
  formState.company = ''
  formState.notes = ''
  isModalOpen.value = true
}

function openEditModal(driver: Driver) {
  isEditing.value = true
  selectedDriverId.value = driver.id
  formState.name = driver.name
  formState.lastname = driver.lastname
  formState.cellphone = driver.cellphone || ''
  formState.phone = driver.phone || ''
  formState.licence = driver.licence || ''
  formState.company = driver.company || ''
  formState.notes = driver.notes || ''
  isModalOpen.value = true
}

async function handleSaveDriver() {
  submitting.value = true
  try {
    const payload = {
      name: formState.name.trim(),
      lastname: formState.lastname.trim(),
      cellphone: formState.cellphone.trim() || null,
      phone: formState.phone?.trim() || null,
      licence: formState.licence?.trim() || null,
      company: formState.company?.trim() || null,
      notes: formState.notes?.trim() || null
    }

    if (isEditing.value && selectedDriverId.value) {
      const { error: err } = await updateDriver(selectedDriverId.value, payload)
      if (err) throw err
      toast.add({
        title: 'Chofer actualizado',
        description: `${payload.name} ${payload.lastname} fue actualizado con éxito.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      const { error: err } = await createDriver(payload)
      if (err) throw err
      toast.add({
        title: 'Chofer registrado',
        description: `${payload.name} ${payload.lastname} fue dado de alta con éxito.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
    isModalOpen.value = false
  } catch (err: any) {
    toast.add({
      title: 'Error al guardar chofer',
      description: err?.message || 'Ocurrió un error inesperado',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submitting.value = false
  }
}

function openDeleteModal(driver: Driver) {
  driverToDelete.value = driver
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!driverToDelete.value) return
  deleting.value = true
  try {
    const { error: err } = await deleteDriver(driverToDelete.value.id)
    if (err) throw err
    toast.add({
      title: 'Chofer eliminado',
      description: `El chofer ${driverToDelete.value.name} ${driverToDelete.value.lastname} fue eliminado del registro.`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    isDeleteModalOpen.value = false
    driverToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al eliminar',
      description: err?.message || 'No se pudo eliminar el chofer',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchDrivers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado Operativo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2A2A38]">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-black text-[#F5EEDC] tracking-tight">
            Directorio de Choferes
          </h1>
          <span class="px-2 py-0.5 text-xs font-semibold rounded bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/20">
            Sprint 2 • US-03
          </span>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          Registro de conductores profesionales, licencias habilitantes y empresas transportistas aliadas.
        </p>
      </div>

      <UButton
        size="md"
        class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer shadow-lg shadow-[#E53924]/20"
        icon="i-heroicons-user-plus"
        @click="openCreateModal"
      >
        Registrar Chofer
      </UButton>
    </div>

    <!-- Barra de Métricas y Búsqueda -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Choferes</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalDrivers }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-[#E53924]" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Empresas Aliadas</p>
            <p class="text-2xl font-black text-[#F5EEDC] mt-1">{{ totalCompanies }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
            <UIcon name="i-heroicons-building-office" class="w-5 h-5 text-zinc-300" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-[#1A1A22] border-[#2A2A38] flex items-center">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por nombre, empresa o licencia..."
          class="w-full"
        />
      </UCard>
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
        <UButton size="xs" variant="solid" color="error" @click="fetchDrivers">
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <!-- Estado de Carga -->
    <div v-if="loading && drivers.length === 0" class="py-16 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando directorio de choferes...</p>
    </div>

    <!-- Estado Vacío -->
    <UCard
      v-else-if="!loading && drivers.length === 0"
      class="bg-[#1A1A22] border-[#2A2A38] text-center py-16"
    >
      <div class="max-w-md mx-auto space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
          <UIcon name="i-heroicons-user-group" class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-[#F5EEDC]">No hay choferes registrados todavía</h3>
        <p class="text-xs text-zinc-400">
          Dá de alta a los conductores responsables para luego poder asignarlos a la flota de combis y micros.
        </p>
        <div class="pt-2">
          <UButton
            size="sm"
            class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold cursor-pointer"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            Registrar Primer Chofer
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Tabla de Choferes -->
    <UCard
      v-else
      class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[#2A2A38] text-left text-sm">
          <thead class="bg-[#14141A] text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-6 py-3.5">Chofer</th>
              <th scope="col" class="px-6 py-3.5">Empresa</th>
              <th scope="col" class="px-6 py-3.5">Licencia CNRT</th>
              <th scope="col" class="px-6 py-3.5">Contacto Celular</th>
              <th scope="col" class="px-6 py-3.5">Observaciones</th>
              <th scope="col" class="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr
              v-for="driver in filteredDrivers"
              :key="driver.id"
              class="hover:bg-[#20202B] transition-colors"
            >
              <!-- Nombre y Apellido -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E53924] to-red-900 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                    {{ driver.name.charAt(0) }}{{ driver.lastname.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-semibold text-[#F5EEDC]">
                      {{ driver.lastname }}, {{ driver.name }}
                    </p>
                    <p v-if="driver.phone" class="text-xs text-zinc-500">
                      Tel: {{ driver.phone }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Empresa -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="driver.company"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                >
                  <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5 text-zinc-400" />
                  {{ driver.company }}
                </span>
                <span v-else class="text-xs text-zinc-500 italic">Particular / Propio</span>
              </td>

              <!-- Licencia -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="driver.licence"
                  class="font-mono text-xs text-zinc-300 bg-black/40 px-2 py-0.5 rounded border border-[#2A2A38]"
                >
                  {{ driver.licence }}
                </span>
                <span v-else class="text-xs text-zinc-500 italic">No registrada</span>
              </td>

              <!-- Contacto Celular -->
              <td class="px-6 py-4 whitespace-nowrap">
                <a
                  v-if="driver.cellphone"
                  :href="`https://wa.me/${driver.cellphone.replace(/[^0-9]/g, '')}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  title="Contactar vía WhatsApp"
                >
                  <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 text-emerald-500" />
                  <span>{{ driver.cellphone }}</span>
                </a>
                <span v-else class="text-xs text-zinc-500 italic">Sin celular</span>
              </td>

              <!-- Observaciones -->
              <td class="px-6 py-4">
                <p class="text-xs text-zinc-400 max-w-xs truncate" :title="driver.notes || ''">
                  {{ driver.notes || '—' }}
                </p>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <UButton
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  icon="i-heroicons-pencil-square"
                  class="cursor-pointer"
                  title="Editar chofer"
                  @click="openEditModal(driver)"
                />
                <UButton
                  size="xs"
                  variant="subtle"
                  color="error"
                  icon="i-heroicons-trash"
                  class="cursor-pointer"
                  title="Eliminar chofer"
                  @click="openDeleteModal(driver)"
                />
              </td>
            </tr>

            <tr v-if="filteredDrivers.length === 0 && searchQuery">
              <td colspan="6" class="px-6 py-8 text-center text-xs text-zinc-500">
                No se encontraron choferes que coincidan con "{{ searchQuery }}".
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal de Creación / Edición -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEditing ? 'Editar Chofer' : 'Registrar Nuevo Chofer'"
      :description="isEditing ? 'Modificá los datos del conductor profesional.' : 'Ingresá los datos del conductor para sumarlo a la base de Tripu.'"
    >
      <template #body>
        <UForm
          :schema="driverSchema"
          :state="formState"
          class="space-y-4 pt-2"
          @submit="handleSaveDriver"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Nombre" name="name" required>
              <UInput
                v-model="formState.name"
                placeholder="Ej. Juan Carlos"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Apellido" name="lastname" required>
              <UInput
                v-model="formState.lastname"
                placeholder="Ej. Gómez"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Celular (WhatsApp Guardia)" name="cellphone" required help="Número directo con código de área">
              <UInput
                v-model="formState.cellphone"
                placeholder="Ej. 3415551234"
                icon="i-heroicons-phone"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Teléfono Fijo / Secundario" name="phone">
              <UInput
                v-model="formState.phone"
                placeholder="Ej. 0341-4445555"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Empresa Transportista" name="company" help="Empresa titular del vehículo o autónomo">
              <UInput
                v-model="formState.company"
                placeholder="Ej. Traslados del Paraná S.R.L."
                icon="i-heroicons-building-office"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Licencia CNRT / Registro" name="licence" help="Número de habilitación profesional">
              <UInput
                v-model="formState.licence"
                placeholder="Ej. L-CNRT-98442"
                icon="i-heroicons-identification"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Notas / Observaciones" name="notes">
            <UTextarea
              v-model="formState.notes"
              placeholder="Disponibilidad horaria, referencias, observaciones de contingente..."
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
              {{ isEditing ? 'Guardar Cambios' : 'Registrar Chofer' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Modal de Confirmación de Eliminación -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Eliminar Chofer"
      description="¿Estás seguro de que deseas eliminar este chofer del sistema?"
    >
      <template #body>
        <div class="space-y-3 py-2">
          <p class="text-sm text-zinc-300">
            Estás a punto de eliminar a
            <strong class="text-white">{{ driverToDelete?.name }} {{ driverToDelete?.lastname }}</strong>.
          </p>
          <div class="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs space-y-1">
            <div class="flex items-center gap-1.5 font-semibold">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-400" />
              <span>Aviso de integridad referencial:</span>
            </div>
            <p>
              Si este chofer tiene vehículos asignados en la flota, el campo de chofer en esos vehículos pasará automáticamente a estado sin asignar (NULL), sin borrar el vehículo.
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
            Sí, Eliminar Chofer
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
