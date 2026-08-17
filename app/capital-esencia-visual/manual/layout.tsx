import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { hasManualAccess } from "@/lib/capital/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Puerta del contenido pago. Se resuelve en el server, antes de mandar un byte
 * de HTML al navegador.
 *
 * Devolvemos 404 y no 401: un 401 confirmaría que la ruta existe.
 */
export default async function ManualLayout({ children }: { children: ReactNode }) {
  if (!(await hasManualAccess())) notFound()

  return <>{children}</>
}
