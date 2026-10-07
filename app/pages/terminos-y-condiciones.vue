<script setup lang="ts">
useSeoMeta({
  title: 'Términos y Condiciones de Contratación',
  description: 'Bases y condiciones de contratación para los viajes, traslados y paquetes a recitales organizados por Tripu Producciones.',
  ogTitle: 'Términos y Condiciones | Tripu Producciones',
  ogDescription: 'Bases y condiciones de contratación de viajes a recitales.',
  ogType: 'website'
})
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] py-12 sm:py-16 selection:bg-[#E53924] selection:text-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <!-- Breadcrumb / Volver -->
      <nav aria-label="Navegación secundaria">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#E53924] transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 stroke-[2]" />
          <span>Volver a la cartelera</span>
        </NuxtLink>
      </nav>

      <!-- Encabezado -->
      <header class="space-y-4 border-b border-[#2A2A38] pb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#FF6B55]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#E53924]" />
          <span>Marco Legal y Operativo</span>
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-[#F5EEDC] tracking-tight">
          Términos y Condiciones
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400">
          Última actualización: Octubre de 2026. Al reservar cualquier servicio de traslado o paquete con Tripu Producciones, aceptás los siguientes términos.
        </p>
      </header>

      <!-- Contenido Legal -->
      <main class="space-y-8 text-sm sm:text-base text-zinc-300 leading-relaxed">
        <!-- Sección 1 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">01.</span>
            <span>Naturaleza del Servicio</span>
          </h2>
          <p>
            Tripu Producciones opera como organizador y coordinador de traslados terrestres y paquetes turísticos especiales para eventos musicales, recitales y festivales culturales en la República Argentina, conectando San Francisco (Córdoba) y puntos de influencia con los principales recintos y estadios del país.
          </p>
        </section>

        <!-- Sección 2 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">02.</span>
            <span>Reservas, Señas y Congelamiento de Tarifas</span>
          </h2>
          <ul class="list-disc pl-5 space-y-2 text-zinc-300">
            <li>El lugar en la unidad de transporte solo se considera formalmente reservado una vez acreditado el pago de la seña pactada o el valor total del paquete.</li>
            <li>El pago de la seña congela el valor del pasaje según las condiciones particulares informadas para cada evento específico.</li>
            <li>Los saldos restantes deberán cancelarse antes de la fecha límite estipulada previa a la salida de la unidad (habitualmente entre 48 y 72 horas hábiles previas al viaje).</li>
          </ul>
        </section>

        <!-- Sección 3 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">03.</span>
            <span>Entradas a los Shows y Espectáculos</span>
          </h2>
          <p>
            En los paquetes que incluyan únicamente traslado ida y vuelta, la obtención de la entrada al espectáculo corre por cuenta exclusiva del pasajero. En aquellos paquetes promocionales donde Tripu provea o gestione entradas o traslados combinados, las mismas son intransferibles salvo autorización expresa y oportuna de los coordinadores.
          </p>
        </section>

        <!-- Sección 4 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">04.</span>
            <span>Puntualidad, Salidas y Regresos</span>
          </h2>
          <p>
            Los horarios de presentación en el punto de encuentro estipulado y los horarios de regreso tras la finalización del show son estrictos. Tripu Producciones asigna coordinadores en cada unidad para organizar los ascensos y descensos. La falta de presentación en tiempo y forma en las paradas designadas no dará derecho a reintegro alguno.
          </p>
        </section>

        <!-- Sección 5 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">05.</span>
            <span>Reprogramaciones y Cancelaciones del Show</span>
          </h2>
          <p>
            En caso de cancelación o reprogramación del espectáculo ajena a Tripu Producciones (por decisión de la productora organizadora del show, condiciones climáticas o fuerza mayor), se reprogramará el servicio para la nueva fecha oficial confirmada por el artista. No se efectuarán reintegros de señas por motivos ajenos a la prestación del traslado.
          </p>
        </section>

        <!-- Sección 6 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">06.</span>
            <span>Contacto y Consultas Legales</span>
          </h2>
          <p>
            Para consultas adicionales sobre estos términos, podés comunicarte con nuestro equipo a través del formulario de
            <NuxtLink to="/contacto" class="text-[#E53924] underline hover:text-[#FF6B55]">contacto oficial</NuxtLink>
            o escribiéndonos a <strong class="text-[#F5EEDC]">contacto@tripu.com.ar</strong>.
          </p>
        </section>
      </main>
    </div>
  </div>
</template>
