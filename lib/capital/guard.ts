/**
 * NUNCA importar desde un componente cliente: acá se resuelve quién puede ver
 * el contenido pago.
 */

import { cookies } from "next/headers"

import { hasActiveEntitlement } from "./access"
import { ACCESS_COOKIE_NAME } from "./config"
import { readSessionCookie } from "./session"

/**
 * Puerta única del contenido pago. La usan el layout de /manual y la ruta que
 * sirve el HTML: si cada una tuviera su propia versión, alcanzaría con que una
 * quedara desactualizada para dejar el contenido abierto.
 *
 * Ante cualquier duda (cookie rota, base caída) devuelve false.
 */
export async function hasManualAccess(): Promise<boolean> {
  const store = await cookies()
  const session = readSessionCookie(store.get(ACCESS_COOKIE_NAME)?.value)
  if (!session) return false

  try {
    return await hasActiveEntitlement(session.cid, session.pid)
  } catch (error) {
    console.error("[capital] no se pudo verificar el entitlement", error)
    return false
  }
}
