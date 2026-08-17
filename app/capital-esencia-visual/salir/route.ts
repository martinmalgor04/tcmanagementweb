import { NextResponse } from "next/server"

import { ACCESS_COOKIE_NAME } from "@/lib/capital/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const res = NextResponse.redirect(new URL("/capital-esencia-visual", url.origin), 302)
  res.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/capital-esencia-visual",
    maxAge: 0,
  })
  return res
}
