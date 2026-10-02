<script setup lang="ts">
import { customerSchema, type CustomerFormState, type Customer } from '~/composables/useCustomers'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const toast = useToast()
const {
  customers,
  loading,
  error,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  parseInterests,
  formatInterests
} = useCustomers()

// Carga inicial al montar la página
onMounted(async () => {
  await fetchCustomers()
})

// Búsqueda y Filtros reactivos
const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const cityFilter = ref<string>('all')

// Ciudades únicas para el selector de filtro
const availableCities = computed(() => {
  const cities = new Set<string>()
  customers.value.forEach(c => {
    if (c.city && c.city.trim()) {
      cities.add(c.city.trim())
    }
  })
  return Array.from(cities).sort((a, b) => a.localeCompare(b))
})

// Filtrado reactivo en memoria (0 ms)
const filteredCustomers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  return customers.value.filter(c => {
    // Filtro por estado
    if (statusFilter.value === 'active' && !c.is_active) return false
    if (statusFilter.value === 'inactive' && c.is_active) return false

    // Filtro por ciudad
    if (cityFilter.value !== 'all' && c.city?.trim().toLowerCase() !== cityFilter.value.toLowerCase()) {
      return false
    }

    // Filtro por texto libre
    if (!query) return true

    const fullName = `${c.name} ${c.lastname}`.toLowerCase()
    const dni = (c.dni || '').toLowerCase()
    const email = (c.email || '').toLowerCase()
    const city = (c.city || '').toLowerCase()
    const phone = (c.phone || '').toLowerCase()
    const interests = (c.interests || '').toLowerCase()

    return (
      fullName.includes(query) ||
      dni.includes(query) ||
      email.includes(query) ||
      city.includes(query) ||
      phone.includes(query) ||
      interests.includes(query)
    )
  })
})

// Métricas y KPIs de Telemetría
const totalCustomers = computed(() => customers.value.length)
const activeCustomers = computed(() => customers.value.filter(c => c.is_active).length)
const withPhoneCount = computed(() => customers.value.filter(c => !!c.phone?.trim()).length)
const totalCitiesCount = computed(() => availableCities.value.length)

// Estado del Modal de Alta / Edición
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedCustomerId = ref<string | null>(null)
const submitting = ref(false)

const formState = reactive<CustomerFormState>({
  name: '',
  lastname: '',
  dni: '',
  email: '',
  phone: '',
  city: '',
  daybirth: '',
  emergency_contact: '',
  instagram: '',
  notes: '',
  interests: [],
  is_active: true
})

function resetForm() {
  formState.name = ''
  formState.lastname = ''
  formState.dni = ''
  formState.email = ''
  formState.phone = ''
  formState.city = ''
  formState.daybirth = ''
  formState.emergency_contact = ''
  formState.instagram = ''
  formState.notes = ''
  formState.interests = []
  formState.is_active = true
}

function openCreateModal() {
  isEditing.value = false
  selectedCustomerId.value = null
  resetForm()
  isModalOpen.value = true
}

function openEditModal(customer: Customer) {
  isEditing.value = true
  selectedCustomerId.value = customer.id
  formState.name = customer.name
  formState.lastname = customer.lastname
  formState.dni = customer.dni
  formState.email = customer.email || ''
  formState.phone = customer.phone || ''
  formState.city = customer.city || ''
  formState.daybirth = customer.daybirth || ''
  formState.emergency_contact = customer.emergency_contact || ''
  formState.instagram = customer.instagram || ''
  formState.notes = customer.notes || ''
  formState.interests = parseInterests(customer.interests)
  formState.is_active = customer.is_active
  isModalOpen.value = true
}

async function handleSaveCustomer() {
  submitting.value = true
  try {
    const payload = {
      name: formState.name.trim(),
      lastname: formState.lastname.trim(),
      dni: formState.dni.trim().toUpperCase(),
      email: formState.email?.trim() || null,
      phone: formState.phone?.trim() || null,
      city: formState.city?.trim() || null,
      daybirth: formState.daybirth || null,
      emergency_contact: formState.emergency_contact?.trim() || null,
      instagram: formState.instagram?.trim() || null,
      notes: formState.notes?.trim() || null,
      interests: formatInterests(formState.interests),
      is_active: formState.is_active
    }

    if (isEditing.value && selectedCustomerId.value) {
      const { error: err } = await updateCustomer(selectedCustomerId.value, payload)
      if (err) throw err

      toast.add({
        title: 'Pasajero actualizado',
        description: `Los datos de ${payload.name} ${payload.lastname} fueron guardados correctamente.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      const { error: err } = await createCustomer(payload)
      if (err) throw err

      toast.add({
        title: 'Pasajero registrado',
        description: `${payload.name} ${payload.lastname} ha sido incorporado al padrón.`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }

    isModalOpen.value = false
    resetForm()
  } catch (err: any) {
    const isDuplicate = err?.message?.includes('customers_dni_key') || err?.code === '23505'
    toast.add({
      title: isDuplicate ? 'DNI duplicado' : 'Error al guardar',
      description: isDuplicate
        ? 'Ya existe otro cliente registrado con este mismo DNI.'
        : (err?.message || 'Ocurrió un problema inesperado.'),
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    submitting.value = false
  }
}

// Modal de Baja Lógica / Reactivación
const isDeleteModalOpen = ref(false)
const customerToToggle = ref<Customer | null>(null)
const toggling = ref(false)

function openToggleStatusModal(customer: Customer) {
  customerToToggle.value = customer
  isDeleteModalOpen.value = true
}

async function handleConfirmToggleStatus() {
  if (!customerToToggle.value) return
  toggling.value = true

  try {
    const nextStatus = !customerToToggle.value.is_active
    const { error: err } = await updateCustomer(customerToToggle.value.id, {
      is_active: nextStatus
    })

    if (err) throw err

    toast.add({
      title: nextStatus ? 'Cliente reactivado' : 'Cliente dado de baja',
      description: nextStatus
        ? `${customerToToggle.value.name} ahora figura como activo.`
        : `${customerToToggle.value.name} ha sido marcado como inactivo (baja lógica).`,
      color: nextStatus ? 'success' : 'warning',
      icon: nextStatus ? 'i-heroicons-check-circle' : 'i-heroicons-information-circle'
    })

    isDeleteModalOpen.value = false
    customerToToggle.value = null
  } catch (err: any) {
    toast.add({
      title: 'Error al cambiar estado',
      description: err?.message || 'No se pudo actualizar el estado del cliente.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  } finally {
    toggling.value = false
  }
}

// Limpieza de teléfono para enlace de WhatsApp
function formatWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (!cleaned || cleaned.length < 8) return null
  const finalNumber = cleaned.startsWith('54') ? cleaned : `54${cleaned}`
  return `https://wa.me/${finalNumber}`
}

// Cálculo visual de edad
function calculateAge(daybirth: string | null | undefined): number | null {
  if (!daybirth) return null
  const birth = new Date(daybirth)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Principal -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A2A38] pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-black tracking-tight text-[#F5EEDC]">
            Padrón de Clientes &amp; Pasajeros
          </h1>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#E53924]/10 text-[#FF5733] border border-[#E53924]/30 font-bold uppercase tracking-wider">
            Módulo Clientes
          </span>
        </div>
        <p class="text-sm text-zinc-400 mt-1">
          Directorio centralizado de pasajeros habituales con DNI, contacto directo para WhatsApp e intereses musicales para salidas.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <UButton
          icon="i-heroicons-arrow-path"
          variant="subtle"
          color="neutral"
          :loading="loading"
          title="Forzar actualización de datos desde Supabase"
          @click="fetchCustomers({ force: true })"
        />
        <UButton
          icon="i-heroicons-user-plus"
          class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-md shadow-[#E53924]/20 transition-all cursor-pointer"
          @click="openCreateModal"
        >
          Nuevo Pasajero
        </UButton>
      </div>
    </div>

    <!-- Banner de Error si falló la carga -->
    <UAlert
      v-if="error"
      title="Error al conectar con la base de datos de clientes"
      :description="error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
    >
      <template #actions>
        <UButton size="xs" variant="solid" color="error" @click="fetchCustomers({ force: true })">
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <!-- Bloque Superior de KPIs Telemetría -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Clientes -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-lg bg-[#E53924]/10 border border-[#E53924]/30 flex items-center justify-center text-[#FF5733] shrink-0">
            <UIcon name="i-heroicons-users" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-2xl font-black text-[#F5EEDC]">{{ totalCustomers }}</div>
            <div class="text-xs text-zinc-400 font-medium">Total en Padrón</div>
          </div>
        </div>
      </UCard>

      <!-- Clientes Activos -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <UIcon name="i-heroicons-check-badge" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-2xl font-black text-[#F5EEDC]">
              {{ activeCustomers }}
              <span class="text-xs font-semibold text-emerald-400 ml-1">
                ({{ totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0 }}%)
              </span>
            </div>
            <div class="text-xs text-zinc-400 font-medium">Habilitados</div>
          </div>
        </div>
      </UCard>

      <!-- Con WhatsApp cargado -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-2xl font-black text-[#F5EEDC]">{{ withPhoneCount }}</div>
            <div class="text-xs text-zinc-400 font-medium">Con Celular Cargado</div>
          </div>
        </div>
      </UCard>

      <!-- Ciudades registradas -->
      <UCard class="bg-[#1A1A22] border-[#2A2A38]">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-2xl font-black text-[#F5EEDC]">{{ totalCitiesCount }}</div>
            <div class="text-xs text-zinc-400 font-medium">Localidades Activas</div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Toolbar: Buscador y Filtros -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#1A1A22] p-3 rounded-xl border border-[#2A2A38]">
      <div class="flex-1 max-w-md">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar por Nombre, DNI, Email, Ciudad o Tag..."
          class="w-full"
        />
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Filtro Estado -->
        <select
          v-model="statusFilter"
          class="rounded-lg bg-[#14141A] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2 focus:outline-none focus:border-[#E53924] cursor-pointer"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Solo Activos</option>
          <option value="inactive">Solo Inactivos</option>
        </select>

        <!-- Filtro Ciudad -->
        <select
          v-if="availableCities.length > 0"
          v-model="cityFilter"
          class="rounded-lg bg-[#14141A] border border-[#2A2A38] text-[#F5EEDC] text-xs px-3 py-2 focus:outline-none focus:border-[#E53924] cursor-pointer"
        >
          <option value="all">Todas las ciudades</option>
          <option v-for="c in availableCities" :key="c" :value="c">{{ c }}</option>
        </select>

        <div class="text-xs text-zinc-400 px-2 font-medium hidden sm:block">
          Mostrando {{ filteredCustomers.length }} de {{ totalCustomers }}
        </div>
      </div>
    </div>

    <!-- Estado de Carga Inicial -->
    <div v-if="loading && customers.length === 0" class="py-16 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto text-[#E53924] animate-spin mb-3" />
      <p class="text-sm text-zinc-400">Cargando directorio de clientes...</p>
    </div>

    <!-- Tabla Catálogo de Clientes -->
    <UCard
      v-else
      class="bg-[#1A1A22] border-[#2A2A38] overflow-hidden"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-[#2A2A38] text-left text-xs sm:text-sm">
          <thead class="bg-[#14141A] text-[11px] sm:text-xs uppercase font-semibold text-zinc-400">
            <tr>
              <th scope="col" class="px-4 py-3.5">Pasajero / DNI</th>
              <th scope="col" class="px-4 py-3.5">Contacto &amp; WhatsApp</th>
              <th scope="col" class="px-4 py-3.5">Ciudad</th>
              <th scope="col" class="px-4 py-3.5">Intereses &amp; Tags</th>
              <th scope="col" class="px-4 py-3.5">Contacto Emergencia</th>
              <th scope="col" class="px-4 py-3.5">Estado</th>
              <th scope="col" class="px-4 py-3.5 text-right whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2A2A38] text-zinc-300">
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="hover:bg-[#20202B] transition-colors"
            >
              <!-- Pasajero / DNI -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E53924] to-red-950 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                    {{ customer.name.charAt(0) }}{{ customer.lastname.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-bold text-[#F5EEDC] flex items-center gap-2">
                      <span>{{ customer.lastname }}, {{ customer.name }}</span>
                      <span
                        v-if="calculateAge(customer.daybirth) !== null"
                        class="text-[11px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-normal"
                        :title="`Nacimiento: ${customer.daybirth}`"
                      >
                        {{ calculateAge(customer.daybirth) }} años
                      </span>
                    </div>
                    <div class="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <UIcon name="i-heroicons-identification" class="w-3.5 h-3.5 text-zinc-500" />
                      <span>DNI: {{ customer.dni }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Contacto & WhatsApp -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="space-y-1">
                  <!-- Celular + WhatsApp -->
                  <div v-if="customer.phone" class="flex items-center gap-1.5">
                    <span class="text-xs text-[#F5EEDC] font-mono">{{ customer.phone }}</span>
                    <a
                      v-if="formatWhatsAppUrl(customer.phone)"
                      :href="formatWhatsAppUrl(customer.phone)!"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-semibold transition-colors"
                      title="Abrir chat en WhatsApp"
                    >
                      <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </a>
                  </div>
                  <div v-else class="text-xs text-zinc-600 italic">Sin celular</div>

                  <!-- Email -->
                  <div v-if="customer.email" class="text-[11.5px] text-zinc-400 truncate max-w-[200px] flex items-center gap-1">
                    <UIcon name="i-heroicons-envelope" class="w-3 h-3 text-zinc-500 shrink-0" />
                    <span class="truncate">{{ customer.email }}</span>
                  </div>

                  <!-- Instagram -->
                  <div v-if="customer.instagram" class="text-[11px] text-zinc-400 flex items-center gap-1">
                    <UIcon name="i-heroicons-at-symbol" class="w-3 h-3 text-pink-500 shrink-0" />
                    <span>@{{ customer.instagram.replace(/^@/, '') }}</span>
                  </div>
                </div>
              </td>

              <!-- Ciudad -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div v-if="customer.city" class="flex items-center gap-1.5 text-xs text-zinc-300">
                  <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{{ customer.city }}</span>
                </div>
                <span v-else class="text-xs text-zinc-600 italic">No especificada</span>
              </td>

              <!-- Intereses & Tags -->
              <td class="px-4 py-4">
                <div v-if="parseInterests(customer.interests).length > 0" class="flex flex-wrap gap-1 max-w-xs">
                  <span
                    v-for="tag in parseInterests(customer.interests).slice(0, 3)"
                    :key="tag"
                    class="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#E53924]/10 text-[#FF6B55] border border-[#E53924]/20"
                  >
                    #{{ tag }}
                  </span>
                  <span
                    v-if="parseInterests(customer.interests).length > 3"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-semibold"
                    :title="parseInterests(customer.interests).slice(3).join(', ')"
                  >
                    +{{ parseInterests(customer.interests).length - 3 }}
                  </span>
                </div>
                <span v-else class="text-xs text-zinc-600 italic">Sin tags</span>
              </td>

              <!-- Contacto Emergencia -->
              <td class="px-4 py-4">
                <div v-if="customer.emergency_contact" class="text-xs text-zinc-300 max-w-[180px] truncate" :title="customer.emergency_contact">
                  <div class="flex items-center gap-1">
                    <UIcon name="i-heroicons-shield-exclamation" class="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span class="truncate">{{ customer.emergency_contact }}</span>
                  </div>
                </div>
                <span v-else class="text-xs text-zinc-600 italic">—</span>
              </td>

              <!-- Estado -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  v-if="customer.is_active"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Activo
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-700/30 text-zinc-400 border border-zinc-700"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                  Inactivo
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-4 whitespace-nowrap text-right space-x-1">
                <UButton
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  icon="i-heroicons-pencil-square"
                  class="cursor-pointer"
                  title="Editar datos del pasajero"
                  @click="openEditModal(customer)"
                />
                <UButton
                  size="xs"
                  variant="subtle"
                  :color="customer.is_active ? 'error' : 'success'"
                  :icon="customer.is_active ? 'i-heroicons-trash' : 'i-heroicons-arrow-path-rounded-square'"
                  class="cursor-pointer"
                  :title="customer.is_active ? 'Dar de baja (inactivar)' : 'Reactivar pasajero'"
                  @click="openToggleStatusModal(customer)"
                />
              </td>
            </tr>

            <!-- Estado Vacío en Filtros -->
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-xs text-zinc-400">
                <div class="max-w-sm mx-auto space-y-2">
                  <UIcon name="i-heroicons-user-group" class="w-8 h-8 mx-auto text-zinc-600" />
                  <p class="font-medium text-zinc-300">No se encontraron pasajeros registrados</p>
                  <p class="text-zinc-500">
                    {{ searchQuery || statusFilter !== 'all' || cityFilter !== 'all'
                      ? 'Intenta ajustar los criterios de búsqueda o restablecer los filtros.'
                      : 'Comienza dando de alta al primer cliente desde el botón "Nuevo Pasajero".' }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- ============================================================== -->
    <!-- MODAL DE ALTA / EDICIÓN DE CLIENTE                             -->
    <!-- ============================================================== -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEditing ? 'Editar Datos del Pasajero' : 'Registrar Nuevo Pasajero'"
      :description="isEditing ? 'Modifica los datos de contacto e intereses del cliente.' : 'Completa los datos de identidad, contacto e intereses para incorporarlo al padrón.'"
    >
      <template #body>
        <UForm :schema="customerSchema" :state="formState" class="space-y-5 pt-2" @submit="handleSaveCustomer">
          <!-- BLOQUE 1: Identidad Personal -->
          <div class="space-y-3">
            <div class="text-xs font-bold uppercase tracking-wider text-[#FF5733] flex items-center gap-1.5">
              <UIcon name="i-heroicons-identification" class="w-3.5 h-3.5" />
              1. Identidad Personal
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <UFormField label="Nombre" name="name" required>
                <UInput
                  v-model="formState.name"
                  placeholder="Ej: Lucía"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Apellido" name="lastname" required>
                <UInput
                  v-model="formState.lastname"
                  placeholder="Ej: Fernández"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <UFormField label="DNI (Documento de Identidad)" name="dni" required help="Número sin puntos ni espacios (único)">
                <UInput
                  v-model="formState.dni"
                  placeholder="Ej: 38456123"
                  class="w-full font-mono"
                />
              </UFormField>

              <UFormField label="Fecha de Nacimiento" name="daybirth">
                <UInput
                  v-model="formState.daybirth"
                  type="date"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- BLOQUE 2: Contacto & Residencia -->
          <div class="space-y-3 pt-3 border-t border-[#2A2A38]">
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5" />
              2. Contacto &amp; Localidad
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <UFormField label="Celular (WhatsApp)" name="phone" help="Número con código de área (ej: 3415551234)">
                <UInput
                  v-model="formState.phone"
                  placeholder="Ej: 3415551234"
                  icon="i-heroicons-phone"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Correo Electrónico" name="email">
                <UInput
                  v-model="formState.email"
                  type="email"
                  placeholder="lucia@ejemplo.com"
                  icon="i-heroicons-envelope"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <UFormField label="Ciudad de Residencia" name="city">
                <UInput
                  v-model="formState.city"
                  placeholder="Ej: Rosario"
                  icon="i-heroicons-map-pin"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Instagram" name="instagram">
                <UInput
                  v-model="formState.instagram"
                  placeholder="lucia_viajes"
                  icon="i-heroicons-at-symbol"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Contacto de Emergencia" name="emergency_contact" help="Nombre y tel familiar">
                <UInput
                  v-model="formState.emergency_contact"
                  placeholder="Mamá: 341-4445555"
                  icon="i-heroicons-shield-exclamation"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- BLOQUE 3: Preferencias & Intereses Musicales -->
          <div class="space-y-3 pt-3 border-t border-[#2A2A38]">
            <div class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <UIcon name="i-heroicons-musical-note" class="w-3.5 h-3.5" />
              3. Preferencias &amp; Notas Operativas
            </div>

            <UFormField
              label="Intereses Musicales & Tags de Afinidad"
              name="interests"
              help="Escribe el género o banda y presiona Enter o coma para añadir tags."
            >
              <CustomerTagInput v-model="formState.interests" />
            </UFormField>

            <UFormField label="Observaciones Operativas / Notas Médicas" name="notes">
              <UTextarea
                v-model="formState.notes"
                placeholder="Alergias, requerimientos de movilidad reducida, vegetariano, notas del coordinador..."
                rows="2"
                class="w-full"
              />
            </UFormField>

            <!-- Switch de Estado Activo -->
            <label class="flex items-center justify-between p-3 rounded-lg bg-[#14141A] border border-[#2A2A38] cursor-pointer">
              <div>
                <div class="text-xs font-bold text-[#F5EEDC]">Estado del Cliente</div>
                <div class="text-[11px] text-zinc-400">Si está inactivo, no figurará para asignaciones operativas en manifiestos.</div>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="formState.is_active"
                  type="checkbox"
                  class="rounded bg-[#0F0F12] border-[#2A2A38] text-[#E53924] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span class="text-xs font-semibold" :class="formState.is_active ? 'text-emerald-400' : 'text-zinc-500'">
                  {{ formState.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </label>
          </div>

          <!-- Botones de Acción Footer -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A38]">
            <UButton
              type="button"
              variant="ghost"
              color="neutral"
              :disabled="submitting"
              class="cursor-pointer"
              @click="isModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-md shadow-[#E53924]/20 cursor-pointer"
              :loading="submitting"
            >
              {{ isEditing ? 'Guardar Cambios' : 'Registrar Pasajero' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- ============================================================== -->
    <!-- MODAL DE CONFIRMACIÓN DE BAJA / REACTIVACIÓN                   -->
    <!-- ============================================================== -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :title="customerToToggle?.is_active ? '¿Dar de baja al pasajero?' : '¿Reactivar al pasajero?'"
      :description="`${customerToToggle?.lastname}, ${customerToToggle?.name} (DNI: ${customerToToggle?.dni})`"
    >
      <template #body>
        <div class="space-y-4 py-2">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="customerToToggle?.is_active ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'"
            >
              <UIcon
                :name="customerToToggle?.is_active ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-arrow-path-rounded-square'"
                class="w-5 h-5"
              />
            </div>
            <div>
              <p class="text-sm text-zinc-300">
                <template v-if="customerToToggle?.is_active">
                  Esta acción realizará una <strong>baja lógica</strong>. El pasajero pasará a estado inactivo pero se preservará su historial de viajes y datos de contacto en la base de datos.
                </template>
                <template v-else>
                  El pasajero volverá a figurar como <strong>activo</strong> y estará disponible para asignaciones operativas inmediatas.
                </template>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A38]">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="toggling"
              class="cursor-pointer"
              @click="isDeleteModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              :class="customerToToggle?.is_active ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'"
              class="cursor-pointer"
              :loading="toggling"
              @click="handleConfirmToggleStatus"
            >
              {{ customerToToggle?.is_active ? 'Confirmar Baja Lógica' : 'Confirmar Reactivación' }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
