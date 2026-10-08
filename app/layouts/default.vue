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
  <div
    class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] flex flex-col font-sans selection:bg-[#E53924] selection:text-[#F5EEDC]">
    <!-- MARQUEE SUPERIOR: EXPERIENCIA, WHATSAPP E INSTAGRAM -->
    <div
      class="bg-[#14141B] border-b border-[#2A2A38] py-2 text-xs text-zinc-300 overflow-hidden select-none relative z-50">
      <NuxtMarquee :pause-on-hover="true" :auto-fill="true" :speed="45" play>
        <div class="flex items-center gap-8 px-4 text-xs font-semibold tracking-wide">
          <!-- Frase oficial -->
          <span class="inline-flex items-center gap-2 text-[#F5EEDC] uppercase font-black tracking-wider">
            <span class="text-[#E53924]">✦</span>
            <span>El Viaje como parte de la Experiencia</span>
          </span>

          <span class="text-zinc-600">•</span>

          <!-- WhatsApp -->
          <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#25D366] transition-colors group"
            title="Escribinos por WhatsApp">
            <svg class="w-3.5 h-3.5 text-[#25D366] group-hover:scale-110 transition-transform shrink-0"
              viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.979-.276-.1-.476-.15-.677.15-.201.3-.778.98-1.028 1.256-.251.275-.502.3-.803.15-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.134.301-.35.452-.526.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.245-.587-.494-.508-.677-.517-.175-.009-.376-.009-.577-.009-.201 0-.527.075-.803.376-.276.3-1.054 1.029-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.146 4.549.719.311 1.28.497 1.718.636.723.23 1.381.198 1.901.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 21.75c-1.737 0-3.385-.45-4.834-1.242l-.347-.19-3.601.944.961-3.51-.225-.358a9.69 9.69 0 0 1-1.487-5.184c0-5.385 4.383-9.768 9.77-9.768 2.61 0 5.064 1.018 6.91 2.864a9.72 9.72 0 0 1 2.858 6.904c0 5.386-4.384 9.77-9.769 9.77zm8.307-16.598A11.66 11.66 0 0 0 12.04 1.75C5.419 1.75.029 7.14.029 13.76c0 2.112.55 4.174 1.597 5.992L0 23.75l4.116-1.583a11.96 11.96 0 0 0 5.924 1.583c6.621 0 12.01-5.39 12.01-12.01 0-3.21-1.25-6.226-3.703-8.588z" />
            </svg>
            <span class="font-mono text-[11px] font-bold text-[#25D366]"> +54 9 3564 000000</span>
          </a>

          <span class="text-zinc-600">•</span>

          <!-- Instagram -->
          <a href="https://www.instagram.com/tripuproducciones/" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#FD1D1D] transition-colors group"
            title="Seguinos en Instagram @tripuproducciones">
            <svg class="w-3.5 h-3.5 text-[#FD1D1D] group-hover:scale-110 transition-transform shrink-0"
              viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span class="text-[11px] text-zinc-300">@tripuproducciones</span>
          </a>
        </div>
      </NuxtMarquee>
    </div>

    <!-- NAVBAR PÚBLICA -->
    <header class="sticky top-0 z-40 bg-[#0F0F12]/90 backdrop-blur-md border-b border-[#2A2A38]/60 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <!-- Logo Oficial Tripu -->
          <NuxtLink to="/" class="flex items-center gap-3 focus:outline-none group">
            <img src="/branding/logo-tripu-horizontal-sm.webp" alt="Tripu Producciones" width="176" height="44"
              class="h-9 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />
          </NuxtLink>

          <!-- Links Desktop -->
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
              class="text-sm font-medium text-zinc-300 hover:text-[#F5EEDC] hover:text-[#E53924] transition-colors">
              {{ link.label }}
            </NuxtLink>
          </nav>

          <!-- Acciones Derecha -->
          <div class="hidden sm:flex items-center gap-2.5">
            <!-- Redireccionamiento claro a Instagram oficial -->
            <a href="https://www.instagram.com/tripuproducciones/" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#833AB4]/15 via-[#FD1D1D]/15 to-[#F77737]/15 hover:from-[#833AB4]/25 hover:via-[#FD1D1D]/25 hover:to-[#F77737]/25 border border-[#FD1D1D]/40 text-[#F5EEDC] hover:text-white transition-all group shadow-sm hover:shadow-[#FD1D1D]/20"
              title="Seguinos en Instagram @tripuproducciones">
              <svg class="w-4 h-4 text-[#FD1D1D] group-hover:scale-110 transition-transform shrink-0"
                viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </a>

            <!-- WhatsApp -->
            <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] transition-all">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.979-.276-.1-.476-.15-.677.15-.201.3-.778.98-1.028 1.256-.251.275-.502.3-.803.15-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.134.301-.35.452-.526.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.245-.587-.494-.508-.677-.517-.175-.009-.376-.009-.577-.009-.201 0-.527.075-.803.376-.276.3-1.054 1.029-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.146 4.549.719.311 1.28.497 1.718.636.723.23 1.381.198 1.901.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 21.75c-1.737 0-3.385-.45-4.834-1.242l-.347-.19-3.601.944.961-3.51-.225-.358a9.69 9.69 0 0 1-1.487-5.184c0-5.385 4.383-9.768 9.77-9.768 2.61 0 5.064 1.018 6.91 2.864a9.72 9.72 0 0 1 2.858 6.904c0 5.386-4.384 9.77-9.769 9.77zm8.307-16.598A11.66 11.66 0 0 0 12.04 1.75C5.419 1.75.029 7.14.029 13.76c0 2.112.55 4.174 1.597 5.992L0 23.75l4.116-1.583a11.96 11.96 0 0 0 5.924 1.583c6.621 0 12.01-5.39 12.01-12.01 0-3.21-1.25-6.226-3.703-8.588z" />
              </svg>
              <span>WhatsApp</span>
            </a>

          </div>

          <!-- Botón Menú Mobile -->
          <div class="flex sm:hidden items-center">
            <button type="button" :aria-label="mobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'"
              :aria-expanded="mobileMenuOpen"
              class="p-2 rounded-lg text-zinc-400 hover:text-[#F5EEDC] hover:bg-[#1A1A22]"
              @click="mobileMenuOpen = !mobileMenuOpen">
              <UIcon :name="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Menú Desplegable Mobile -->
      <div v-if="mobileMenuOpen" class="sm:hidden border-t border-[#2A2A38] bg-[#14141B] px-4 pt-3 pb-6 space-y-3">
        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
          class="block py-2 text-sm font-semibold text-zinc-300 hover:text-[#E53924]" @click="mobileMenuOpen = false">
          {{ link.label }}
        </NuxtLink>
        <div class="pt-3 border-t border-[#2A2A38] flex flex-col gap-2">
          <!-- Botón Instagram Mobile -->
          <a href="https://www.instagram.com/tripuproducciones/" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase bg-gradient-to-r from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#F77737]/20 border border-[#FD1D1D]/40 text-[#F5EEDC]">
            <svg class="w-4 h-4 text-[#FD1D1D]" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Seguinos en Instagram</span>
          </a>

          <!-- Botón WhatsApp Mobile -->
          <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366]">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.979-.276-.1-.476-.15-.677.15-.201.3-.778.98-1.028 1.256-.251.275-.502.3-.803.15-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.134.301-.35.452-.526.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.245-.587-.494-.508-.677-.517-.175-.009-.376-.009-.577-.009-.201 0-.527.075-.803.376-.276.3-1.054 1.029-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.146 4.549.719.311 1.28.497 1.718.636.723.23 1.381.198 1.901.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 21.75c-1.737 0-3.385-.45-4.834-1.242l-.347-.19-3.601.944.961-3.51-.225-.358a9.69 9.69 0 0 1-1.487-5.184c0-5.385 4.383-9.768 9.77-9.768 2.61 0 5.064 1.018 6.91 2.864a9.72 9.72 0 0 1 2.858 6.904c0 5.386-4.384 9.77-9.769 9.77zm8.307-16.598A11.66 11.66 0 0 0 12.04 1.75C5.419 1.75.029 7.14.029 13.76c0 2.112.55 4.174 1.597 5.992L0 23.75l4.116-1.583a11.96 11.96 0 0 0 5.924 1.583c6.621 0 12.01-5.39 12.01-12.01 0-3.21-1.25-6.226-3.703-8.588z" />
            </svg>
            <span>Consultar por WhatsApp</span>
          </a>

          <NuxtLink to="/admin/login"
            class="flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 hover:text-[#F5EEDC]"
            @click="mobileMenuOpen = false">
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
            <img src="/branding/logo-tripu-horizontal-sm.webp" alt="Tripu Producciones" width="160" height="40"
              class="h-10 w-auto object-contain" />
            <p class="text-xs sm:text-sm text-zinc-400 max-w-sm">
              Viajes organizados, traslados seguros y experiencias completas a los mejores recitales y festivales de
              música de Argentina.
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
              <li>
                <NuxtLink to="/contacto" class="hover:text-[#E53924] transition-colors">Atención al Pasajero</NuxtLink>
              </li>
              <li><a href="#experiencia" class="hover:text-[#E53924] transition-colors">La Experiencia Tripu</a></li>
              <li><a href="#faq" class="hover:text-[#E53924] transition-colors">Preguntas Frecuentes</a></li>
              <li>
                <NuxtLink to="/admin/login" class="hover:text-[#E53924] transition-colors">Portal Operador</NuxtLink>
              </li>
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
              <a href="https://wa.me/5493564000000" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-2 hover:text-[#25D366] transition-colors" title="Contactanos por WhatsApp">
                <svg class="w-4 h-4 text-[#25D366] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.979-.276-.1-.476-.15-.677.15-.201.3-.778.98-1.028 1.256-.251.275-.502.3-.803.15-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.134.301-.35.452-.526.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.245-.587-.494-.508-.677-.517-.175-.009-.376-.009-.577-.009-.201 0-.527.075-.803.376-.276.3-1.054 1.029-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.146 4.549.719.311 1.28.497 1.718.636.723.23 1.381.198 1.901.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 21.75c-1.737 0-3.385-.45-4.834-1.242l-.347-.19-3.601.944.961-3.51-.225-.358a9.69 9.69 0 0 1-1.487-5.184c0-5.385 4.383-9.768 9.77-9.768 2.61 0 5.064 1.018 6.91 2.864a9.72 9.72 0 0 1 2.858 6.904c0 5.386-4.384 9.77-9.769 9.77zm8.307-16.598A11.66 11.66 0 0 0 12.04 1.75C5.419 1.75.029 7.14.029 13.76c0 2.112.55 4.174 1.597 5.992L0 23.75l4.116-1.583a11.96 11.96 0 0 0 5.924 1.583c6.621 0 12.01-5.39 12.01-12.01 0-3.21-1.25-6.226-3.703-8.588z" />
                </svg>
                <span>WhatsApp: +54 9 3564 000000</span>
              </a>
              <a href="https://www.instagram.com/tripuproducciones/" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-2 hover:text-[#FD1D1D] transition-colors"
                title="Seguinos en Instagram @tripuproducciones">
                <svg class="w-4 h-4 text-[#FD1D1D] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram: @tripuproducciones</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Barra Inferior de Copyright y Enlaces Legales -->
        <div
          class="pt-8 border-t border-[#1A1A22] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <p>© {{ new Date().getFullYear() }} Tripu Producciones. Todos los derechos reservados.</p>
          <div class="flex items-center flex-wrap justify-center gap-3 text-zinc-400">
            <NuxtLink to="/terminos-y-condiciones" class="hover:text-[#E53924] transition-colors">Términos y Condiciones
            </NuxtLink>
            <span class="text-zinc-600">•</span>
            <NuxtLink to="/politica-de-privacidad" class="hover:text-[#E53924] transition-colors">Política de Privacidad
            </NuxtLink>
          </div>
          <p class="text-zinc-500 italic">
            "El viaje es parte de la experiencia"
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
