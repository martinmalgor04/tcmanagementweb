import { NextResponse } from "next/server"

import {
  findCustomerByEmail,
  getProduct,
  grantEntitlement,
  hasActiveEntitlement,
  recordOrder,
  upsertCustomer,
} from "@/lib/capital/access"
import { ADMIN_PATH, hasAdminSession } from "@/lib/capital/admin-session"
import { PRODUCT_SLUG, ownerEmail } from "@/lib/capital/config"
import { issueAccessLinkOnly } from "@/lib/capital/deliver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Entrada directa al manual para el dueño del producto. El mail no viaja por
 * formulario: es siempre el de ownerEmail(), así este botón no se puede usar
 * para colarle acceso a nadie más.
 */
export async function POST(req: Request) {
  const destino = new URL(ADMIN_PATH, new URL(req.url).origin)

  if (!(await hasAdminSession())) {
    return NextResponse.redirect(destino, 303)
  }

  const email = ownerEmail()

  try {
    const product = await getProduct(PRODUCT_SLUG)
    if (!product) {
      destino.searchParams.set("aviso", `Falta el producto ${PRODUCT_SLUG}.`)
      return NextResponse.redirect(destino, 303)
    }

    let customer = await findCustomerByEmail(email)

    if (!customer || !(await hasActiveEntitlement(customer.id, product.id))) {
      customer = customer ?? (await upsertCustomer({ email, source: "admin" }))
      const order = await recordOrder({
        customerId: customer.id,
        product,
        status: "paid",
        paymentVerified: true,
        provider: "manual",
        rawPayload: { origin: "admin-acceder" },
      })
      await grantEntitlement(customer.id, product.id, order.id)
    }

    const accessUrl = await issueAccessLinkOnly(customer, product)
    return NextResponse.redirect(accessUrl, 303)
  } catch (error) {
    console.error("[capital] acceso directo desde el panel falló", error)
    destino.searchParams.set("aviso", "Algo falló al entrar. Probá de nuevo.")
    return NextResponse.redirect(destino, 303)
  }
}
