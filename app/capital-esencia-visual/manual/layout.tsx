import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { ACCESS_PATH } from "@/lib/capital/config"
import { recordEvent } from "@/lib/capital/events"
import { getManualSession } from "@/lib/capital/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Puerta del contenido pago. Se resuelve en el server, antes de mandar un byte
 * de HTML al navegador.
 *
 * Devolvemos 404 y no 401: un 401 confirmaría que la ruta existe.
 */
export default async function ManualLayout({ children }: { children: ReactNode }) {
  const session = await getManualSession()
  if (!session) notFound()

  // Acá y no en la ruta del contenido: el iframe la pide en cada visita, así
  // que contarla ahí duplicaría los accesos.
  await recordEvent({
    kind: "manual_view",
    customerId: session.cid,
    productId: session.pid,
    path: ACCESS_PATH,
  })

  return <>{children}</>
}
