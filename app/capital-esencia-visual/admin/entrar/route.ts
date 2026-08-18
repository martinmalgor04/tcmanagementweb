import { NextResponse } from "next/server"

import {
  ADMIN_COOKIE_NAME,
  ADMIN_PATH,
  createAdminCookie,
  isValidAdminToken,
} from "@/lib/capital/admin-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Entrada al panel. Recibe el token por formulario y lo cambia por una cookie
 * firmada. Un token equivocado vuelve al panel con ?error=1, sin decir si el
 * panel siquiera está habilitado.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const token = form?.get("token")

  const destino = new URL(ADMIN_PATH, new URL(req.url).origin)

  if (typeof token !== "string" || !isValidAdminToken(token)) {
    destino.searchParams.set("error", "1")
    return NextResponse.redirect(destino, 303)
  }

  const { value, maxAge } = createAdminCookie()
  const res = NextResponse.redirect(destino, 303)
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/capital-esencia-visual",
    maxAge,
  })
  return res
}
