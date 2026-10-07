import { z } from 'zod'

/**
 * Función utilitaria de sanitización básica de cadenas
 * Elimina etiquetas HTML, caracteres nulos o de control invisibles y colapsa espacios.
 */
export function sanitizeString(val: unknown): string {
  if (typeof val !== 'string') return ''
  return val
    .normalize('NFC')
    .replace(/<[^>]*>/g, '') // Elimina tags HTML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029]/g, '') // Control characters
    .trim()
}

/**
 * Esquema Zod para validación y sanitización del formulario de contacto público (US-11)
 */
export const contactMessageSchema = z.object({
  name: z.string({ required_error: 'Ingresá tu nombre' })
    .transform(sanitizeString)
    .pipe(
      z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre es demasiado largo')
    ),
  email: z.string({ required_error: 'Ingresá tu correo electrónico' })
    .transform(sanitizeString)
    .pipe(
      z.string()
        .email('Ingresá un correo electrónico válido')
        .max(150, 'El correo es demasiado largo')
    ),
  phone: z.string().optional().default('')
    .transform(sanitizeString)
    .refine((val) => {
      if (!val) return true
      // Solo números, espacios, guiones y el signo +
      return /^[+0-9\s-]{6,25}$/.test(val)
    }, {
      message: 'Ingresá un número de teléfono o celular válido'
    }),
  selected_event: z.string().optional().default('')
    .transform(sanitizeString)
    .refine((val) => val.length <= 150, {
      message: 'El nombre del show seleccionado es demasiado largo'
    }),
  message: z.string({ required_error: 'Ingresá tu consulta o mensaje' })
    .transform(sanitizeString)
    .pipe(
      z.string()
        .min(10, 'Tu consulta debe tener al menos 10 caracteres')
        .max(1000, 'El mensaje no puede superar los 1000 caracteres')
    ),
  // Campo Honeypot antispam: debe viajar siempre vacío
  honeypot: z.string().optional().default('')
})

export type ContactMessageInput = z.infer<typeof contactMessageSchema>
