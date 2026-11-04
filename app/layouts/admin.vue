<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const route = useRoute()

// 0. Tablero (principal con borde), 1. Viajes, 2. Ventas, 3. Mensajes
const primaryNavLinks = [
  { label: 'Tablero', to: '/admin', icon: 'i-heroicons-home', isPrimaryHome: true },
  { label: 'Viajes', to: '/admin/viajes', icon: 'i-heroicons-ticket' },
  { label: 'Ventas', to: '/admin/ventas', icon: 'i-heroicons-banknotes' },
  { label: 'Mensajes', to: '/admin/mensajes', icon: 'i-heroicons-chat-bubble-left-right' }
]

// Grupo secundario: Administración (Dropdown)
const adminEntityLinks = [
  { label: 'Clientes', to: '/admin/clientes', icon: 'i-heroicons-users', desc: 'Directorio de pasajeros' },
  { label: 'Recintos', to: '/admin/recintos', icon: 'i-heroicons-building-office-2', desc: 'Estadios y sedes' },
  { label: 'Choferes', to: '/admin/choferes', icon: 'i-heroicons-user-group', desc: 'Conductores de guardia' },
  { label: 'Flota', to: '/admin/transportes', icon: 'i-heroicons-truck', desc: 'Colectivos y combis' },
  { label: 'Merchandising', to: '/admin/merch', icon: 'i-heroicons-shopping-bag', desc: 'Indumentaria y stock oficial' }
]

const loggingOut = ref(false)
const mobileMenuOpen = ref(false)
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Sistema de Temas (Dark / Light Mode) persistente en localStorage y seguro con SSR
const theme = ref<'dark' | 'light'>('dark')

function applyTheme(newTheme: 'dark' | 'light') {
  if (import.meta.client) {
    if (newTheme === 'light') {
      document.documentElement.classList.add('admin-light', 'light')
      document.documentElement.classList.remove('dark')
      document.body.classList.add('admin-light', 'light')
      document.body.classList.remove('dark')
    } else {
      document.documentElement.classList.remove('admin-light', 'light')
      document.documentElement.classList.add('dark')
      document.body.classList.remove('admin-light', 'light')
      document.body.classList.add('dark')
    }
  }
}

useHead(() => ({
  htmlAttrs: {
    class: theme.value === 'light' ? 'admin-light light' : 'dark'
  }
}))

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('tripu_admin_theme')
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    }
    applyTheme(theme.value)
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside)
    // Limpieza al salir del panel admin para que la web pública permanezca siempre en dark mode
    document.documentElement.classList.remove('admin-light', 'light')
    document.documentElement.classList.add('dark')
    document.body.classList.remove('admin-light', 'light')
    document.body.classList.add('dark')
  }
})

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  if (import.meta.client) {
    localStorage.setItem('tripu_admin_theme', theme.value)
    applyTheme(theme.value)
  }
}

// Cierre del dropdown al hacer clic fuera del elemento
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

// Detección reactiva de si alguna ruta secundaria de Administración está activa
const isEntityActive = computed(() => {
  return adminEntityLinks.some(link => route.path === link.to || route.path.startsWith(`${link.to}/`))
})

// Cierre automático al navegar entre rutas
watch(() => route.path, () => {
  isDropdownOpen.value = false
  mobileMenuOpen.value = false
})

async function handleLogout() {
  loggingOut.value = true
  let remoteLogoutFailed = false

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      remoteLogoutFailed = true
      console.warn('Revocación remota en Supabase falló, procediendo a purga local:', error.message)
    }
  } catch (err: any) {
    remoteLogoutFailed = true
    console.warn('Excepción de red al cerrar sesión:', err?.message)
  } finally {
    // Forzamos la limpieza reactiva en Nuxt y purga de cachés en memoria
    user.value = null
    useDrivers().clearDriversState()
    useTransports().clearTransportsState()
    useVenues().clearVenuesState()
    useEvents().clearEventsState()
    useCustomers().clearCustomersState()
    useSales().clearSalesState()
    useMerch().clearMerchState()
    loggingOut.value = false

    if (remoteLogoutFailed) {
      toast.add({
        title: 'Sesión cerrada localmente',
        description: 'No se pudo contactar al servidor, pero tu sesión en este dispositivo fue cerrada de forma segura.',
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle'
      })
    } else {
      toast.add({
        title: 'Sesión finalizada',
        description: 'Has cerrado sesión correctamente.',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }

    // Redirigir siempre fuera del panel protegido
    await navigateTo('/admin/login')
  }
}
</script>

<template>
  <div id="admin-layout" :data-theme="theme" class="min-h-screen flex flex-col font-sans transition-colors duration-200"
    :class="theme === 'dark' ? 'bg-[#0F0F12] text-[#F5EEDC]' : 'bg-[#F5F6F8] text-[#18181B]'">
    <!-- Barra Superior de Navegación -->
    <header class="sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200"
      :class="theme === 'dark' ? 'bg-[#1A1A22]/90 border-[#2A2A38]' : 'bg-white/95 border-[#E2E4E9] shadow-xs'">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo y Navegación Principal -->
          <div class="flex items-center gap-6">
            <NuxtLink to="/admin" class="flex items-center gap-2.5 focus:outline-none shrink-0">
              <div
                class="w-8 h-8 rounded-lg bg-[#E53924] flex items-center justify-center shadow-md shadow-[#E53924]/20">
                <span class="text-white font-black text-sm">T</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-black text-lg tracking-tight transition-colors"
                  :class="theme === 'dark' ? 'text-[#F5EEDC]' : 'text-[#18181B]'">
                  TRIPU <span class="text-[#E53924]">ADMIN</span>
                </span>
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/30 font-semibold uppercase tracking-wider hidden sm:inline-block">
                  Operador
                </span>
              </div>
            </NuxtLink>

            <!-- Links de Navegación Desktop -->
            <nav class="hidden md:flex items-center gap-1.5">
              <!-- Accesos Principales: 0. Tablero (borde estático), 1. Viajes, 2. Ventas, 3. Mensajes -->
              <NuxtLink v-for="link in primaryNavLinks" :key="link.to" :to="link.to"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                :class="[
                  link.isPrimaryHome
                    ? (theme === 'dark'
                      ? 'border border-zinc-500/60 shadow-xs'
                      : 'border border-zinc-300 shadow-xs')
                    : 'border border-transparent',
                  route.path === link.to
                    ? (theme === 'dark' ? 'text-[#F5EEDC] bg-[#2A2A38] font-semibold' : 'text-[#18181B] bg-[#F0F1F4] font-semibold')
                    : (theme === 'dark' ? 'text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#2A2A38]/50' : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F0F1F4]')
                ]">
                <UIcon :name="link.icon" class="w-4 h-4" />
                <span>{{ link.label }}</span>
              </NuxtLink>

              <!-- Grupo Secundario: Administración (Dropdown) -->
              <div ref="dropdownRef" class="relative">
                <button type="button"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer select-none border"
                  :class="[
                    isEntityActive
                      ? (theme === 'dark'
                        ? 'text-[#F5EEDC] bg-[#2A2A38] font-semibold border-zinc-600/50'
                        : 'text-[#18181B] bg-[#F0F1F4] font-semibold border-zinc-300')
                      : (theme === 'dark'
                        ? 'text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#2A2A38]/50 border-transparent'
                        : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F0F1F4] border-transparent')
                  ]" :aria-expanded="isDropdownOpen" aria-haspopup="true" title="Gestión de Entidades del Sistema"
                  @click="isDropdownOpen = !isDropdownOpen">
                  <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4 text-[#E53924]" />
                  <span>Administración</span>
                  <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 transition-transform duration-200"
                    :class="isDropdownOpen ? 'rotate-180' : ''" />
                </button>

                <!-- Panel Flotante del Dropdown -->
                <Transition enter-active-class="transition duration-150 ease-out"
                  enter-from-class="transform scale-95 opacity-0 -translate-y-1"
                  enter-to-class="transform scale-100 opacity-100 translate-y-0"
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="transform scale-100 opacity-100 translate-y-0"
                  leave-to-class="transform scale-95 opacity-0 -translate-y-1">
                  <div v-if="isDropdownOpen"
                    class="absolute left-0 mt-2 w-56 rounded-xl py-1.5 z-50 shadow-2xl transition-colors duration-150"
                    :class="theme === 'dark'
                      ? 'bg-[#1A1A22] border border-[#2A2A38]'
                      : 'bg-white border border-[#E2E4E9] shadow-lg'">
                    <div class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                      :class="theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'">
                      Gestión Operativa
                    </div>
                    <NuxtLink v-for="item in adminEntityLinks" :key="item.to" :to="item.to"
                      class="flex items-center gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer" :class="[
                        route.path === item.to || route.path.startsWith(`${item.to}/`)
                          ? (theme === 'dark' ? 'text-[#F5EEDC] bg-[#2A2A38] font-bold' : 'text-[#18181B] bg-[#F0F1F4] font-bold')
                          : (theme === 'dark' ? 'text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#2A2A38]/60' : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F0F1F4]')
                      ]" @click="isDropdownOpen = false">
                      <UIcon :name="item.icon" class="w-4 h-4 text-[#E53924] shrink-0" />
                      <div class="flex flex-col">
                        <span class="font-semibold">{{ item.label }}</span>
                        <span class="text-[10px] text-zinc-500">{{ item.desc }}</span>
                      </div>
                    </NuxtLink>
                  </div>
                </Transition>
              </div>
            </nav>
          </div>

          <!-- Acciones de Usuario, Selector de Tema y Logout -->
          <!-- Separación segura de 50px respecto a los links de navegación -->
          <div class="hidden md:flex items-center gap-3.5 ml-[75px] shrink-0">
            <!-- Zona 1: Herramientas de Interfaz (Ver Web y Selector de Tema) -->
            <div class="flex items-center gap-1.5">
              <!-- Botón de Enlace a Web Pública -->
              <NuxtLink to="/" target="_blank"
                class="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                :class="theme === 'dark'
                  ? 'text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#2A2A38]/40'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#E2E4E9]/60'"
                title="Abrir web pública en nueva pestaña">
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                <span>Ver Web</span>
              </NuxtLink>

              <!-- Selector de Tema (Dark / Light Mode) -->
              <button type="button"
                class="p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center" :class="theme === 'dark'
                  ? 'bg-[#0F0F12] border-[#2A2A38] text-amber-400 hover:border-zinc-500 hover:bg-[#20202B]'
                  : 'bg-[#F0F1F4] border-[#E2E4E9] text-amber-600 hover:border-zinc-400 hover:bg-white'"
                :aria-label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                :title="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" @click="toggleTheme">
                <UIcon :name="theme === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                  class="w-4 h-4 transition-transform duration-200" />
              </button>
            </div>

            <!-- Separador visual de protección / buffer entre utilidades y sesión -->
            <div class="h-5 w-px transition-colors" :class="theme === 'dark' ? 'bg-[#2A2A38]' : 'bg-[#E2E4E9]'"
              aria-hidden="true" />

            <!-- Zona 2: Identidad y Sesión (Operador Activo y Logout) -->
            <div class="flex items-center gap-2.5">
              <!-- Operador Activo -->
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors select-none"
                :class="theme === 'dark'
                  ? 'bg-[#0F0F12] border-[#2A2A38] text-zinc-300'
                  : 'bg-[#F0F1F4] border-[#E2E4E9] text-[#18181B]'">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span class="font-medium truncate max-w-[150px] lg:max-w-[180px]" :title="user?.email || ''">
                  {{ user?.email || 'Operador' }}
                </span>
              </div>

              <!-- Botón Logout Destacado -->
              <UButton size="sm" variant="solid" color="error"
                class="bg-red-600/90 hover:bg-red-600 text-white font-semibold cursor-pointer shadow-sm shadow-red-900/30 flex items-center gap-1.5 px-3 transition-transform active:scale-95"
                icon="i-heroicons-arrow-right-on-rectangle" :loading="loggingOut" @click="handleLogout">
                <span>Cerrar Sesión</span>
              </UButton>
            </div>
          </div>

          <!-- Acciones en Móvil -->
          <div class="flex md:hidden items-center gap-2">
            <!-- Toggle Tema Móvil -->
            <button type="button"
              class="p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer" :class="theme === 'dark'
                ? 'bg-[#0F0F12] border-[#2A2A38] text-amber-400'
                : 'bg-[#F0F1F4] border-[#E2E4E9] text-amber-600'"
              :aria-label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              :title="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" @click="toggleTheme">
              <UIcon :name="theme === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-4 h-4" />
            </button>

            <!-- Botón Logout Rápido en Móvil -->
            <UButton size="xs" variant="subtle" color="error" icon="i-heroicons-arrow-right-on-rectangle"
              :loading="loggingOut" title="Cerrar Sesión" aria-label="Cerrar Sesión" @click="handleLogout" />

            <!-- Botón de Menú Móvil -->
            <UButton size="sm" variant="ghost" color="neutral" icon="i-heroicons-bars-3"
              aria-label="Abrir menú de navegación" @click="mobileMenuOpen = !mobileMenuOpen" />
          </div>
        </div>
      </div>

      <!-- Menú Desplegable Móvil -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t px-4 pt-3 pb-5 space-y-3 transition-colors duration-200"
        :class="theme === 'dark' ? 'border-[#2A2A38] bg-[#1A1A22]' : 'border-[#E2E4E9] bg-white shadow-lg'">
        <!-- Navegación: Accesos Principales -->
        <nav class="space-y-1">
          <NuxtLink v-for="link in primaryNavLinks" :key="link.to" :to="link.to"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer" :class="[
              link.isPrimaryHome
                ? (theme === 'dark' ? 'border border-zinc-500/60' : 'border border-zinc-300')
                : 'border border-transparent',
              route.path === link.to
                ? (theme === 'dark' ? 'bg-[#2A2A38] text-[#F5EEDC] font-semibold' : 'bg-[#F0F1F4] text-[#18181B] font-semibold')
                : (theme === 'dark' ? 'text-zinc-300 hover:bg-[#2A2A38]' : 'text-[#71717A] hover:bg-[#F0F1F4] hover:text-[#18181B]')
            ]" @click="mobileMenuOpen = false">
            <UIcon :name="link.icon" class="w-4 h-4 text-[#E53924]" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </nav>

        <!-- Navegación: Grupo Secundario Administración -->
        <div class="pt-2 border-t" :class="theme === 'dark' ? 'border-[#2A2A38]' : 'border-[#E2E4E9]'">
          <div class="px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            :class="theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'">
            Administración
          </div>
          <nav class="space-y-1 mt-1 pl-2">
            <NuxtLink v-for="item in adminEntityLinks" :key="item.to" :to="item.to"
              class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer" :class="[
                route.path === item.to || route.path.startsWith(`${item.to}/`)
                  ? (theme === 'dark' ? 'bg-[#2A2A38] text-[#F5EEDC] font-semibold' : 'bg-[#F0F1F4] text-[#18181B] font-semibold')
                  : (theme === 'dark' ? 'text-zinc-300 hover:bg-[#2A2A38]' : 'text-[#71717A] hover:bg-[#F0F1F4] hover:text-[#18181B]')
              ]" @click="mobileMenuOpen = false">
              <UIcon :name="item.icon" class="w-4 h-4 text-[#E53924]" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Acciones Inferiores del Menú Móvil -->
        <div class="pt-3 border-t flex items-center justify-between text-xs"
          :class="theme === 'dark' ? 'border-[#2A2A38]' : 'border-[#E2E4E9]'">
          <div class="flex items-center gap-2">
            <button type="button"
              class="p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              :class="theme === 'dark' ? 'bg-[#0F0F12] border-[#2A2A38] text-amber-400' : 'bg-[#F0F1F4] border-[#E2E4E9] text-amber-600'"
              @click="toggleTheme">
              <UIcon :name="theme === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-4 h-4" />
              <span>{{ theme === 'dark' ? 'Oscuro' : 'Claro' }}</span>
            </button>
            <NuxtLink to="/" target="_blank"
              class="p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs cursor-pointer"
              :class="theme === 'dark' ? 'bg-[#0F0F12] border-[#2A2A38] text-zinc-400' : 'bg-[#F0F1F4] border-[#E2E4E9] text-zinc-600'"
              title="Ver Web Pública">
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
              <span>Web</span>
            </NuxtLink>
          </div>

          <UButton size="xs" variant="ghost" color="error" :loading="loggingOut" class="cursor-pointer"
            @click="handleLogout">
            Cerrar Sesión
          </UButton>
        </div>
      </div>
    </header>

    <!-- Contenedor Principal de la Página -->
    <main class="flex-1 max-w-8xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <slot />
    </main>

    <!-- Pie de Página Operativo -->
    <footer class="border-t py-4 text-center text-xs transition-colors duration-200" :class="theme === 'dark'
      ? 'border-[#2A2A38] bg-[#0F0F12] text-zinc-600'
      : 'border-[#E2E4E9] bg-white text-zinc-500'">
      <span>Tripu System v1.2.2 — Panel Operativo Interno — Tripu Producciones</span>
    </footer>
  </div>
</template>
