/**
 * Entrega del acceso: generar el link, mandarlo y recién ahí dar de baja los
 * anteriores.
 *
 * El orden importa. Si se dieran de baja primero, un envío fallido dejaría a la
 * compradora sin el link viejo y sin el nuevo, y cada intento de pedir otro la
 * hundiría más. Con este orden, el link que ya tenía sigue sirviendo hasta que
 * el reemplazo efectivamente sale.
 */

import { type Customer, type Product, issueAccessLink, revokePreviousAccessTokens } from "./access"
import { type EmailStatus, hasAccessEmailForOrder, notifySale, sendAccessEmail } from "./email"

export type DeliverAccessInput = {
  customer: Customer
  product: Product
  orderId: string | null
  amountCents?: number
  /**
   * Da de baja los links anteriores. En una entrega por compra sí: el acceso es
   * nuevo. En un reenvío no, porque alcanzaba con pedir reenvíos en loop para
   * dejar a una compradora siempre con el link recién invalidado.
   */
  revokePrevious?: boolean
}

export async function deliverAccess(
  input: DeliverAccessInput,
): Promise<{ accessUrl: string; emailStatus: EmailStatus }> {
  const { customer, product, orderId } = input
  const revokePrevious = input.revokePrevious ?? orderId !== null

  if (orderId && (await hasAccessEmailForOrder(orderId, customer.email))) {
    return { accessUrl: "", emailStatus: "sent" }
  }

  const { url, tokenId } = await issueAccessLink(customer.id, product.id)
  const emailStatus = await sendAccessEmail({ customer, product, accessUrl: url, orderId })

  if (emailStatus === "sent" && revokePrevious) {
    await revokePreviousAccessTokens(customer.id, product.id, tokenId)
  }

  // Reenviar no es una venta: sin orderId no avisamos de nuevo al dueño.
  if (orderId) {
    void notifySale({
      customer,
      product,
      orderId,
      amountCents: input.amountCents ?? product.price_cents,
    })
  }

  return { accessUrl: url, emailStatus }
}

/**
 * Genera el link sin mandarlo, para entregarlo a mano. Acá sí se dan de baja
 * los anteriores enseguida: quien lo pidió ya tiene el nuevo en la respuesta.
 */
export async function issueAccessLinkOnly(customer: Customer, product: Product): Promise<string> {
  const { url, tokenId } = await issueAccessLink(customer.id, product.id)
  await revokePreviousAccessTokens(customer.id, product.id, tokenId)
  return url
}
