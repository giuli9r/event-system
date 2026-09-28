<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const toast = useToast()

// Redirigir inmediatamente si ya hay una sesión activa
watchEffect(() => {
  if (user.value) {
    const redirectPath = (route.query.redirect as string) || '/admin'
    navigateTo(redirectPath)
  }
})

// Esquema de validación con Zod
const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Ingresá un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe contener al menos 6 caracteres')
})

type LoginForm = z.infer<typeof loginSchema>

const state = reactive<LoginForm>({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function handleLogin() {
  loading.value = true
  errorMessage.value = null

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: state.email.trim(),
      password: state.password
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        errorMessage.value = 'Credenciales inválidas. Verificá tu correo y contraseña.'
      } else {
        errorMessage.value = error.message
      }

      toast.add({
        title: 'Error de autenticación',
        description: errorMessage.value,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle'
      })
      return
    }

    if (data.user) {
      toast.add({
        title: 'Sesión iniciada',
        description: `Bienvenido al panel operativo, ${data.user.email}`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })

      const destination = (route.query.redirect as string) || '/admin'
      await navigateTo(destination)
    }
  } catch (err: any) {
    errorMessage.value = 'Ocurrió un error inesperado al conectar con el servidor.'
    toast.add({
      title: 'Falla de conexión',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F5EEDC] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
    <!-- Efecto sutil de gradiente de fondo -->
    <div class="absolute top-1/4 -left-32 w-96 h-96 bg-[#E53924]/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#E53924]/5 rounded-full blur-3xl pointer-events-none" />

    <div class="w-full max-w-md space-y-6 relative z-10">
      <!-- Encabezado con Isotipo / Branding -->
      <div class="text-center space-y-2">
        <NuxtLink to="/" class="inline-flex items-center gap-2 group focus:outline-none">
          <div class="w-10 h-10 rounded-xl bg-[#E53924] flex items-center justify-center shadow-lg shadow-[#E53924]/20 group-hover:scale-105 transition-transform">
            <span class="text-white font-black text-xl tracking-tighter">T</span>
          </div>
          <span class="text-2xl font-black tracking-tight text-[#F5EEDC]">
            TRIPU <span class="text-[#E53924]">ADMIN</span>
          </span>
        </NuxtLink>
        <p class="text-sm text-zinc-400">
          Panel de Operaciones y Gestión de Salidas
        </p>
      </div>

      <!-- Tarjeta del Formulario -->
      <UCard
        class="bg-[#1A1A22] border-[#2A2A38] shadow-2xl shadow-black/60 rounded-2xl overflow-hidden"
      >
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-[#F5EEDC]">
              Iniciar Sesión
            </h2>
            <p class="text-xs text-zinc-400">
              Ingresá tus credenciales autorizadas de Tripu Producciones.
            </p>
          </div>
        </template>

        <!-- Mensaje de error inline si falla el intento -->
        <UAlert
          v-if="errorMessage"
          class="mb-4 bg-red-950/40 border-red-800/60 text-red-200"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="subtle"
          :title="errorMessage"
        />

        <UForm
          :schema="loginSchema"
          :state="state"
          class="space-y-4"
          @submit="handleLogin"
        >
          <UFormField
            label="Correo Electrónico"
            name="email"
            required
            help="Usá tu cuenta autorizada por la administración"
          >
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="email"
              placeholder="operador@tripu.com.ar"
              icon="i-heroicons-envelope"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Contraseña"
            name="password"
            required
          >
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
          </UFormField>

          <div class="pt-2">
            <UButton
              type="submit"
              block
              size="lg"
              class="bg-[#E53924] hover:bg-[#c9321f] text-white font-semibold shadow-lg shadow-[#E53924]/20 transition-all cursor-pointer"
              :loading="loading"
            >
              <template v-if="!loading">
                <span>Ingresar al Panel</span>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
              </template>
              <template v-else>
                <span>Verificando credenciales...</span>
              </template>
            </UButton>
          </div>
        </UForm>

        <template #footer>
          <div class="flex items-center justify-between text-xs text-zinc-500">
            <span>Acceso restringido a operadores</span>
            <NuxtLink
              to="/"
              class="text-zinc-400 hover:text-[#E53924] transition-colors flex items-center gap-1"
            >
              <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
              <span>Volver a la web</span>
            </NuxtLink>
          </div>
        </template>
      </UCard>

      <!-- Pie de página de seguridad -->
      <div class="text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5">
        <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-emerald-500" />
        <span>Conexión cifrada de extremo a extremo mediante Supabase Auth</span>
      </div>
    </div>
  </div>
</template>
