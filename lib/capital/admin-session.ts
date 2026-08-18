/**
 * Sesión del panel. Sólo server.
 *
 * El token de admin viaja una vez en el formulario de entrada; después queda
 * una cookie firmada, para no tenerlo dando vueltas en cada request.
 */

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import { adminToken, sessionSecret } from "./config"

export const ADMIN_COOKIE_NAME = "cev_admin"
export const ADMIN_COOKIE_TTL_DAYS = 7
export const ADMIN_PATH = "/capital-esencia-visual/admin"

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Compara sin filtrar por tiempo cuántos caracteres coincidían. */
export function isValidAdminToken(candidate: string): boolean {
  const expected = adminToken()
  if (!expected) return false
  return equals(candidate, expected)
}

export function createAdminCookie(): { value: string; maxAge: number } {
  const maxAge = ADMIN_COOKIE_TTL_DAYS * 24 * 60 * 60
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + maxAge }),
  ).toString("base64url")
  return { value: `${payload}.${sign(payload)}`, maxAge }
}

export async function hasAdminSession(): Promise<boolean> {
  const raw = (await cookies()).get(ADMIN_COOKIE_NAME)?.value
  if (!raw) return false

  const separator = raw.lastIndexOf(".")
  if (separator <= 0) return false

  const payload = raw.slice(0, separator)
  if (!equals(sign(payload), raw.slice(separator + 1))) return false

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number }
    return exp * 1000 > Date.now()
  } catch {
    return false
  }
}
