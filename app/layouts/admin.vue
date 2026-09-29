<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const navLinks = [
  { label: 'Tablero', to: '/admin', icon: 'i-heroicons-home' },
  { label: 'Viajes', to: '/admin/viajes', icon: 'i-heroicons-ticket' },
  { label: 'Flota', to: '/admin/transportes', icon: 'i-heroicons-truck' },
  { label: 'Choferes', to: '/admin/choferes', icon: 'i-heroicons-user-group' },
  { label: 'Recintos', to: '/admin/recintos', icon: 'i-heroicons-building-office-2' },
  { label: 'Mensajes', to: '/admin/mensajes', icon: 'i-heroicons-chat-bubble-left-right' }
]

const loggingOut = ref(false)
const mobileMenuOpen = ref(false)

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
    // Forzamos la limpieza reactiva en Nuxt
    user.value = null
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
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] flex flex-col">
    <!-- Barra Superior de Navegación -->
    <header class="sticky top-0 z-40 bg-[#1A1A22]/90 backdrop-blur-md border-b border-[#2A2A38]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo y Marca -->
          <div class="flex items-center gap-6">
            <NuxtLink to="/admin" class="flex items-center gap-2.5 focus:outline-none">
              <div class="w-8 h-8 rounded-lg bg-[#E53924] flex items-center justify-center shadow-md shadow-[#E53924]/20">
                <span class="text-white font-black text-sm">T</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-black text-lg tracking-tight text-[#F5EEDC]">
                  TRIPU <span class="text-[#E53924]">ADMIN</span>
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#E53924]/10 text-[#E53924] border border-[#E53924]/30 font-semibold uppercase tracking-wider hidden sm:inline-block">
                  Operador
                </span>
              </div>
            </NuxtLink>

            <!-- Links de Navegación Desktop -->
            <nav class="hidden md:flex items-center gap-1">
              <NuxtLink
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#2A2A38]/50 transition-colors flex items-center gap-1.5"
                active-class="text-[#F5EEDC] bg-[#2A2A38] font-semibold"
              >
                <UIcon :name="link.icon" class="w-4 h-4" />
                <span>{{ link.label }}</span>
              </NuxtLink>
            </nav>
          </div>

          <!-- Acciones de Usuario y Logout -->
          <div class="hidden md:flex items-center gap-3">
            <NuxtLink
              to="/"
              target="_blank"
              class="text-xs text-zinc-400 hover:text-[#F5EEDC] flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#2A2A38]/40 transition-colors"
              title="Abrir web pública en nueva pestaña"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
              <span>Ver Web</span>
            </NuxtLink>

            <!-- Operador Activo -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F0F12] border border-[#2A2A38] text-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span class="text-zinc-300 font-medium truncate max-w-[180px]" :title="user?.email || ''">
                {{ user?.email || 'Operador' }}
              </span>
            </div>

            <!-- Botón Logout Destacado -->
            <UButton
              size="sm"
              variant="solid"
              color="error"
              class="bg-red-600/90 hover:bg-red-600 text-white font-semibold cursor-pointer shadow-sm shadow-red-900/30 flex items-center gap-1.5 px-3"
              icon="i-heroicons-arrow-right-on-rectangle"
              :loading="loggingOut"
              @click="handleLogout"
            >
              <span>Cerrar Sesión</span>
            </UButton>
          </div>

          <!-- Acciones en Móvil -->
          <div class="flex md:hidden items-center gap-2">
            <!-- Botón Logout Rápido en Móvil -->
            <UButton
              size="xs"
              variant="subtle"
              color="error"
              icon="i-heroicons-arrow-right-on-rectangle"
              :loading="loggingOut"
              title="Cerrar Sesión"
              @click="handleLogout"
            />
            <!-- Botón de Menú Móvil -->
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-bars-3"
              @click="mobileMenuOpen = !mobileMenuOpen"
            />
          </div>
        </div>
      </div>

      <!-- Menú Desplegable Móvil -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-[#2A2A38] bg-[#1A1A22] px-4 pt-3 pb-4 space-y-2">
        <nav class="space-y-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-[#2A2A38] transition-colors"
            active-class="bg-[#2A2A38] text-[#F5EEDC] font-semibold"
            @click="mobileMenuOpen = false"
          >
            <UIcon :name="link.icon" class="w-4 h-4 text-[#E53924]" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </nav>

        <div class="pt-3 border-t border-[#2A2A38] flex items-center justify-between text-xs">
          <span class="text-zinc-400 truncate">{{ user?.email }}</span>
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            :loading="loggingOut"
            @click="handleLogout"
          >
            Cerrar Sesión
          </UButton>
        </div>
      </div>
    </header>

    <!-- Contenedor Principal de la Página -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Pie de Página Operativo -->
    <footer class="border-t border-[#2A2A38] bg-[#0F0F12] py-4 text-center text-xs text-zinc-600">
      <span>Tripu System v0.4.0 — Panel Operativo Interno — Tripu Producciones</span>
    </footer>
  </div>
</template>
