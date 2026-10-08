/**
 * Utilidades contables para el Módulo de Ventas de Tripu System.
 * 
 * Reglas de negocio:
 * 1. Cantidad de Pasajes * Precio Unitario = Total Pactado
 * 2. Total Pactado - Abonado Hoy = Saldo Pendiente
 * 3. Si Cantidad de Pasajeros es 0, null o undefined: Total Pactado = 0 y se marca inválido (borde rojo).
 * 4. El monto abonado no puede superar el total pactado (amount_paid <= total_amount).
 * 5. El Total Pactado debe ser >= 0 (permite entrada Regalo a $0).
 * 6. El Abonado Hoy no puede ser negativo (amount_paid >= 0).
 * 7. El Saldo Pendiente no puede ser negativo (balance_due >= 0).
 */

export interface SaleCalculationInput {
  quantity: number | string | null | undefined
  unit_price: number | string | null | undefined
  amount_paid: number | string | null | undefined
}

export interface SaleCalculationResult {
  quantity: number
  unit_price: number
  total_amount: number
  amount_paid: number
  balance_due: number
  isQuantityInvalid: boolean // 0, null, undefined, negativo o NaN
  isUnitPriceInvalid: boolean // < 0 o NaN
  isPaidNegative: boolean // < 0
  isPaidExceedsTotal: boolean // > total_amount
  isPaidInvalid: boolean // negativo o superior al total
  isTotalInvalid: boolean // < 0
  errorMessage?: string
}

/**
 * Evalúa si la cantidad ingresada es inválida (0, null, undefined, NaN o <= 0)
 */
export function isQuantityEmptyOrZero(qty: number | string | null | undefined): boolean {
  if (qty === null || qty === undefined || qty === '') return true
  const num = Number(qty)
  return isNaN(num) || num <= 0
}

/**
 * Calcula los totales y saldos del registro de venta en tiempo real.
 */
export function calculateSaleAmounts(input: SaleCalculationInput): SaleCalculationResult {
  const isQtyInvalid = isQuantityEmptyOrZero(input.quantity)
  
  // Si la cantidad es inválida (0, null, undefined), la cantidad efectiva para cálculo es 0
  const qty = isQtyInvalid ? 0 : Math.floor(Number(input.quantity))
  
  // Precio unitario (permite $0 para cortesía/regalo)
  const rawUnitPrice = input.unit_price
  const isUnitPriceNullOrEmpty = rawUnitPrice === null || rawUnitPrice === undefined || rawUnitPrice === ''
  const parsedUnitPrice = isUnitPriceNullOrEmpty ? 0 : Number(rawUnitPrice)
  const isUnitPriceInvalid = isNaN(parsedUnitPrice) || parsedUnitPrice < 0
  const unit_price = isUnitPriceInvalid ? 0 : parsedUnitPrice

  // Fórmula 1: Cantidad de Pasajes * Precio Unitario = Total Pactado
  // Si cantidad es 0, null o undefined, el total pactado es 0
  const total_amount = isQtyInvalid ? 0 : Math.max(0, qty * unit_price)

  // Abonado hoy
  const rawPaid = input.amount_paid
  const isPaidEmpty = rawPaid === null || rawPaid === undefined || rawPaid === ''
  const parsedPaid = isPaidEmpty ? 0 : Number(rawPaid)
  const isPaidNegative = !isNaN(parsedPaid) && parsedPaid < 0
  const amount_paid = isNaN(parsedPaid) ? 0 : parsedPaid

  // Validación de importe abonado
  const isPaidExceedsTotal = amount_paid > total_amount
  const isPaidInvalid = isPaidNegative || isPaidExceedsTotal

  // Fórmula 2: Total Pactado - Abonado Hoy = Saldo Pendiente
  // Regla: El saldo pendiente no puede ser negativo
  const balance_due = Math.max(0, total_amount - amount_paid)

  // Mensaje de validación contextualmente relevante
  let errorMessage: string | undefined
  if (isQtyInvalid) {
    errorMessage = 'La cantidad de pasajeros debe ser al menos 1'
  } else if (isUnitPriceInvalid) {
    errorMessage = 'El precio unitario no puede ser negativo'
  } else if (isPaidNegative) {
    errorMessage = 'El monto abonado hoy no puede ser negativo'
  } else if (isPaidExceedsTotal) {
    errorMessage = 'El monto abonado no puede superar el total pactado'
  }

  return {
    quantity: qty,
    unit_price,
    total_amount,
    amount_paid,
    balance_due,
    isQuantityInvalid: isQtyInvalid,
    isUnitPriceInvalid,
    isPaidNegative,
    isPaidExceedsTotal,
    isPaidInvalid,
    isTotalInvalid: total_amount < 0,
    errorMessage
  }
}
