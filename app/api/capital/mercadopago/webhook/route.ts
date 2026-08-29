import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import {
  findCustomerById,
  findOrderByPaymentId,
  getProduct,
  grantEntitlement,
  recordOrder,
  upsertCustomer,
} from "@/lib/capital/access"
import { PRODUCT_SLUG } from "@/lib/capital/config"
import { deliverAccess } from "@/lib/capital/deliver"
import { fetchPayment } from "@/lib/capital/mercadopago"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Webhook de Mercado Pago (notificaciones de tipo `payment`).
 *
 * Es la única confirmación de pago que no depende del navegador. Queda inerte
 * hasta que estén cargadas MP_ACCESS_TOKEN y, opcionalmente, MP_WEBHOOK_SECRET.
 *
 * Siempre responde 200: si devolviéramos error, Mercado Pago reintenta en loop.
 */
export async function POST(req: Request) {
  const ok = NextResponse.json({ ok: true })

  const url = new URL(req.url)
  const rawBody = await req.text()

  let body: { type?: string; action?: string; data?: { id?: string | number } } = {}
  try {
    body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    // Mercado Pago a veces notifica sólo por query string.
  }

  const type = body.type || url.searchParams.get("type") || url.searchParams.get("topic")
  const paymentId = String(body.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "")

  if (type !== "payment" || !paymentId) return ok

  if (!verifySignature(req, paymentId)) {
    console.warn("[capital] webhook con firma inválida", paymentId)
    return ok
  }

  try {
    await processPayment(paymentId)
  } catch (error) {
    console.error("[capital] webhook falló", paymentId, error)
  }

  return ok
}

async function processPayment(paymentId: string) {
  const payment = await fetchPayment(paymentId)
  if (!payment) return

  const status =
    payment.status === "approved" ? "paid" : payment.status === "rejected" ? "failed" : "pending"

  const product = await getProduct(PRODUCT_SLUG)
  if (!product) throw new Error(`No existe el producto ${PRODUCT_SLUG}`)

  // Si la compradora ya pasó por el formulario, la order existe y tiene los
  // datos buenos. Si el webhook llega primero, arrancamos con el mail del payer.
  const existing = await findOrderByPaymentId("mercadopago", paymentId)
  const customer = existing
    ? await findCustomerById(existing.customer_id)
    : payment.payer?.email
      ? await upsertCustomer({
          email: payment.payer.email,
          nombre: payment.payer.first_name || null,
          apellido: payment.payer.last_name || null,
          source: "mercadopago-webhook",
        })
      : null

  if (!customer) return

  const order = await recordOrder({
    customerId: customer.id,
    product,
    status,
    paymentVerified: true,
    providerPaymentId: paymentId,
    amountCents: payment.transaction_amount
      ? Math.round(payment.transaction_amount * 100)
      : product.price_cents,
    rawPayload: payment,
  })

  if (status !== "paid") return

  await grantEntitlement(customer.id, product.id, order.id)
  await deliverAccess({ customer, product, orderId: order.id, amountCents: order.amount_cents })
}

/**
 * Firma de Mercado Pago: header `x-signature` con `ts` y `v1`, sobre el
 * manifiesto `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
 */
function verifySignature(req: Request, paymentId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true

  const signature = req.headers.get("x-signature")
  const requestId = req.headers.get("x-request-id") || ""
  if (!signature) return false

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, ...rest] = part.split("=")
      return [key.trim(), rest.join("=").trim()]
    }),
  )

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const expected = createHmac("sha256", secret).update(manifest).digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  return a.length === b.length && timingSafeEqual(a, b)
}
