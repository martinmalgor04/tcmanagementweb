/**
 * Reporta una venta acreditada a Meta (Conversions API), una sola vez.
 *
 * Lo llaman los dos caminos de entrega —webhook y formulario de /gracias— y
 * también "Recuperar pago" del panel. La idempotencia vive en la base: se
 * reclama `orders.meta_capi_sent_at` con un UPDATE condicional antes de
 * llamar a Meta, y si el envío falla se libera para el próximo reintento.
 */

import type { Customer, Order } from "./access"
import { GRACIAS_PATH, outboundSiteUrl } from "./config"
import { update } from "./db"
import { sendMetaPurchase } from "./meta-capi"
import type { AttributionContext, MpPayment } from "./mercadopago"
import { META_PRODUCT } from "./product-public"

export type ReportPurchaseInput = {
  order: Order
  customer: Customer
  /** Pago de Mercado Pago, si se tiene: aporta fecha y la metadata de atribución. */
  payment?: MpPayment | null
  /** Datos del request que confirmó la compra (formulario), si los hay. */
  context?: AttributionContext | null
}

export type ReportPurchaseResult = "sent" | "already_sent" | "not_eligible" | "skipped" | "failed"

export async function reportPurchaseToMeta(input: ReportPurchaseInput): Promise<ReportPurchaseResult> {
  const { order, customer, payment, context } = input

  if (order.status !== "paid" || !order.payment_verified || !order.provider_payment_id) {
    return "not_eligible"
  }
  if (order.meta_capi_sent_at) return "already_sent"

  // Reclamo atómico: sólo un proceso se lleva la fila con la columna en null.
  const claimed = await update<Order>(
    "orders",
    `id=eq.${order.id}&meta_capi_sent_at=is.null`,
    { meta_capi_sent_at: new Date().toISOString() },
  ).catch((error) => {
    console.error("[capital] no se pudo reclamar el envío a Meta", order.id, error)
    return null
  })
  if (!claimed) return "already_sent"

  const metadata = payment?.metadata ?? null
  const paidAt = payment?.date_approved || order.paid_at || payment?.date_created || null
  const eventTime = Math.floor((paidAt ? Date.parse(paidAt) : Date.now()) / 1000)

  const result = await sendMetaPurchase({
    eventId: String(order.provider_payment_id),
    eventTime,
    value: order.amount_cents / 100,
    currency: order.currency || META_PRODUCT.currency,
    contentName: META_PRODUCT.contentName,
    eventSourceUrl: `${outboundSiteUrl()}${GRACIAS_PATH}`,
    email: customer.email,
    phone: customer.whatsapp,
    firstName: customer.nombre,
    lastName: customer.apellido,
    // El request que confirma (formulario) es más fresco que lo guardado en la
    // preferencia; si no hay, se usa lo que Mercado Pago devolvió en el pago.
    clientIp: context?.clientIp || metadata?.client_ip || null,
    clientUa: context?.clientUa || metadata?.client_ua || null,
    fbp: context?.fbp || metadata?.fbp || null,
    fbc: context?.fbc || metadata?.fbc || null,
  })

  if (result.ok) return "sent"

  // Liberar la fila: un retry del webhook o "Recuperar pago" lo vuelve a intentar.
  await update("orders", `id=eq.${order.id}`, { meta_capi_sent_at: null }).catch((error) => {
    console.error("[capital] no se pudo liberar el envío a Meta", order.id, error)
  })

  return result.skipped ? "skipped" : "failed"
}
