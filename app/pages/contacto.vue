<script setup lang="ts">
import { contactMessageSchema, type ContactMessageInput } from '~~/shared/schemas/contact'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Contacto y Consultas | Tripu Producciones',
  description: 'Comunicate con el equipo de Tripu Producciones para coordinar traslados, viajes especiales, consultar disponibilidad o sacarte cualquier duda.',
  ogTitle: 'Contacto | Tripu Producciones - Viajes a Recitales',
  ogDescription: '¿Tenés dudas sobre salidas, paradas intermedias o formas de pago? Escribinos y te responderemos a la brevedad.',
  ogImage: '/branding/logo-tripu-horizontal.webp'
})

const state = reactive<ContactMessageInput>({
  name: '',
  email: '',
  phone: '',
  selected_event: '',
  message: '',
  honeypot: ''
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit() {
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const res = await $fetch('/api/contact', {
      method: 'POST',
      body: state
    })

    if (res.success) {
      submitSuccess.value = true
      // Limpiar formulario
      state.name = ''
      state.email = ''
      state.phone = ''
      state.selected_event = ''
      state.message = ''
      state.honeypot = ''
    }
  } catch (err: any) {
    console.error('Error al enviar formulario de contacto:', err)
    errorMessage.value = err.data?.statusMessage || err.statusMessage || 'Ocurrió un error al enviar tu consulta. Por favor verificá los datos o escribinos por WhatsApp.'
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  submitSuccess.value = false
  errorMessage.value = null
}
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] py-12 sm:py-16 selection:bg-[#E53924] selection:text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la página -->
      <div class="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-bold uppercase tracking-wider text-[#FF6B55]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#E53924]" />
          <span>Atención al Pasajero</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black uppercase text-[#F5EEDC] tracking-tight">
          Ponete en Contacto con Tripu
        </h1>
        <p class="text-zinc-400 text-sm sm:text-base leading-relaxed">
          ¿Tenés consultas sobre las salidas, formas de pago, traslados grupales o viajes a medida? Dejanos tu mensaje y nuestro equipo te asesorará en el día.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
        <!-- Columna Izquierda: Tarjetas Informativas y Vía Directa a WhatsApp -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Tarjeta de Conversión WhatsApp -->
          <div class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-4">
            <div class="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="w-6 h-6 stroke-[2]" />
            </div>
            <h2 class="text-xl font-black uppercase text-[#F5EEDC] tracking-tight">
              ¿Buscás respuesta inmediata?
            </h2>
            <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Atendemos todas las consultas de salidas, lugares disponibles y reservas directas a través de nuestro canal oficial de WhatsApp.
            </p>
            <a
              href="https://wa.me/5493564000000?text=Hola%20Tripu!%20%F0%9F%91%8B%20Quería%20hacerles%20una%20consulta%20por%20los%20viajes%20a%20recitales."
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-3.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider bg-[#25D366] hover:bg-[#20ba5a] text-[#0F0F12] flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all active:scale-95"
            >
              <UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4 stroke-[2.5]" />
              <span>Chatear por WhatsApp</span>
            </a>
          </div>

          <!-- Canales Oficiales y Ubicación -->
          <div class="p-6 sm:p-8 rounded-2xl bg-[#14141B] border border-[#2A2A38] space-y-5">
            <h3 class="text-xs font-black uppercase tracking-wider text-zinc-400">
              Información de Salidas
            </h3>
            <div class="space-y-4 text-xs sm:text-sm text-zinc-300">
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-[#E53924] shrink-0 mt-0.5" />
                <div>
                  <strong class="text-[#F5EEDC] block">Punto de Partida Principal:</strong>
                  <span>San Francisco, Córdoba (Terminal y puntos intermedios coordinados).</span>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-clock" class="w-5 h-5 text-[#E53924] shrink-0 mt-0.5" />
                <div>
                  <strong class="text-[#F5EEDC] block">Horarios de Atención:</strong>
                  <span>Lunes a Sábados de 09:00 a 20:00 hs.</span>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-[#E53924] shrink-0 mt-0.5" />
                <div>
                  <strong class="text-[#F5EEDC] block">Email:</strong>
                  <span class="text-zinc-400">contacto@tripu.com.ar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Formulario Web -->
        <div class="lg:col-span-7">
          <div class="p-6 sm:p-10 rounded-2xl bg-[#14141B] border border-[#2A2A38] shadow-2xl">
            <!-- ESTADO DE ÉXITO TRAS ENVÍO -->
            <div v-if="submitSuccess" class="text-center py-10 space-y-5">
              <div class="w-16 h-16 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] mx-auto">
                <UIcon name="i-heroicons-check-circle" class="w-8 h-8" />
              </div>
              <div class="space-y-2">
                <h3 class="text-2xl font-black uppercase text-[#F5EEDC]">
                  ¡Mensaje Enviado con Éxito!
                </h3>
                <p class="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Muchas gracias por escribirnos. Registramos tu consulta y un coordinador de Tripu se pondrá en contacto con vos a la brevedad.
                </p>
              </div>
              <div class="pt-4 flex flex-wrap justify-center gap-3">
                <UButton
                  color="neutral"
                  variant="subtle"
                  class="font-bold uppercase text-xs px-5 py-2.5 rounded-xl border border-[#2A2A38]"
                  @click="resetForm"
                >
                  Enviar otra consulta
                </UButton>
                <NuxtLink
                  to="/"
                  class="px-5 py-2.5 rounded-xl font-bold uppercase text-xs bg-[#E53924] hover:bg-[#d0301d] text-[#F5EEDC] transition-colors"
                >
                  Ver Próximos Viajes
                </NuxtLink>
              </div>
            </div>

            <!-- FORMULARIO DE CONSULTA ACTIVO -->
            <form v-else class="space-y-5" @submit.prevent="onSubmit">
              <!-- Alerta de Error si ocurre -->
              <div
                v-if="errorMessage"
                class="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-3"
              >
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-[#E53924] shrink-0" />
                <span>{{ errorMessage }}</span>
              </div>

              <!-- Campo Honeypot Oculto (Antispam) -->
              <input
                v-model="state.honeypot"
                type="text"
                name="b_honey"
                tabindex="-1"
                autocomplete="off"
                class="hidden"
                aria-hidden="true"
              />

              <!-- Nombre Completo -->
              <div class="space-y-1.5">
                <label for="name" class="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Nombre y Apellido <span class="text-[#E53924]">*</span>
                </label>
                <input
                  id="name"
                  v-model="state.name"
                  type="text"
                  required
                  placeholder="Ej: Sofía Martínez"
                  class="w-full px-4 py-3 rounded-xl bg-[#1A1A22] border border-[#2A2A38] text-sm text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] focus:ring-1 focus:ring-[#E53924] transition-colors"
                />
              </div>

              <!-- Fila: Email y Teléfono -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label for="email" class="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Correo Electrónico <span class="text-[#E53924]">*</span>
                  </label>
                  <input
                    id="email"
                    v-model="state.email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    class="w-full px-4 py-3 rounded-xl bg-[#1A1A22] border border-[#2A2A38] text-sm text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] focus:ring-1 focus:ring-[#E53924] transition-colors"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="phone" class="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Teléfono / WhatsApp <span class="text-zinc-500 text-[10px]">(Opcional)</span>
                  </label>
                  <input
                    id="phone"
                    v-model="state.phone"
                    type="tel"
                    placeholder="Ej: 3564 123456"
                    class="w-full px-4 py-3 rounded-xl bg-[#1A1A22] border border-[#2A2A38] text-sm text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] focus:ring-1 focus:ring-[#E53924] transition-colors"
                  />
                </div>
              </div>

              <!-- Show de Interés -->
              <div class="space-y-1.5">
                <label for="selected_event" class="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Show o Viaje de Interés <span class="text-zinc-500 text-[10px]">(Opcional)</span>
                </label>
                <input
                  id="selected_event"
                  v-model="state.selected_event"
                  type="text"
                  placeholder="Ej: Tan Biónica en River / Los Piojos"
                  class="w-full px-4 py-3 rounded-xl bg-[#1A1A22] border border-[#2A2A38] text-sm text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] focus:ring-1 focus:ring-[#E53924] transition-colors"
                />
              </div>

              <!-- Mensaje / Consulta -->
              <div class="space-y-1.5">
                <label for="message" class="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Tu Consulta <span class="text-[#E53924]">*</span>
                </label>
                <textarea
                  id="message"
                  v-model="state.message"
                  required
                  rows="4"
                  placeholder="Contanos tu consulta: cantidad de lugares que necesitan, dudas sobre horarios, paradas intermedias, etc."
                  class="w-full px-4 py-3 rounded-xl bg-[#1A1A22] border border-[#2A2A38] text-sm text-[#F5EEDC] placeholder-zinc-500 focus:outline-none focus:border-[#E53924] focus:ring-1 focus:ring-[#E53924] transition-colors resize-y min-h-[100px]"
                />
              </div>

              <!-- Botón Submit -->
              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full py-4 rounded-xl font-black uppercase text-xs tracking-wider bg-[#E53924] hover:bg-[#d0301d] text-white shadow-xl shadow-[#E53924]/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UIcon v-if="isSubmitting" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                <UIcon v-else name="i-heroicons-paper-airplane" class="w-4 h-4" />
                <span>{{ isSubmitting ? 'Enviando consulta...' : 'Enviar Consulta' }}</span>
              </button>

              <p class="text-center text-[11px] text-zinc-500">
                Tus datos no serán compartidos con terceros ni utilizados para spam.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
