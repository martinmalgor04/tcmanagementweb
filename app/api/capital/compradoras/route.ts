import { NextResponse } from "next/server"
import { z } from "zod"

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
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Falta configurar la base." }, { status: 500 })
  }

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
    return NextResponse.json({ ok: true })
  }

  const row = {
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email.toLowerCase(),
    whatsapp: data.whatsapp,
    ciudad: data.ciudad || null,
    instagram: data.instagram?.replace(/^@/, "") || null,
    producto: "Capital de Esencia Visual",
    mp_status: data.mp_status || null,
    mp_payment_id: data.mp_payment_id || null,
  }

  const res = await fetch(`${url}/rest/v1/cev_compradoras`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error("cev_compradoras insert failed", res.status, detail)
    return NextResponse.json({ error: "No se pudo guardar. Probá de nuevo." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
