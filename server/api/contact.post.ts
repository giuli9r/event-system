import { contactMessageSchema } from '~~/shared/schemas/contact'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1. Validación y sanitización con Zod
  const validation = contactMessageSchema.safeParse(body)
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || 'Datos de formulario inválidos'
    throw createError({
      statusCode: 400,
      statusMessage: firstError,
      data: validation.error.flatten().fieldErrors
    })
  }

  const { name, email, phone, selected_event, message, honeypot } = validation.data

  // 2. Trampa de spam (Honeypot): si fue completado, simular éxito silenciosamente sin almacenar
  if (honeypot && honeypot.trim() !== '') {
    return {
      success: true,
      message: 'Mensaje recibido correctamente'
    }
  }

  // 3. Persistencia en PostgreSQL mediante Supabase
  const client = await serverSupabaseClient<Database>(event)

  const { error: dbError } = await client
    .from('contact_messages')
    .insert({
      name,
      email,
      phone: phone || null,
      selected_event: selected_event || null,
      message,
      status: 'nuevo'
    })

  if (dbError) {
    console.error('[API /api/contact] Error al insertar en PostgreSQL:', dbError)
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo registrar tu consulta en este momento. Por favor intentá nuevamente o contactanos vía WhatsApp.'
    })
  }

  // 4. Notificación vía Resend (opcional y resiliente)
  const config = useRuntimeConfig()
  const resendApiKey = config.resendApiKey
  const receiverEmail = config.contactReceiverEmail || 'contacto@tripu.com.ar'

  if (resendApiKey) {
    try {
      const emailHtml = `
        <div style="font-family: sans-serif; background: #0F0F12; color: #F5EEDC; padding: 24px; border-radius: 12px;">
          <h2 style="color: #E53924; margin-top: 0;">Nueva consulta recibida en la web de Tripu</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #FF6B55;">${email}</a></p>
          <p><strong>Teléfono:</strong> ${phone || 'No especificado'}</p>
          <p><strong>Show de interés:</strong> ${selected_event || 'Consulta general'}</p>
          <hr style="border: 1px solid #2A2A38; margin: 16px 0;" />
          <h3 style="color: #F5EEDC; margin-bottom: 8px;">Mensaje:</h3>
          <p style="white-space: pre-line; background: #14141B; padding: 16px; border-radius: 8px; border: 1px solid #2A2A38;">${message}</p>
          <p style="font-size: 11px; color: #888; margin-top: 24px;">Tripu Producciones — Notificaciones del Sistema</p>
        </div>
      `

      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          from: 'Tripu Web <onboarding@resend.dev>',
          to: [receiverEmail],
          subject: `🎸 Nueva consulta web: ${name} (${selected_event || 'General'})`,
          html: emailHtml
        }
      })
    } catch (mailErr) {
      // Degradación elegante: el mensaje ya fue almacenado en la base de datos
      console.warn('[API /api/contact] No se pudo despachar el correo de Resend (la consulta quedó guardada en DB):', mailErr)
    }
  }

  return {
    success: true,
    message: '¡Gracias por comunicarte con Tripu! Tu consulta fue enviada con éxito. Te responderemos a la brevedad.'
  }
})
