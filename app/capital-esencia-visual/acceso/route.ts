import { NextResponse } from "next/server"

import { redeemAccessLink } from "@/lib/capital/access"
import { ACCESS_COOKIE_NAME, ACCESS_INVALID_PATH, ACCESS_PATH } from "@/lib/capital/config"
import { recordEvent } from "@/lib/capital/events"
import { createSessionCookie } from "@/lib/capital/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Canjea el magic link: valida el token contra la base, deja una cookie firmada
 * y manda al HTML. El token nunca queda en el historial del navegador más allá
 * de esta redirección.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")

  const invalid = NextResponse.redirect(new URL(ACCESS_INVALID_PATH, url.origin), 302)
  invalid.headers.set("x-robots-tag", "noindex, nofollow")

  if (!token) return invalid

  let redeemed: { customerId: string; productId: string } | null = null
  try {
    redeemed = await redeemAccessLink(token)
  } catch (error) {
    console.error("[capital] canje de token falló", error)
  }

  if (!redeemed) return invalid

  await recordEvent({
    kind: "access_redeemed",
    customerId: redeemed.customerId,
    productId: redeemed.productId,
    path: url.pathname,
  })

  const { value, maxAge } = createSessionCookie(redeemed.customerId, redeemed.productId)

  const res = NextResponse.redirect(new URL(ACCESS_PATH, url.origin), 302)
  res.headers.set("x-robots-tag", "noindex, nofollow")
  res.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/capital-esencia-visual",
    maxAge,
  })

  return res
}
