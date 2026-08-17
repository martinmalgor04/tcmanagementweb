import { NextResponse } from "next/server"
import { z } from "zod"

import { fulfillPurchase } from "@/lib/capital/fulfillment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({
  nombre: z.string().trim().min(2).max(80),
  apellido: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  whatsapp: z.string().trim().min(8).max(30),
  ciudad: z.string().trim().max(80).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  mp_status: z.string().trim().max(40).optional().or(z.literal("")),
  mp_payment_id: z.string().trim().max(80).optional().or(z.literal("")),
  empresa: z.string().max(0).optional().or(z.literal("")),
})

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos e intentá de nuevo." }, { status: 400 })
  }

  const { empresa, ...data } = parsed.data
  if (empresa) {
    return NextResponse.json({ ok: true, access: false })
  }

  try {
    const result = await fulfillPurchase({
      customer: {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        whatsapp: data.whatsapp,
        ciudad: data.ciudad || null,
        instagram: data.instagram?.replace(/^@/, "") || null,
        source: "landing-cev",
      },
      paymentId: data.mp_payment_id || null,
      redirectStatus: data.mp_status || null,
      rawPayload: { origin: "gracias-form", mp_status: data.mp_status || null },
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
