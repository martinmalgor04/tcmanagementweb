import { createHmac, timingSafeEqual } from "node:crypto"

import { ACCESS_COOKIE_TTL_DAYS, sessionSecret } from "./config"

export type AccessSession = {
  /** Discriminador de dominio. Ver lib/capital/admin-session. */
  typ?: "access"
  /** customer_id */
  cid: string
  /** product_id */
  pid: string
  /** epoch en segundos */
  exp: number
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
}

export function createSessionCookie(cid: string, pid: string): { value: string; maxAge: number } {
  const maxAge = ACCESS_COOKIE_TTL_DAYS * 24 * 60 * 60
  const session: AccessSession = {
    typ: "access",
    cid,
    pid,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return { value: `${payload}.${sign(payload)}`, maxAge }
}

export function readSessionCookie(raw: string | undefined): AccessSession | null {
  if (!raw) return null

  const separator = raw.lastIndexOf(".")
  if (separator <= 0) return null

  const payload = raw.slice(0, separator)
  const signature = raw.slice(separator + 1)

  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AccessSession
    if (!session.cid || !session.pid) return null
    if (session.exp * 1000 < Date.now()) return null
    return session
  } catch {
    return null
  }
}
