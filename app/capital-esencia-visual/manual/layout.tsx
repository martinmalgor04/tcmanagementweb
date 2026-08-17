import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { hasActiveEntitlement } from "@/lib/capital/access"
import { ACCESS_COOKIE_NAME } from "@/lib/capital/config"
import { readSessionCookie } from "@/lib/capital/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Puerta del contenido pago. Se resuelve en el server, antes de mandar un byte
 * de HTML al navegador.
 *
 * Devolvemos 404 y no 401: un 401 confirmaría que la ruta existe. Ante
 * cualquier duda (cookie rota, base caída) también cerramos.
 */
export default async function ManualLayout({ children }: { children: ReactNode }) {
  const store = await cookies()
  const session = readSessionCookie(store.get(ACCESS_COOKIE_NAME)?.value)
  if (!session) notFound()

  let allowed = false
  try {
    allowed = await hasActiveEntitlement(session.cid, session.pid)
  } catch (error) {
    console.error("[capital] no se pudo verificar el entitlement", error)
  }

  if (!allowed) notFound()

  return <>{children}</>
}
