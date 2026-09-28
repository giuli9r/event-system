<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] flex flex-col justify-center items-center px-4">
    <div class="max-w-xl w-full text-center space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-medium text-[#E53924]">
        <span>●</span>
        <span>Tripu System v0.1.0</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-black tracking-tight text-[#F5EEDC]">
        TRIPU <span class="text-[#E53924]">PRODUCCIONES</span>
      </h1>

      <p class="text-sm md:text-base text-zinc-400">
        Plataforma web de traslados y experiencias a recitales y festivales de música.
      </p>

      <div class="p-6 bg-[#1A1A22] border border-[#2A2A38] rounded-2xl shadow-xl text-left space-y-4">
        <h3 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Estado del Stack Tecnológico
        </h3>
        <ul class="text-xs space-y-2 text-zinc-400">
          <li class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span> Nuxt 3 / Nuxt 4 inicializado con éxito
          </li>
          <li class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span> Nuxt UI & Tailwind CSS integrados
          </li>
          <li class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span> Módulo Supabase conectado con RLS
          </li>
          <li class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span> Validación Zod y Sitemap preparados
          </li>
        </ul>
      </div>

      <div class="flex flex-wrap justify-center gap-3 pt-2">
        <UButton
          to="https://ui.nuxt.com"
          target="_blank"
          variant="solid"
          color="primary"
          icon="i-heroicons-arrow-top-right-on-square"
        >
          Documentación Nuxt UI
        </UButton>
        <UButton
          to="/admin/login"
          variant="outline"
          color="neutral"
          icon="i-heroicons-lock-closed"
        >
          Acceso Administrador
        </UButton>
      </div>
    </div>
  </div>
</template>
