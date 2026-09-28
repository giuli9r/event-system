export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Si no hay sesión activa y se intenta acceder a una ruta de administración protegida
  if (!user.value && to.path !== '/admin/login') {
    return navigateTo({
      path: '/admin/login',
      query: {
        redirect: to.fullPath
      }
    })
  }

  // Si el usuario ya está autenticado y accede a /admin/login, redirigir al panel
  if (user.value && to.path === '/admin/login') {
    return navigateTo('/admin')
  }
})
