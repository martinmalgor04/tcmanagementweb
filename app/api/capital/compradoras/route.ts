import { NextResponse } from "next/server"

import { parseCompradora } from "@/lib/customer-fields"
import { fulfillPurchase } from "@/lib/capital/fulfillment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 })
  }

  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : {}
  if (asString(body.empresa).length > 0) {
    return NextResponse.json({ ok: true, access: false })
  }

  const parsed = parseCompradora(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message, fields: parsed.fields }, { status: 400 })
  }

  const mpStatus = asString(body.mp_status).trim().slice(0, 40)
  const mpPaymentId = asString(body.mp_payment_id).trim().slice(0, 80)

  try {
    const result = await fulfillPurchase({
      customer: {
        email: parsed.data.email,
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        whatsapp: parsed.data.whatsapp,
        ciudad: parsed.data.ciudad,
        instagram: parsed.data.instagram,
        source: "landing-cev",
      },
      paymentId: mpPaymentId || null,
      redirectStatus: mpStatus || null,
      rawPayload: { origin: "gracias-form", mp_status: mpStatus || null },
    })

    return NextResponse.json({
      ok: true,
      access: result.paid,
      // Sólo viaja con el pago verificado contra Mercado Pago.
      accessUrl: result.accessUrl,
      emailStatus: result.emailStatus,
    })
  } catch (error) {
    console.error("[capital] fulfillment falló", error)
    return NextResponse.json({ error: "No se pudo guardar. Probá de nuevo." }, { status: 502 })
  }
}
