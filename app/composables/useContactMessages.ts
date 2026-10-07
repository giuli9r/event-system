import type { Database } from '~/types/database.types'

export type ContactMessage = Database['public']['Tables']['contact_messages']['Row']
export type ContactMessageUpdate = Database['public']['Tables']['contact_messages']['Update']

const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutos para mensajes administrativos

export function useContactMessages() {
  const supabase = useSupabaseClient<Database>()

  const messages = useState<ContactMessage[]>('tripu-contact-messages', () => [])
  const lastFetched = useState<number | null>('tripu-contact-messages-ts', () => null)
  const loading = useState<boolean>('tripu-contact-messages-loading', () => false)
  const error = ref<string | null>(null)

  // Filtros reactivos
  const searchQuery = ref('')
  const statusFilter = ref<'all' | 'nuevo' | 'leido' | 'respondido' | 'archivado'>('all')

  const isCacheValid = computed(() => {
    if (!lastFetched.value || messages.value.length === 0) return false
    return (Date.now() - lastFetched.value) < CACHE_TTL_MS
  })

  /**
   * Obtiene la lista completa de mensajes de contacto
   */
  async function fetchMessages(options: { force?: boolean } = {}) {
    if (!options.force && isCacheValid.value) {
      return messages.value
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err

      messages.value = data || []
      lastFetched.value = Date.now()
      return messages.value
    } catch (err: any) {
      console.error('Error fetching contact messages:', err)
      error.value = err?.message || 'Error al cargar los mensajes'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza el estado de un mensaje (nuevo, leido, respondido, archivado)
   */
  async function updateMessageStatus(id: string, status: string) {
    try {
      const { error: err } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id)

      if (err) throw err

      // Actualizar en memoria reactiva instantáneamente
      const index = messages.value.findIndex(m => m.id === id)
      if (index !== -1) {
        messages.value[index] = { ...messages.value[index], status }
      }
      return true
    } catch (err: any) {
      console.error(`Error updating message status for ${id}:`, err)
      throw err
    }
  }

  /**
   * Mensajes filtrados reactivamente por búsqueda de texto y estado
   */
  const filteredMessages = computed(() => {
    let result = messages.value

    if (statusFilter.value !== 'all') {
      result = result.filter(m => m.status === statusFilter.value)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      result = result.filter(m => {
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.phone && m.phone.toLowerCase().includes(q)) ||
          (m.selected_event && m.selected_event.toLowerCase().includes(q)) ||
          m.message.toLowerCase().includes(q)
        )
      })
    }

    return result
  })

  // Conteo de mensajes nuevos / sin leer
  const unreadCount = computed(() => {
    return messages.value.filter(m => m.status === 'nuevo').length
  })

  function formatDate(isoStr: string): string {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d)
    } catch {
      return isoStr
    }
  }

  return {
    messages,
    filteredMessages,
    unreadCount,
    loading,
    error,
    searchQuery,
    statusFilter,
    fetchMessages,
    updateMessageStatus,
    formatDate
  }
}
