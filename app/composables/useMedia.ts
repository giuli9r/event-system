import type { Database, MediaAssetRow } from '~/types/database.types'

export type AssetType = 'flyer' | 'merch' | 'venue' | 'banner' | 'general'

export interface MediaAsset extends MediaAssetRow {}

export interface ImageAnalysis {
  width: number
  height: number
  sizeBytes: number
  mimeType: string
  aspectRatio: number
  isOptimalFlyerRatio: boolean
  isOptimalMerchRatio: boolean
  isOverWeightWarning: boolean
  isOverMaxWeightError: boolean
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutos de caché
const BUCKET_NAME = 'tripu-assets'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const WARNING_FILE_SIZE_BYTES = 1.5 * 1024 * 1024 // 1.5 MB

/**
 * Normaliza una cadena a slug kebab-case limpio para nombres de archivo
 */
export function slugifyMediaName(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 45) || 'archivo'
}

/**
 * Convierte el tipo de asset en la subcarpeta del bucket
 */
export function getFolderForAssetType(type: AssetType): string {
  switch (type) {
    case 'flyer':
      return 'flyers'
    case 'merch':
      return 'merch'
    case 'venue':
      return 'venues'
    case 'banner':
      return 'banners'
    default:
      return 'general'
  }
}

/**
 * Genera el nombre de archivo según la convención:
 * [slug-nombre]-[hash-corto]-[fecha-AAAAMMDD].[extension]
 * Ejemplo: duki-river-plate-2026-c7a8b9-20261118.webp
 */
export function generateMediaFilename(name: string, originalFileName: string): string {
  const slug = slugifyMediaName(name)
  const hash = Math.random().toString(36).substring(2, 8)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`

  // Extraer extensión del archivo original
  const ext = originalFileName.includes('.')
    ? originalFileName.split('.').pop()?.toLowerCase() || 'webp'
    : 'webp'

  return `${slug}-${hash}-${dateStr}.${ext}`
}

/**
 * Analiza un archivo de imagen en el navegador obteniendo resolución, peso y orientación
 */
export function analyzeImageFile(file: File): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'))
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      const sizeBytes = file.size
      const aspectRatio = width / (height || 1)

      // Flyer ideal: Proporción vertical 4:5 (0.8) ej. 1080x1350 px o 800x1000 px. Rango permitido 0.65 - 0.90
      const isOptimalFlyerRatio = aspectRatio >= 0.65 && aspectRatio <= 0.90

      // Merch ideal: Proporción cuadrada 1:1 (1.0) ej. 1000x1000 px o 800x800 px. Rango permitido 0.90 - 1.10
      const isOptimalMerchRatio = aspectRatio >= 0.90 && aspectRatio <= 1.10

      const isOverWeightWarning = sizeBytes > WARNING_FILE_SIZE_BYTES
      const isOverMaxWeightError = sizeBytes > MAX_FILE_SIZE_BYTES

      resolve({
        width,
        height,
        sizeBytes,
        mimeType: file.type,
        aspectRatio,
        isOptimalFlyerRatio,
        isOptimalMerchRatio,
        isOverWeightWarning,
        isOverMaxWeightError
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo procesar la resolución de la imagen.'))
    }

    img.src = objectUrl
  })
}

export function useMedia() {
  const supabase = useSupabaseClient<Database>()

  // Estado global reactivo
  const mediaItems = useState<MediaAsset[]>('tripu-media-data', () => [])
  const lastFetched = useState<number | null>('tripu-media-last-fetch', () => null)
  const loading = useState<boolean>('tripu-media-loading', () => false)
  const error = useState<string | null>('tripu-media-error', () => null)

  const isDbReady = computed(() => mediaItems.value.length >= 0)

  /**
   * Obtiene la lista de activos multimedia con caché
   */
  async function fetchMedia(options?: { force?: boolean; type?: AssetType }) {
    const now = Date.now()
    if (!options?.force && lastFetched.value && (now - lastFetched.value) < CACHE_TTL_MS && mediaItems.value.length > 0) {
      return mediaItems.value
    }

    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('media_assets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (options?.type) {
        query = query.eq('asset_type', options.type)
      }

      const { data, error: fetchErr } = await query

      if (fetchErr) {
        throw new Error(fetchErr.message || 'Error al cargar el catálogo de multimedia')
      }

      mediaItems.value = (data as MediaAsset[]) || []
      lastFetched.value = now
      return mediaItems.value
    } catch (err: any) {
      console.error('[useMedia] Error en fetchMedia:', err)
      error.value = err.message || 'Error de conexión con Supabase'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Sube un archivo a Supabase Storage y registra sus metadatos en public.media_assets
   */
  async function uploadMedia(file: File, meta: { name: string; assetType: AssetType }) {
    loading.value = true
    error.value = null

    try {
      // 1. Validar tamaño límite (5 MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('El archivo excede el límite máximo permitido de 5 MB.')
      }

      // 2. Analizar dimensiones y calidad
      const analysis = await analyzeImageFile(file)

      // 3. Generar nombre de archivo según la convención
      const fileName = generateMediaFilename(meta.name, file.name)
      const folder = getFolderForAssetType(meta.assetType)
      const filePath = `${folder}/${fileName}`

      // 4. Subir archivo físico al bucket de Supabase
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: false
        })

      if (uploadErr) {
        throw new Error(`Error al subir a Supabase Storage: ${uploadErr.message}`)
      }

      // 5. Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl

      // 6. Insertar registro en public.media_assets
      const insertPayload = {
        name: meta.name.trim(),
        slug: slugifyMediaName(meta.name),
        file_path: filePath,
        public_url: publicUrl,
        asset_type: meta.assetType,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        width: analysis.width,
        height: analysis.height,
        is_active: true
      }

      const { data: insertedData, error: insertErr } = await supabase
        .from('media_assets')
        .insert(insertPayload)
        .select()
        .single()

      if (insertErr || !insertedData) {
        // En caso de fallo en BD, intentar limpiar el archivo subido
        await supabase.storage.from(BUCKET_NAME).remove([filePath]).catch(() => {})
        throw new Error(`Error al registrar en base de datos: ${insertErr?.message}`)
      }

      const newAsset = insertedData as MediaAsset
      mediaItems.value = [newAsset, ...mediaItems.value]

      return newAsset
    } catch (err: any) {
      console.error('[useMedia] Error en uploadMedia:', err)
      error.value = err.message || 'Error al procesar la subida de imagen'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Elimina el archivo físico de Supabase Storage y realiza un DELETE directo en public.media_assets
   */
  async function deleteMedia(id: string, filePath: string) {
    loading.value = true
    error.value = null

    try {
      // 1. Eliminar archivo físico de Supabase Storage
      if (filePath) {
        const { error: storageErr } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath])

        if (storageErr) {
          console.warn('[useMedia] Advertencia al eliminar archivo de storage:', storageErr.message)
        }
      }

      // 2. Realizar delete directo en public.media_assets
      const { error: deleteErr } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', id)

      if (deleteErr) {
        throw new Error(`Error al eliminar de base de datos: ${deleteErr.message}`)
      }

      // 3. Actualizar estado reactivo local
      mediaItems.value = mediaItems.value.filter(item => item.id !== id)
      return true
    } catch (err: any) {
      console.error('[useMedia] Error en deleteMedia:', err)
      error.value = err.message || 'Error al eliminar el archivo multimedia'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpia el estado de caché (útil para logout o refresh forzado)
   */
  function clearMediaState() {
    mediaItems.value = []
    lastFetched.value = null
    error.value = null
  }

  return {
    mediaItems,
    loading,
    error,
    isDbReady,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    analyzeImageFile,
    clearMediaState,
    MAX_FILE_SIZE_BYTES,
    WARNING_FILE_SIZE_BYTES
  }
}
