import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { fulfillMercadoPagoPayment } from "@/lib/capital/fulfillment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Webhook de Mercado Pago (notificaciones de tipo `payment`).
 *
 * Es la confirmación de pago que no depende del navegador. Un pago aprobado
 * impacta aunque la compradora no vuelva a /gracias: se crea la orden, se
 * habilita el acceso y se manda el mail al correo de la cuenta de Mercado Pago.
 * El formulario, si llega después, sólo completa WhatsApp / Instagram.
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
    const result = await fulfillMercadoPagoPayment(paymentId)
    if (!result.ok) {
      console.warn("[capital] webhook no impactó", paymentId, result)
    }
  } catch (error) {
    console.error("[capital] webhook falló", paymentId, error)
  }

  return ok
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
