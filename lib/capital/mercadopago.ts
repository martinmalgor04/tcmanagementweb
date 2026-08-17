/**
 * Verificación de pagos contra Mercado Pago.
 *
 * Los parámetros que Mercado Pago agrega en la URL de retorno los controla el
 * navegador, así que no alcanzan como prueba de pago. Con MP_ACCESS_TOKEN
 * cargado consultamos la API y ahí sí el estado es confiable.
 */

import { mercadoPagoToken } from "./config"

export type MpPayment = {
  id: number | string
  status: string
  status_detail?: string
  transaction_amount?: number
  currency_id?: string
  date_approved?: string | null
  payer?: {
    email?: string
    first_name?: string | null
    last_name?: string | null
  }
}

export type PaymentCheck = {
  status: "paid" | "pending" | "failed"
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

function mapStatus(mpStatus: string | undefined): PaymentCheck["status"] {
  switch ((mpStatus || "").toLowerCase()) {
    case "approved":
    case "success":
      return "paid"
    case "rejected":
    case "cancelled":
    case "charged_back":
      return "failed"
    default:
      return "pending"
  }
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
      return { status: mapStatus(payment.status), verified: true, payment }
    }
  }

  return { status: mapStatus(redirectStatus || undefined), verified: false, payment: null }
}
