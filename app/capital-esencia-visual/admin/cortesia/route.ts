import { NextResponse } from "next/server"

import {
  findCustomerByEmail,
  getProduct,
  grantEntitlement,
  recordOrder,
  upsertCustomer,
} from "@/lib/capital/access"
import { ADMIN_PATH, hasAdminSession } from "@/lib/capital/admin-session"
import { PRODUCT_SLUG } from "@/lib/capital/config"
import { deliverAccess } from "@/lib/capital/deliver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Da acceso sin pasar por Mercado Pago (cortesía, pago en efectivo, etc.) y
 * manda el mismo mail de acceso que recibe quien compra por la landing.
 *
 * El monto queda en $0 para no inflar "Facturado": esto no es una venta.
 */
export async function POST(req: Request) {
  const destino = new URL(ADMIN_PATH, new URL(req.url).origin)

  if (!(await hasAdminSession())) {
    return NextResponse.redirect(destino, 303)
  }

  const form = await req.formData().catch(() => null)
  const email = form?.get("email")
  const nombre = form?.get("nombre")
  const apellido = form?.get("apellido")

  if (typeof email !== "string" || !email.includes("@")) {
    destino.searchParams.set("aviso", "Mail inválido.")
    return NextResponse.redirect(destino, 303)
  }

  try {
    const product = await getProduct(PRODUCT_SLUG)
    if (!product) {
      destino.searchParams.set("aviso", `Falta el producto ${PRODUCT_SLUG}.`)
      return NextResponse.redirect(destino, 303)
    }

    const customer =
      (await findCustomerByEmail(email)) ??
      (await upsertCustomer({
        email,
        nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : null,
        apellido: typeof apellido === "string" && apellido.trim() ? apellido.trim() : null,
        source: "admin-cortesia",
      }))

    const order = await recordOrder({
      customerId: customer.id,
      product,
      status: "paid",
      paymentVerified: true,
      provider: "cortesia",
      amountCents: 0,
      rawPayload: { origin: "admin-panel-cortesia" },
    })
    await grantEntitlement(customer.id, product.id, order.id)

    const { emailStatus } = await deliverAccess({
      customer,
      product,
      orderId: order.id,
      amountCents: 0,
    })

    destino.searchParams.set(
      "aviso",
      emailStatus === "sent"
        ? `Acceso de cortesía enviado a ${email}.`
        : `Se generó el acceso pero no se pudo mandar el mail a ${email} (${emailStatus}). Reenvialo desde la tabla.`,
    )
  } catch (error) {
    console.error("[capital] cortesía desde el panel falló", error)
    destino.searchParams.set("aviso", "Algo falló al dar el acceso. Probá de nuevo.")
  }

  return NextResponse.redirect(destino, 303)
}
