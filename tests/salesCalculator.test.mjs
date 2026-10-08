import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSaleAmounts, isQuantityEmptyOrZero } from '../shared/utils/salesCalculator.ts'

test('Módulo Ventas - Fórmulas y Reglas de Negocio Contable', async (t) => {
  await t.test('Fórmula 1: Cantidad de Pasajes * Precio Unitario = Total Pactado', () => {
    const res = calculateSaleAmounts({
      quantity: 3,
      unit_price: 45000,
      amount_paid: 0
    })
    assert.equal(res.quantity, 3)
    assert.equal(res.unit_price, 45000)
    assert.equal(res.total_amount, 135000)
    assert.equal(res.balance_due, 135000)
    assert.equal(res.isQuantityInvalid, false)
    assert.equal(res.isPaidInvalid, false)
  })

  await t.test('Fórmula 2: Total Pactado - Abonado Hoy = Saldo Pendiente', () => {
    const res = calculateSaleAmounts({
      quantity: 2,
      unit_price: 50000,
      amount_paid: 30000
    })
    assert.equal(res.total_amount, 100000)
    assert.equal(res.amount_paid, 30000)
    assert.equal(res.balance_due, 70000)
    assert.equal(res.isPaidInvalid, false)
  })

  await t.test('Regla Cantidad: Si cantidad es 0, null, undefined o vacía, Total Pactado es 0 e isQuantityInvalid es true (borde rojo)', () => {
    // Caso: 0
    const resZero = calculateSaleAmounts({
      quantity: 0,
      unit_price: 50000,
      amount_paid: 0
    })
    assert.equal(resZero.total_amount, 0)
    assert.equal(resZero.isQuantityInvalid, true)

    // Caso: null
    const resNull = calculateSaleAmounts({
      quantity: null,
      unit_price: 50000,
      amount_paid: 0
    })
    assert.equal(resNull.total_amount, 0)
    assert.equal(resNull.isQuantityInvalid, true)

    // Caso: undefined
    const resUndefined = calculateSaleAmounts({
      quantity: undefined,
      unit_price: 50000,
      amount_paid: 0
    })
    assert.equal(resUndefined.total_amount, 0)
    assert.equal(resUndefined.isQuantityInvalid, true)

    // Caso: string vacío ''
    const resEmpty = calculateSaleAmounts({
      quantity: '',
      unit_price: 50000,
      amount_paid: 0
    })
    assert.equal(resEmpty.total_amount, 0)
    assert.equal(resEmpty.isQuantityInvalid, true)

    // Verificación de helper
    assert.equal(isQuantityEmptyOrZero(0), true)
    assert.equal(isQuantityEmptyOrZero(null), true)
    assert.equal(isQuantityEmptyOrZero(undefined), true)
    assert.equal(isQuantityEmptyOrZero(''), true)
    assert.equal(isQuantityEmptyOrZero(-2), true)
    assert.equal(isQuantityEmptyOrZero(1), false)
  })

  await t.test('Regla: Total Pactado debe ser 0 o mayor a 0 (Soporte para entrada Regalo a $0)', () => {
    const resGift = calculateSaleAmounts({
      quantity: 1,
      unit_price: 0,
      amount_paid: 0
    })
    assert.equal(resGift.total_amount, 0)
    assert.equal(resGift.balance_due, 0)
    assert.equal(resGift.isTotalInvalid, false)
    assert.equal(resGift.isPaidInvalid, false)
    assert.equal(resGift.isQuantityInvalid, false)
  })

  await t.test('Regla: El monto abonado no puede superar el total pactado (amount_paid <= total_amount)', () => {
    const resExceeded = calculateSaleAmounts({
      quantity: 1,
      unit_price: 50000,
      amount_paid: 60000 // Supera total
    })
    assert.equal(resExceeded.total_amount, 50000)
    assert.equal(resExceeded.amount_paid, 60000)
    assert.equal(resExceeded.isPaidExceedsTotal, true)
    assert.equal(resExceeded.isPaidInvalid, true)
    assert.equal(resExceeded.errorMessage, 'El monto abonado no puede superar el total pactado')
  })

  await t.test('Regla: El Abonado Hoy no puede ser negativo (amount_paid >= 0)', () => {
    const resNegative = calculateSaleAmounts({
      quantity: 1,
      unit_price: 50000,
      amount_paid: -1000
    })
    assert.equal(resNegative.isPaidNegative, true)
    assert.equal(resNegative.isPaidInvalid, true)
    assert.equal(resNegative.errorMessage, 'El monto abonado hoy no puede ser negativo')
  })

  await t.test('Regla: El Saldo Pendiente no puede ser negativo (balance_due >= 0)', () => {
    const resBalanceCheck = calculateSaleAmounts({
      quantity: 1,
      unit_price: 50000,
      amount_paid: 50000 // Pago exacto 100%
    })
    assert.equal(resBalanceCheck.balance_due, 0)
    assert.equal(resBalanceCheck.isPaidInvalid, false)
  })

  await t.test('Reactividad en tiempo real: Actualización secuencial de inputs simula UI', () => {
    // 1. Inicial: 1 pasaje a $40,000, abonado $0
    let state = calculateSaleAmounts({ quantity: 1, unit_price: 40000, amount_paid: 0 })
    assert.equal(state.total_amount, 40000)
    assert.equal(state.balance_due, 40000)

    // 2. El usuario cambia la cantidad a 3 pasajes -> Total se dispara a $120,000 y saldo a $120,000
    state = calculateSaleAmounts({ quantity: 3, unit_price: 40000, amount_paid: 0 })
    assert.equal(state.total_amount, 120000)
    assert.equal(state.balance_due, 120000)

    // 3. El usuario ingresa Abonado Hoy $50,000 -> Saldo pendiente pasa inmediatamente a $70,000
    state = calculateSaleAmounts({ quantity: 3, unit_price: 40000, amount_paid: 50000 })
    assert.equal(state.total_amount, 120000)
    assert.equal(state.amount_paid, 50000)
    assert.equal(state.balance_due, 70000)

    // 4. El usuario borra la cantidad (queda en '') -> Total es 0 y se marca inválido
    state = calculateSaleAmounts({ quantity: '', unit_price: 40000, amount_paid: 50000 })
    assert.equal(state.total_amount, 0)
    assert.equal(state.isQuantityInvalid, true)
  })
})
