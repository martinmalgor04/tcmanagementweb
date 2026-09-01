/**
 * Un único camino de entrega, usado por el formulario de /gracias y por el
 * webhook de Mercado Pago, para que no se puedan desincronizar.
 */

import {
  type Customer,
  type CustomerInput,
  type Order,
  type Product,
  findCustomerById,
  findOrderByPaymentId,
  getProduct,
  grantEntitlement,
  recordOrder,
  revokeEntitlement,
  updateCustomer,
  upsertCustomer,
} from "./access"
import { PRODUCT_SLUG } from "./config"
import { deliverAccess } from "./deliver"
import type { EmailStatus } from "./email"
import {
  type MpPayment,
  checkPayment,
  fetchPayment,
  isUsablePayerEmail,
  mapPaymentStatus,
  payerEmail,
  payerName,
  paymentAmountCents,
  paymentMatchesProduct,
} from "./mercadopago"

export type FulfillInput = {
  customer: CustomerInput
  paymentId?: string | null
  /** Estado que viene en la URL de retorno. No confiable por sí solo. */
  redirectStatus?: string | null
  rawPayload?: unknown
}

export type FulfillResult = {
  product: Product
  customer: Customer
  order: Order
  paid: boolean
  /** true si el pago lo confirmó la API de Mercado Pago. */
  verified: boolean
  emailStatus: "sent" | "queued" | "failed" | "skipped"
  /**
   * Sólo se devuelve con el pago verificado contra Mercado Pago. Si el pago se
   * dio por bueno con los parámetros de la URL, el link va únicamente al mail.
   */
  accessUrl: string | null
}

export async function fulfillPurchase(input: FulfillInput): Promise<FulfillResult> {
  const product = await getProduct(PRODUCT_SLUG)
  if (!product) {
    throw new Error(`No existe el producto ${PRODUCT_SLUG} en la base`)
  }

  const check = await checkPayment(input.paymentId, input.redirectStatus)

  // Un pago aprobado de otro producto o por otro monto no habilita este manual.
  const mismatched =
    check.verified && check.payment !== null && !paymentMatchesProduct(check.payment, product)
  if (mismatched) {
    console.warn("[capital] pago que no corresponde al producto", input.paymentId)
  }

  const customer = await customerForPurchase(input)

  const order = await recordOrder({
    customerId: customer.id,
    product,
    status: check.status,
    paymentVerified: check.verified,
    providerPaymentId: input.paymentId || null,
    amountCents: check.payment ? paymentAmountCents(check.payment, product.price_cents) : product.price_cents,
    rawPayload: check.payment ?? input.rawPayload ?? null,
  })

  // Se decide sobre la order, no sobre este chequeo: si el webhook ya la
  // confirmó antes, el formulario no tiene que volver a probar nada. Pero el
  // estado de la URL de retorno nunca alcanza por sí solo: lo que habilita es
  // que el pago esté verificado contra la API.
  const entitled = order.status === "paid" && order.payment_verified && !mismatched

  if (!entitled) {
    return {
      product,
      customer,
      order,
      paid: false,
      verified: check.verified,
      emailStatus: "skipped",
      accessUrl: null,
    }
  }

  await grantEntitlement(customer.id, product.id, order.id)
  const { accessUrl, emailStatus } = await deliverAccess({
    customer,
    product,
    orderId: order.id,
    amountCents: order.amount_cents,
  })

  return {
    product,
    customer,
    order,
    paid: true,
    verified: check.verified,
    emailStatus,
    accessUrl: check.verified ? accessUrl : null,
  }
}

/**
 * Si el webhook ya creó la compradora con el mail de Mercado Pago, el
 * formulario completa esa misma fila. No se arma otra persona ni otra venta.
 */
async function customerForPurchase(input: FulfillInput): Promise<Customer> {
  const existingOrder = input.paymentId
    ? await findOrderByPaymentId("mercadopago", input.paymentId)
    : null

  if (!existingOrder) {
    return upsertCustomer(input.customer)
  }

  const current = await findCustomerById(existingOrder.customer_id)
  if (!current) return upsertCustomer(input.customer)

  // El formulario COMPLETA datos (WhatsApp, ciudad, Instagram); nunca cambia de
  // quién es la orden. Si lo hiciera, cualquiera con el payment_id ajeno —que
  // viaja a la vista en la URL de /gracias— se quedaba con el acceso y dejaba
  // afuera a la compradora real.
  const formEmail = input.customer.email.trim().toLowerCase()
  if (formEmail !== current.email.toLowerCase()) {
    console.warn("[capital] el formulario llegó con otro mail que la orden", existingOrder.id)
  }

  const { email: _delFormulario, ...resto } = input.customer
  return updateCustomer(current.id, { ...resto, email: current.email })
}

export type MpFulfillFallback = {
  email?: string | null
  nombre?: string | null
  apellido?: string | null
}

export type MpFulfillResult =
  | {
      ok: true
      alreadyPaid: boolean
      product: Product
      customer: Customer
      order: Order
      emailStatus: EmailStatus | "skipped"
    }
  | { ok: false; reason: "not_found" | "no_email" | "not_paid" | "mismatch"; status?: string }

/**
 * Confirma un pago contra la API de Mercado Pago y lo deja impactado.
 * No espera al formulario de /gracias: si la compradora pagó en la app y
 * cerró, igual hay orden, acceso y mail al correo de la cuenta de MP.
 */
export async function fulfillMercadoPagoPayment(
  paymentId: string,
  fallback: MpFulfillFallback = {},
): Promise<MpFulfillResult> {
  const payment = await fetchPayment(paymentId)
  if (!payment) return { ok: false, reason: "not_found" }

  const status = mapPaymentStatus(payment.status)
  const product = await getProduct(PRODUCT_SLUG)
  if (!product) throw new Error(`No existe el producto ${PRODUCT_SLUG}`)

  const existing = await findOrderByPaymentId("mercadopago", String(payment.id))
  const alreadyPaid = existing?.status === "paid"

  if (status !== "paid" && !existing) {
    return { ok: false, reason: "not_paid", status: payment.status }
  }

  // Un pago aprobado a la misma cuenta pero de otro producto, otra moneda u
  // otro monto no habilita nada.
  if (status === "paid" && !paymentMatchesProduct(payment, product)) {
    return { ok: false, reason: "mismatch", status: payment.status }
  }

  const customer = await customerForMercadoPagoPayment(payment, existing, fallback)
  if (!customer) return { ok: false, reason: "no_email", status: payment.status }

  const order = await recordOrder({
    customerId: customer.id,
    product,
    status,
    paymentVerified: true,
    providerPaymentId: String(payment.id),
    amountCents: paymentAmountCents(payment, product.price_cents),
    rawPayload: payment,
  })

  // Devolución o contracargo confirmados por la API: se da de baja el acceso y
  // los links vivos dejan de servir.
  if (order.status === "refunded") {
    await revokeEntitlement(customer.id, product.id)
    return { ok: true, alreadyPaid, product, customer, order, emailStatus: "skipped" }
  }

  if (order.status !== "paid") {
    return { ok: true, alreadyPaid, product, customer, order, emailStatus: "skipped" }
  }

  // Ya se entregó en una notificación anterior: Mercado Pago reintenta la misma
  // notificación varias veces y no hay que volver a emitir token ni mail.
  if (alreadyPaid) {
    return { ok: true, alreadyPaid, product, customer, order, emailStatus: "skipped" }
  }

  await grantEntitlement(customer.id, product.id, order.id)

  if (!isUsablePayerEmail(customer.email)) {
    return { ok: true, alreadyPaid, product, customer, order, emailStatus: "skipped" }
  }

  const { emailStatus } = await deliverAccess({
    customer,
    product,
    orderId: order.id,
    amountCents: order.amount_cents,
  })

  return { ok: true, alreadyPaid, product, customer, order, emailStatus }
}

async function customerForMercadoPagoPayment(
  payment: MpPayment,
  existing: Order | null,
  fallback: MpFulfillFallback,
): Promise<Customer | null> {
  const fromFallback = isUsablePayerEmail(fallback.email?.trim().toLowerCase())
    ? fallback.email!.trim().toLowerCase()
    : null
  const email =
    fromFallback ||
    payerEmail(payment) ||
    (existing ? null : `mp.${payment.id}@sin-mail.tcmanagement.com.ar`)
  const names = payerName(payment)
  const nombre = fallback.nombre?.trim() || names.nombre
  const apellido = fallback.apellido?.trim() || names.apellido

  if (existing) {
    const current = await findCustomerById(existing.customer_id)
    if (current) {
      const shouldReplaceEmail = Boolean(
        email && email !== current.email.toLowerCase() && (fromFallback || !isUsablePayerEmail(current.email)),
      )
      if (shouldReplaceEmail || nombre || apellido) {
        return updateCustomer(current.id, {
          email: shouldReplaceEmail ? email! : current.email,
          nombre,
          apellido,
        })
      }
      return current
    }
  }

  if (!email) return null

  return upsertCustomer({
    email,
    nombre: nombre || null,
    apellido: apellido || null,
    source: "mercadopago-webhook",
  })
}
