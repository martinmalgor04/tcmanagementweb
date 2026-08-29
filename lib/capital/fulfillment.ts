/**
 * Un único camino de entrega, usado por el formulario de /gracias y por el
 * webhook de Mercado Pago, para que no se puedan desincronizar.
 */

import {
  type Customer,
  type CustomerInput,
  type Order,
  type Product,
  getProduct,
  grantEntitlement,
  recordOrder,
  upsertCustomer,
} from "./access"
import { PRODUCT_SLUG } from "./config"
import { deliverAccess } from "./deliver"
import { checkPayment } from "./mercadopago"

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
  const customer = await upsertCustomer(input.customer)

  const order = await recordOrder({
    customerId: customer.id,
    product,
    status: check.status,
    paymentVerified: check.verified,
    providerPaymentId: input.paymentId || null,
    amountCents: check.payment?.transaction_amount
      ? Math.round(check.payment.transaction_amount * 100)
      : product.price_cents,
    rawPayload: check.payment ?? input.rawPayload ?? null,
  })

  // Se decide sobre la order, no sobre este chequeo: si el webhook ya la
  // confirmó antes, el formulario no tiene que volver a probar nada.
  if (order.status !== "paid") {
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
