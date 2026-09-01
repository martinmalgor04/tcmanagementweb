/**
 * Checkout Pro (preferencias) y verificación de pagos contra Mercado Pago.
 *
 * Los parámetros que Mercado Pago agrega en la URL de retorno los controla el
 * navegador, así que no alcanzan como prueba de pago. Con MP_ACCESS_TOKEN
 * cargado consultamos la API y ahí sí el estado es confiable.
 */

import { mercadoPagoToken, publicHttpsOrigin } from "./config"

export type CheckoutPreference = {
  id: string
  initPoint: string
}

/**
 * Una preferencia por clic. Siempre devolvemos `init_point`:
 * `sandbox_init_point` está deprecado y con credenciales TEST- no hace falta.
 */
export async function createCheckoutPreference(input: {
  title: string
  productId: string
  unitPrice: number
  currency: string
  successUrl: string
  pendingUrl: string
  failureUrl: string
  notificationUrl?: string | null
}): Promise<CheckoutPreference> {
  const token = mercadoPagoToken()
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN")

  const canAutoReturn = Boolean(publicHttpsOrigin(input.successUrl))

  const body: Record<string, unknown> = {
    items: [
      {
        id: input.productId,
        title: input.title,
        quantity: 1,
        unit_price: input.unitPrice,
        currency_id: input.currency,
      },
    ],
    back_urls: {
      success: input.successUrl,
      pending: input.pendingUrl,
      failure: input.failureUrl,
    },
    statement_descriptor: "TC MANAGEMENT",
    external_reference: input.productId,
    metadata: { product: input.productId },
  }

  if (canAutoReturn) body.auto_return = "approved"
  if (input.notificationUrl) body.notification_url = input.notificationUrl

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Mercado Pago ${res.status}: ${detail.slice(0, 300)}`)
  }

  const data = (await res.json()) as { id?: string; init_point?: string }
  if (!data.id || !data.init_point) {
    throw new Error("Mercado Pago no devolvió init_point")
  }

  return { id: data.id, initPoint: data.init_point }
}

export type MpPayment = {
  id: number | string
  status: string
  status_detail?: string
  transaction_amount?: number
  currency_id?: string
  /** Lo setea createCheckoutPreference con el id del producto. */
  external_reference?: string | null
  metadata?: { product?: string | null } | null
  date_approved?: string | null
  payer?: {
    email?: string
    first_name?: string | null
    last_name?: string | null
  }
  additional_info?: {
    payer?: {
      first_name?: string | null
      last_name?: string | null
    }
  }
}

export type PaymentCheck = {
  status: "paid" | "pending" | "failed" | "refunded"
  /** true si el estado lo confirmó la API de Mercado Pago, no la URL de retorno. */
  verified: boolean
  payment: MpPayment | null
}

export async function fetchPayment(paymentId: string): Promise<MpPayment | null> {
  const token = mercadoPagoToken()
  if (!token) return null

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return (await res.json()) as MpPayment
  } catch {
    return null
  }
}

export function mapPaymentStatus(mpStatus: string | undefined): PaymentCheck["status"] {
  switch ((mpStatus || "").toLowerCase()) {
    case "approved":
    case "success":
      return "paid"
    case "rejected":
    case "cancelled":
      return "failed"
    case "refunded":
    case "charged_back":
      return "refunded"
    default:
      return "pending"
  }
}

export function isUsablePayerEmail(email: string | null | undefined): email is string {
  const value = email?.trim().toLowerCase() || ""
  if (!value.includes("@")) return false
  // Mercado Pago a veces devuelve el mail sandbox aun en pagos live.
  if (value.endsWith("@testuser.com")) return false
  if (value.endsWith("@sin-mail.tcmanagement.com.ar")) return false
  return true
}

export function payerEmail(payment: MpPayment): string | null {
  const email = payment.payer?.email?.trim().toLowerCase() || ""
  return isUsablePayerEmail(email) ? email : null
}

export function payerName(payment: MpPayment): { nombre: string | null; apellido: string | null } {
  const nombre =
    payment.payer?.first_name?.trim() || payment.additional_info?.payer?.first_name?.trim() || null
  const apellido =
    payment.payer?.last_name?.trim() || payment.additional_info?.payer?.last_name?.trim() || null
  return { nombre, apellido }
}

/**
 * Un pago aprobado no alcanza: tiene que ser de ESTE producto, en la moneda del
 * producto y por el precio. Sin esto, cualquier pago a la misma cuenta de
 * Mercado Pago —otro link, otro monto— habilitaba el manual.
 */
export function paymentMatchesProduct(
  payment: MpPayment,
  product: { id: string; price_cents: number; currency: string },
): boolean {
  const reference = payment.external_reference || payment.metadata?.product || null
  if (reference !== product.id) return false

  const currency = (payment.currency_id || "").toUpperCase()
  if (currency && currency !== product.currency.toUpperCase()) return false

  return paymentAmountCents(payment, 0) >= product.price_cents
}

export function paymentAmountCents(payment: MpPayment, fallbackCents: number): number {
  return payment.transaction_amount != null
    ? Math.round(payment.transaction_amount * 100)
    : fallbackCents
}

/**
 * @param paymentId      id que llega en la URL de retorno o en el webhook
 * @param redirectStatus estado que llega en la URL de retorno (no confiable)
 */
export async function checkPayment(
  paymentId: string | null | undefined,
  redirectStatus?: string | null,
): Promise<PaymentCheck> {
  if (paymentId) {
    const payment = await fetchPayment(paymentId)
    if (payment) {
      return { status: mapPaymentStatus(payment.status), verified: true, payment }
    }
  }

  return { status: mapPaymentStatus(redirectStatus || undefined), verified: false, payment: null }
}
