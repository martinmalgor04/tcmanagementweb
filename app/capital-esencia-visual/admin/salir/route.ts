import { NextResponse } from "next/server"

import { ADMIN_COOKIE_NAME, ADMIN_PATH } from "@/lib/capital/admin-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL(ADMIN_PATH, new URL(req.url).origin), 303)
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/capital-esencia-visual",
    maxAge: 0,
  })
  return res
}
