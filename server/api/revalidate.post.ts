import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Autorización: verificar si el usuario es un operador autenticado o si envía el token secreto
  const user = await serverSupabaseUser(event).catch(() => null)
  const query = getQuery(event)
  const body = await readBody(event).catch(() => ({}))

  const config = useRuntimeConfig()
  const secretToken =
    config.vercelBypassToken ||
    process.env.VERCEL_BYPASS_TOKEN ||
    'tripu_revalidate_secret_token_bypass_2026_secure_key_32chars'

  const isAuthorized =
    Boolean(user) ||
    body?.secret === secretToken ||
    query?.secret === secretToken
  if (!isAuthorized) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autorizado para revalidar la caché'
    })
  }

  // 2. Determinar rutas a revalidar en Vercel Edge CDN
  const pathsToRevalidate = new Set<string>()

  // Siempre purgar la portada '/' ante cualquier cambio de viajes o tarifas
  pathsToRevalidate.add('/')

  if (body?.path) pathsToRevalidate.add(body.path)
  if (Array.isArray(body?.paths)) {
    body.paths.forEach((p: string) => {
      if (p) pathsToRevalidate.add(p)
    })
  }
  if (body?.slug) {
    pathsToRevalidate.add(`/viajes/${body.slug}`)
  }

  const pathsArray = Array.from(pathsToRevalidate)

  // 3. Si estamos en desarrollo local (sin Vercel), no hay CDN de Vercel que purgar
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    return {
      success: true,
      revalidated: pathsArray,
      requested: pathsArray,
      isLocal: true,
      timestamp: Date.now()
    }
  }

  // 4. Determinar la URL base de Vercel de forma robusta
  const reqUrl = getRequestURL(event)
  let siteUrl = reqUrl.origin

  if (!siteUrl || siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      siteUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    } else if (process.env.VERCEL_URL) {
      siteUrl = `https://${process.env.VERCEL_URL}`
    } else if (config.public?.siteUrl && !config.public.siteUrl.includes('tripu.com.ar')) {
      siteUrl = config.public.siteUrl
    } else {
      siteUrl = 'https://tripu-producciones.vercel.app'
    }
  }
  siteUrl = siteUrl.replace(/\/$/, '')

  // 5. Disparar petición con encabezado x-prerender-revalidate hacia Vercel Edge CDN
  const results = await Promise.allSettled(
    pathsArray.map((path) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const targetUrl = `${siteUrl}${normalizedPath}`

      return $fetch(targetUrl, {
        method: 'GET',
        headers: {
          'x-prerender-revalidate': secretToken
        }
      })
    })
  )

  const revalidated = pathsArray.filter((_, idx) => results[idx].status === 'fulfilled')

  return {
    success: true,
    revalidated,
    requested: pathsArray,
    timestamp: Date.now()
  }
})
