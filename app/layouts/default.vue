<script setup lang="ts">
const mobileMenuOpen = ref(false)

const navLinks = [
  { label: 'Próximos Shows', to: '/#proximos-shows', icon: 'i-heroicons-musical-note' },
  { label: 'La Experiencia', to: '/#experiencia', icon: 'i-heroicons-sparkles' },
  { label: 'Preguntas Frecuentes', to: '/#faq', icon: 'i-heroicons-question-mark-circle' },
  { label: 'Contacto', to: '/contacto', icon: 'i-heroicons-chat-bubble-bottom-center-text' }
]
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] flex flex-col font-sans selection:bg-[#E53924] selection:text-[#F5EEDC]">
    <!-- NAVBAR PÚBLICA -->
    <header class="sticky top-0 z-50 bg-[#0F0F12]/90 backdrop-blur-md border-b border-[#2A2A38]/60 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <!-- Logo Oficial Tripu -->
          <NuxtLink to="/" class="flex items-center gap-3 focus:outline-none group">
            <img
              src="/branding/logo-tripu-horizontal-sm.webp"
              alt="Tripu Producciones"
              width="176"
              height="44"
              class="h-9 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </NuxtLink>

          <!-- Links Desktop -->
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-sm font-medium text-zinc-300 hover:text-[#F5EEDC] hover:text-[#E53924] transition-colors"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <!-- Acciones Derecha -->
          <div class="hidden sm:flex items-center gap-3">
            <a
              href="https://wa.me/5493564000000"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] transition-all"
            >
              <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <NuxtLink
              to="/admin/login"
              class="text-xs text-zinc-400 hover:text-[#F5EEDC] p-2.5 rounded-xl hover:bg-[#1A1A22] border border-transparent hover:border-[#2A2A38] transition-colors"
              title="Acceso al Panel de Control"
              aria-label="Acceso al Panel de Control de Operadores"
            >
              <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
            </NuxtLink>
          </div>

          <!-- Botón Menú Mobile -->
          <div class="flex sm:hidden items-center">
            <button
              type="button"
              :aria-label="mobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'"
              :aria-expanded="mobileMenuOpen"
              class="p-2 rounded-lg text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#1A1A22]"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <UIcon :name="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Menú Desplegable Mobile -->
      <div
        v-if="mobileMenuOpen"
        class="sm:hidden border-t border-[#2A2A38] bg-[#14141B] px-4 pt-3 pb-6 space-y-3"
      >
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="block py-2 text-sm font-semibold text-zinc-300 hover:text-[#E53924]"
          @click="mobileMenuOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="pt-3 border-t border-[#2A2A38] flex flex-col gap-2">
          <a
            href="https://wa.me/5493564000000"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366]"
          >
            <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
          </a>
          <NuxtLink
            to="/admin/login"
            class="flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 hover:text-[#F5EEDC]"
            @click="mobileMenuOpen = false"
          >
            <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
            <span>Acceso Operadores</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- FOOTER INSTITUCIONAL -->
    <footer class="bg-[#0A0A0D] border-t border-[#2A2A38] mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Columna 1: Brand & Misión -->
          <div class="md:col-span-2 space-y-4">
            <img
              src="/branding/logo-tripu-horizontal-sm.webp"
              alt="Tripu Producciones"
              width="160"
              height="40"
              class="h-10 w-auto object-contain"
            />
            <p class="text-xs sm:text-sm text-zinc-400 max-w-sm">
              Viajes organizados, traslados seguros y experiencias completas a los mejores recitales y festivales de música de Argentina.
            </p>
            <div class="flex items-center gap-2 text-xs text-[#E53924] font-bold uppercase tracking-wider">
              <span>●</span>
              <span>San Francisco, Córdoba • Rosario • Buenos Aires</span>
            </div>
          </div>

          <!-- Columna 2: Enlaces Rápidos -->
          <div class="space-y-3">
            <h4 class="text-xs font-black uppercase tracking-widest text-[#F5EEDC]">
              Explorar
            </h4>
            <ul class="space-y-2 text-xs text-zinc-400">
              <li><a href="#proximos-shows" class="hover:text-[#E53924] transition-colors">Próximos Viajes</a></li>
              <li><NuxtLink to="/contacto" class="hover:text-[#E53924] transition-colors">Atención al Pasajero</NuxtLink></li>
              <li><a href="#experiencia" class="hover:text-[#E53924] transition-colors">La Experiencia Tripu</a></li>
              <li><a href="#faq" class="hover:text-[#E53924] transition-colors">Preguntas Frecuentes</a></li>
              <li><NuxtLink to="/admin/login" class="hover:text-[#E53924] transition-colors">Portal Operador</NuxtLink></li>
            </ul>
          </div>

          <!-- Columna 3: Contacto & Redes -->
          <div class="space-y-3">
            <h4 class="text-xs font-black uppercase tracking-widest text-[#F5EEDC]">
              Contacto
            </h4>
            <div class="space-y-2 text-xs text-zinc-400">
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-[#E53924]" />
                <span>San Francisco, Córdoba</span>
              </p>
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-chat-bubble-oval-left" class="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp: +54 9 3564 000000</span>
              </p>
              <p class="flex items-center gap-2">
                <UIcon name="i-heroicons-camera" class="w-4 h-4 text-[#FF5733]" />
                <span>Instagram: @tripuproducciones</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Barra Inferior de Copyright y Enlaces Legales -->
        <div class="pt-8 border-t border-[#1A1A22] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <p>© {{ new Date().getFullYear() }} Tripu Producciones. Todos los derechos reservados.</p>
          <div class="flex items-center flex-wrap justify-center gap-3 text-zinc-400">
            <NuxtLink to="/terminos-y-condiciones" class="hover:text-[#E53924] transition-colors">Términos y Condiciones</NuxtLink>
            <span class="text-zinc-600">•</span>
            <NuxtLink to="/politica-de-privacidad" class="hover:text-[#E53924] transition-colors">Política de Privacidad</NuxtLink>
          </div>
          <p class="text-zinc-500 italic">
            "El viaje es parte de la experiencia"
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
