import { NextResponse } from "next/server"

import { ADMIN_PATH, hasAdminSession } from "@/lib/capital/admin-session"
import { fulfillMercadoPagoPayment } from "@/lib/capital/fulfillment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Recupera un pago de Mercado Pago que no impactó (pagó y no volvió a
 * /gracias, webhook perdido, etc.). Misma lógica que el webhook.
 */
export async function POST(req: Request) {
  const destino = new URL(ADMIN_PATH, new URL(req.url).origin)

  if (!(await hasAdminSession())) {
    return NextResponse.redirect(destino, 303)
  }

  const form = await req.formData().catch(() => null)
  const rawId = form?.get("payment_id")
  const email = form?.get("email")
  const nombre = form?.get("nombre")
  const apellido = form?.get("apellido")

  const paymentId = typeof rawId === "string" ? rawId.replace(/\D/g, "") : ""
  if (!paymentId) {
    destino.searchParams.set("aviso", "Falta el número de operación de Mercado Pago.")
    return NextResponse.redirect(destino, 303)
  }

  try {
    const result = await fulfillMercadoPagoPayment(paymentId, {
      email: typeof email === "string" && email.includes("@") ? email : null,
      nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : null,
      apellido: typeof apellido === "string" && apellido.trim() ? apellido.trim() : null,
    })

    if (!result.ok) {
      const mensaje =
        result.reason === "not_found"
          ? `Mercado Pago no encontró el pago ${paymentId}.`
          : result.reason === "no_email"
            ? `El pago ${paymentId} no trae mail. Cargalo a mano y reintentá.`
            : result.reason === "mismatch"
              ? `El pago ${paymentId} no corresponde a este producto o al precio.`
              : `El pago ${paymentId} no está acreditado (${result.status ?? "sin estado"}).`
      destino.searchParams.set("aviso", mensaje)
      return NextResponse.redirect(destino, 303)
    }

    const mail = result.customer.email
    if (result.alreadyPaid && result.emailStatus === "skipped") {
      destino.searchParams.set("aviso", `Ese pago ya estaba cargado para ${mail}.`)
    } else if (result.order.status !== "paid") {
      destino.searchParams.set(
        "aviso",
        `El pago ${paymentId} quedó registrado pero todavía no está acreditado.`,
      )
    } else {
      destino.searchParams.set(
        "aviso",
        result.emailStatus === "sent"
          ? `Pago ${paymentId} impactado. Acceso enviado a ${mail}.`
          : `Pago ${paymentId} impactado para ${mail}, pero el mail no salió (${result.emailStatus}). Reenvialo desde la tabla.`,
      )
    }
  } catch (error) {
    console.error("[capital] recuperar pago falló", paymentId, error)
    destino.searchParams.set("aviso", "Algo falló al recuperar el pago. Probá de nuevo.")
  }

  return NextResponse.redirect(destino, 303)
}
