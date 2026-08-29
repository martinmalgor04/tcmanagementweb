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
import { type EmailStatus, notifySale, sendAccessEmail } from "./email"

export type DeliverAccessInput = {
  customer: Customer
  product: Product
  orderId: string | null
  amountCents?: number
}

export async function deliverAccess(
  input: DeliverAccessInput,
): Promise<{ accessUrl: string; emailStatus: EmailStatus }> {
  const { customer, product, orderId } = input

  const { url, tokenId } = await issueAccessLink(customer.id, product.id)
  const emailStatus = await sendAccessEmail({ customer, product, accessUrl: url, orderId })

  if (emailStatus === "sent") {
    await revokePreviousAccessTokens(customer.id, product.id, tokenId)
  }

  // Best-effort: un aviso que falla no debe tocar el acceso de la compradora.
  void notifySale({
    customer,
    product,
    orderId,
    amountCents: input.amountCents ?? product.price_cents,
  })

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
