<script setup lang="ts">
useSeoMeta({
  title: 'Política de Privacidad y Protección de Datos',
  description: 'Conocé cómo protegemos tu información personal y datos de contacto en Tripu Producciones bajo la Ley 25.326.',
  ogTitle: 'Política de Privacidad | Tripu Producciones',
  ogDescription: 'Protección de datos personales y privacidad de pasajeros.',
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
          <span>Privacidad y Confidencialidad</span>
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-[#F5EEDC] tracking-tight">
          Política de Privacidad
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400">
          Última actualización: Octubre de 2026. Cumplimiento de la Ley Nacional de Protección de Datos Personales N° 25.326 (República Argentina).
        </p>
      </header>

      <!-- Contenido de Privacidad -->
      <main class="space-y-8 text-sm sm:text-base text-zinc-300 leading-relaxed">
        <!-- Sección 1 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">01.</span>
            <span>Compromiso de Privacidad</span>
          </h2>
          <p>
            En Tripu Producciones valoramos y respetamos la privacidad de nuestros pasajeros y usuarios. Esta política describe los datos que recolectamos a través de nuestro sitio web y los canales operativos oficiales, el uso exclusivo que les damos y las medidas de seguridad implementadas para salvaguardarlos.
          </p>
        </section>

        <!-- Sección 2 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">02.</span>
            <span>Información que Recolectamos</span>
          </h2>
          <p>
            Podemos recopilar información personal que nos brindes voluntariamente a través del formulario de contacto, reservas o mensajes directos:
          </p>
          <ul class="list-disc pl-5 space-y-2 text-zinc-300">
            <li><strong>Datos de contacto:</strong> Nombre completo, correo electrónico y número de teléfono/WhatsApp.</li>
            <li><strong>Datos de traslado y manifiesto de pasajeros:</strong> DNI, ciudad de origen y contacto de emergencia (exclusivamente requeridos para cumplir con las reglamentaciones de transporte vial de la CNRT).</li>
            <li><strong>Consultas y preferencias:</strong> Recitales o artistas de interés consultados a través del sitio.</li>
          </ul>
        </section>

        <!-- Sección 3 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">03.</span>
            <span>Finalidad del Tratamiento de Datos</span>
          </h2>
          <p>
            Tus datos se utilizan con fines exclusivamente operativos:
          </p>
          <ul class="list-disc pl-5 space-y-2 text-zinc-300">
            <li>Responder a tus consultas de pasajes, disponibilidad y tarifas.</li>
            <li>Coordinar el ascenso, itinerario y logística durante el día del show.</li>
            <li>Confeccionar la lista de pasajeros exigida por las autoridades de control vehicular y seguros de viaje.</li>
            <li><strong>No comercializamos, no alquilamos ni cedemos tus datos</strong> a terceros para publicidad o fines no vinculados a tu viaje.</li>
          </ul>
        </section>

        <!-- Sección 4 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">04.</span>
            <span>Seguridad y Control de Acceso (RLS)</span>
          </h2>
          <p>
            La información almacenada en nuestras bases de datos está protegida mediante mecanismos de cifrado en tránsito (TLS/HTTPS), políticas de seguridad a nivel de fila (Row Level Security en PostgreSQL) y acceso restringido exclusivamente a coordinadores y operadores autenticados del equipo Tripu.
          </p>
        </section>

        <!-- Sección 5 -->
        <section class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
          <h2 class="text-lg sm:text-xl font-black uppercase text-[#F5EEDC] flex items-center gap-2.5">
            <span class="text-[#E53924]">05.</span>
            <span>Derechos de Acceso, Rectificación y Supresión</span>
          </h2>
          <p>
            En virtud de la Ley 25.326, tenés derecho a solicitar el acceso, actualización, rectificación o eliminación definitiva de tus datos personales de nuestros registros en cualquier momento, enviando un correo a <strong class="text-[#F5EEDC]">contacto@tripu.com.ar</strong> con el asunto "Protección de Datos Personales".
          </p>
        </section>
      </main>
    </div>
  </div>
</template>
