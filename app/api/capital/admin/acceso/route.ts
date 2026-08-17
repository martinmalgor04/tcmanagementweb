import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  findCustomerByEmail,
  getProduct,
  grantEntitlement,
  hasActiveEntitlement,
  recordOrder,
  upsertCustomer,
} from "@/lib/capital/access"
import { PRODUCT_SLUG, adminToken } from "@/lib/capital/config"
import { deliverAccess, issueAccessLinkOnly } from "@/lib/capital/deliver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({
  email: z.string().trim().email().max(120),
  /** Habilita a alguien que pagó por fuera de Mercado Pago (transferencia, cortesía). */
  grant: z.boolean().optional(),
  /** Además de devolver el link, mandarlo por mail. */
  send: z.boolean().optional(),
})

/**
 * Herramienta de soporte para generar un link de acceso a mano.
 *
 * curl -X POST https://tcmanagement.com.ar/api/capital/admin/acceso \
 *   -H 'x-capital-admin-token: ...' -H 'content-type: application/json' \
 *   -d '{"email":"tarsila@ejemplo.com"}'
 */
export async function POST(req: Request) {
  const expected = adminToken()
  if (!expected) {
    return NextResponse.json({ error: "No disponible." }, { status: 404 })
  }

  const provided = req.headers.get("x-capital-admin-token") || ""
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "No disponible." }, { status: 404 })
  }

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 })
  }

  const product = await getProduct(PRODUCT_SLUG)
  if (!product) {
    return NextResponse.json({ error: `Falta el producto ${PRODUCT_SLUG}.` }, { status: 500 })
  }

  let customer = await findCustomerByEmail(parsed.data.email)

  if (parsed.data.grant) {
    customer = customer ?? (await upsertCustomer({ email: parsed.data.email, source: "admin" }))
    const order = await recordOrder({
      customerId: customer.id,
      product,
      status: "paid",
      paymentVerified: true,
      provider: "manual",
      rawPayload: { origin: "admin-grant" },
    })
    await grantEntitlement(customer.id, product.id, order.id)
  }

  if (!customer) {
    return NextResponse.json({ error: "No existe esa compradora." }, { status: 404 })
  }

  if (!(await hasActiveEntitlement(customer.id, product.id))) {
    return NextResponse.json(
      { error: "Sin entitlement activo. Reintentá con grant: true." },
      { status: 409 },
    )
  }

  const delivered = parsed.data.send
    ? await deliverAccess({ customer, product, orderId: null })
    : { accessUrl: await issueAccessLinkOnly(customer, product), emailStatus: null }

  return NextResponse.json({
    ok: true,
    customerId: customer.id,
    accessUrl: delivered.accessUrl,
    emailStatus: delivered.emailStatus,
  })
}
