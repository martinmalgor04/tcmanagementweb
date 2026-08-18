import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"
import { z } from "zod"

import { getProduct } from "@/lib/capital/access"
import { PRODUCT_SLUG } from "@/lib/capital/config"
import {
  CLIENT_EVENT_KINDS,
  VISITOR_COOKIE_NAME,
  VISITOR_COOKIE_TTL_DAYS,
  recordEvent,
} from "@/lib/capital/events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({
  kind: z.enum(["landing_view", "checkout_click"]),
  path: z.string().max(300).optional(),
  referrer: z.string().max(300).optional(),
})

/**
 * Recibe los eventos que dispara el navegador.
 *
 * Sólo acepta los eventos anónimos del embudo: los que dicen algo sobre el
 * acceso pago se registran en el server, donde no se pueden inventar.
 *
 * Siempre responde 204, incluso ante un cuerpo inválido, para no darle
 * información a nadie ni ensuciar la consola del visitante.
 */
export async function POST(req: Request) {
  const noContent = new NextResponse(null, { status: 204 })

  let visitor = req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE_NAME}=`))
    ?.split("=")[1]

  let isNewVisitor = false
  if (!visitor) {
    visitor = randomBytes(16).toString("base64url")
    isNewVisitor = true
  }

  if (isNewVisitor) {
    noContent.cookies.set({
      name: VISITOR_COOKIE_NAME,
      value: visitor,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_TTL_DAYS * 24 * 60 * 60,
    })
  }

  try {
    const parsed = Body.safeParse(await req.json())
    if (!parsed.success) return noContent
    if (!CLIENT_EVENT_KINDS.includes(parsed.data.kind)) return noContent

    const product = await getProduct(PRODUCT_SLUG)

    await recordEvent({
      kind: parsed.data.kind,
      productId: product?.id ?? null,
      path: parsed.data.path,
      referrer: parsed.data.referrer,
      visitor,
    })
  } catch (error) {
    console.error("[capital] track falló", error)
  }

  return noContent
}
