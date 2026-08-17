import { NextResponse } from "next/server"
import { z } from "zod"

import { findCustomerByEmail, getProduct, hasActiveEntitlement, issueAccessLink } from "@/lib/capital/access"
import { PRODUCT_SLUG } from "@/lib/capital/config"
import { sendAccessEmail } from "@/lib/capital/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({
  email: z.string().trim().email().max(120),
  empresa: z.string().max(0).optional().or(z.literal("")),
})

/**
 * Reenvía el magic link a quien ya compró.
 *
 * Siempre responde lo mismo, exista o no la compradora: si contestara distinto
 * sería un oráculo para averiguar qué mails están en la base.
 */
export async function POST(req: Request) {
  const ok = NextResponse.json({ ok: true })

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá el mail e intentá de nuevo." }, { status: 400 })
  }
  if (parsed.data.empresa) return ok

  try {
    const product = await getProduct(PRODUCT_SLUG)
    if (!product) return ok

    const customer = await findCustomerByEmail(parsed.data.email)
    if (!customer) return ok

    if (!(await hasActiveEntitlement(customer.id, product.id))) return ok

    const accessUrl = await issueAccessLink(customer.id, product.id)
    await sendAccessEmail({ customer, product, accessUrl, orderId: null })
  } catch (error) {
    console.error("[capital] reenvío de acceso falló", error)
  }

  return ok
}
