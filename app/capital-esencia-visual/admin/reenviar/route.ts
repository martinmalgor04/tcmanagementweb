import { NextResponse } from "next/server"

import {
  findCustomerByEmail,
  findPaidVerifiedOrder,
  getProduct,
  grantEntitlement,
  hasActiveEntitlement,
} from "@/lib/capital/access"
import { ADMIN_PATH, hasAdminSession } from "@/lib/capital/admin-session"
import { PRODUCT_SLUG } from "@/lib/capital/config"
import { deliverAccess } from "@/lib/capital/deliver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Reenvía el acceso desde el panel. A diferencia del endpoint público, acá sí
 * se informa qué pasó: del otro lado hay alguien resolviendo un problema.
 */
export async function POST(req: Request) {
  const destino = new URL(ADMIN_PATH, new URL(req.url).origin)

  if (!(await hasAdminSession())) {
    return NextResponse.redirect(destino, 303)
  }

  const form = await req.formData().catch(() => null)
  const email = form?.get("email")

  if (typeof email !== "string" || !email.includes("@")) {
    destino.searchParams.set("aviso", "Mail inválido.")
    return NextResponse.redirect(destino, 303)
  }

  try {
    const product = await getProduct(PRODUCT_SLUG)
    const customer = await findCustomerByEmail(email)

    if (!product || !customer) {
      destino.searchParams.set("aviso", `No hay ninguna compradora con ${email}.`)
      return NextResponse.redirect(destino, 303)
    }

    let orderId: string | null = null
    if (!(await hasActiveEntitlement(customer.id, product.id))) {
      const order = await findPaidVerifiedOrder(customer.id, product.id)
      if (!order) {
        destino.searchParams.set("aviso", `${email} no tiene el acceso activo.`)
        return NextResponse.redirect(destino, 303)
      }
      await grantEntitlement(customer.id, product.id, order.id)
      orderId = order.id
    }

    const { emailStatus } = await deliverAccess({ customer, product, orderId })

    destino.searchParams.set(
      "aviso",
      emailStatus === "sent"
        ? `Link nuevo enviado a ${email}.`
        : `No se pudo enviar a ${email} (${emailStatus}). Mirá los envíos fallidos.`,
    )
  } catch (error) {
    console.error("[capital] reenvío desde el panel falló", error)
    destino.searchParams.set("aviso", "Algo falló al reenviar. Probá de nuevo.")
  }

  return NextResponse.redirect(destino, 303)
}
