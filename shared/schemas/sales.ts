import { z } from 'zod'

export const paymentMethods = [
  'transferencia',
  'efectivo',
  'tarjeta_credito',
  'tarjeta_debito',
  'mercado_pago',
  'mixto'
] as const

export const paymentStatuses = [
  'paid',
  'partial',
  'pending',
  'refunded',
  'canceled',
  'gifted'
] as const

export const saleFormSchema = z.object({
  id: z.string().uuid().optional(),
  sale_date: z.string().min(1, 'La fecha de la venta es obligatoria'),
  event_id: z.string().uuid('Debes seleccionar un viaje válido'),
  customer_id: z.string().uuid('Debes seleccionar un cliente / pasajero válido'),
  package_tier_id: z.string().uuid('Debes seleccionar una opción de paquete').nullable().optional(),
  quantity: z.number({ invalid_type_error: 'La cantidad debe ser numérica' })
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1 pasaje'),
  unit_price: z.number({ invalid_type_error: 'El precio unitario debe ser numérico' })
    .min(0, 'El precio unitario no puede ser negativo'),
  total_amount: z.number({ invalid_type_error: 'El monto total debe ser numérico' })
    .min(0, 'El total no puede ser negativo'),
  amount_paid: z.number({ invalid_type_error: 'El monto abonado debe ser numérico' })
    .min(0, 'El monto abonado no puede ser negativo')
    .default(0),
  balance_due: z.number({ invalid_type_error: 'El saldo pendiente debe ser numérico' })
    .min(0, 'El saldo pendiente no puede ser negativo')
    .default(0),
  installments: z.number({ invalid_type_error: 'La cantidad de cuotas debe ser numérica' })
    .int('Las cuotas deben ser un número entero')
    .min(1, 'Debe registrar al menos 1 cuota')
    .default(1),
  currency: z.string().default('ARS'),
  payment_method: z.enum(paymentMethods, {
    errorMap: () => ({ message: 'Debes seleccionar un método de pago válido' })
  }).default('transferencia'),
  payment_status: z.enum(paymentStatuses, {
    errorMap: () => ({ message: 'Debes seleccionar un estado de cobro válido' })
  }).default('paid'),
  seat_number: z.string()
    .max(50, 'La butaca no puede superar los 50 caracteres')
    .trim()
    .nullable()
    .optional(),
  boarding_location: z.string()
    .trim()
    .nullable()
    .optional(),
  receipt_number: z.string()
    .trim()
    .nullable()
    .optional(),
  notes: z.string()
    .trim()
    .nullable()
    .optional()
}).refine((data) => {
  // Verificación de consistencia: el monto abonado no puede superar el total
  return data.amount_paid <= data.total_amount
}, {
  message: 'El monto abonado a la fecha no puede superar el total pactado',
  path: ['amount_paid']
})

export type SaleFormInput = z.infer<typeof saleFormSchema>
