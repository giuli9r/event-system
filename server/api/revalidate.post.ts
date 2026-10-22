import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Autorización: verificar si el usuario es un operador autenticado o si envía el token secreto
  const user = await serverSupabaseUser(event).catch(() => null)
  const query = getQuery(event)
  const body = await readBody(event).catch(() => ({}))

  const config = useRuntimeConfig()
  const secretToken = config.vercelBypassToken || process.env.VERCEL_BYPASS_TOKEN || 'tripu-revalidate-secret-token'

  const isAuthorized = Boolean(user) || body?.secret === secretToken || query?.secret === secretToken
  if (!isAuthorized) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autorizado para revalidar la caché'
    })
  }

  // 2. Determinar rutas a revalidar en Vercel Edge CDN
  const pathsToRevalidate: string[] = []
  if (body?.path) pathsToRevalidate.push(body.path)
  if (body?.slug) pathsToRevalidate.push(`/viajes/${body.slug}`)
  if (pathsToRevalidate.length === 0) pathsToRevalidate.push('/')

  const rawSiteUrl = config.public?.siteUrl || 'https://tripu-producciones.vercel.app'
  const siteUrl = rawSiteUrl.replace(/\/$/, '')

  // 3. Disparar petición con encabezado x-prerender-revalidate hacia Vercel
  const results = await Promise.allSettled(
    pathsToRevalidate.map((path) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const targetUrl = `${siteUrl}${normalizedPath}`

      return $fetch(targetUrl, {
        method: 'HEAD',
        headers: {
          'x-prerender-revalidate': secretToken
        }
      })
    })
  )

  const revalidated = pathsToRevalidate.filter((_, idx) => results[idx].status === 'fulfilled')

  return {
    success: true,
    revalidated,
    requested: pathsToRevalidate,
    timestamp: Date.now()
  }
})
