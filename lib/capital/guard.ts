/**
 * NUNCA importar desde un componente cliente: acá se resuelve quién puede ver
 * el contenido pago.
 */

import { cookies } from "next/headers"

import { hasActiveEntitlement } from "./access"
import { ACCESS_COOKIE_NAME } from "./config"
import { type AccessSession, readSessionCookie } from "./session"

/**
 * Puerta única del contenido pago. La usan el layout de /manual y la ruta que
 * sirve el HTML: si cada una tuviera su propia versión, alcanzaría con que una
 * quedara desactualizada para dejar el contenido abierto.
 *
 * Devuelve la sesión para que quien llama pueda registrar el acceso. Ante
 * cualquier duda (cookie rota, base caída) devuelve null.
 */
export async function getManualSession(): Promise<AccessSession | null> {
  const store = await cookies()
  const session = readSessionCookie(store.get(ACCESS_COOKIE_NAME)?.value)
  if (!session) return null

  try {
    const allowed = await hasActiveEntitlement(session.cid, session.pid)
    return allowed ? session : null
  } catch (error) {
    console.error("[capital] no se pudo verificar el entitlement", error)
    return null
  }
}
