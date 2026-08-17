import { createHash, randomBytes } from "node:crypto"

/**
 * Token del magic link. El valor en claro viaja sólo en el mail; en la base
 * queda únicamente el sha256, así una filtración de la tabla no da acceso.
 */
export function createAccessToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url")
  return { raw, hash: hashAccessToken(raw) }
}

export function hashAccessToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}
