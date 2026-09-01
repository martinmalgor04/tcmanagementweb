/**
 * Sesión del panel. Sólo server.
 *
 * El token de admin viaja una vez en el formulario de entrada; después queda
 * una cookie firmada, para no tenerlo dando vueltas en cada request.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import { adminToken, sessionSecret } from "./config"

export const ADMIN_COOKIE_NAME = "cev_admin"
export const ADMIN_COOKIE_TTL_DAYS = 7
export const ADMIN_PATH = "/capital-esencia-visual/admin"

/**
 * Clave propia del dominio admin. La cookie de acceso de compradora se firma
 * con otra derivación, así una no puede hacerse pasar por la otra ni aunque
 * compartan formato.
 */
function adminKey(): Buffer {
  return createHmac("sha256", sessionSecret()).update("cev:admin:v1").digest()
}

function sign(payload: string): string {
  return createHmac("sha256", adminKey()).update(payload).digest("base64url")
}

/** Huella del token vigente: rotar CAPITAL_ADMIN_TOKEN invalida las sesiones. */
function tokenFingerprint(): string {
  return createHash("sha256").update(adminToken() || "").digest("hex").slice(0, 16)
}

type AdminClaims = { typ?: string; fpr?: string; exp: number }

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
  const claims: AdminClaims = {
    typ: "admin",
    fpr: tokenFingerprint(),
    exp: Math.floor(Date.now() / 1000) + maxAge,
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
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
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminClaims
    // Sin el discriminador, cualquier cookie firmada con el mismo secreto —la
    // de acceso de una compradora, por ejemplo— pasaba por sesión de admin.
    if (claims.typ !== "admin") return false
    if (claims.fpr !== tokenFingerprint()) return false
    return claims.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
