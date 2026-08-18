/**
 * Registro de eventos del embudo.
 *
 * Las métricas son secundarias: si la base falla, la compradora tiene que poder
 * comprar y leer igual. Por eso nada de acá propaga errores.
 */

import { insert } from "./db"

export type EventKind = "landing_view" | "checkout_click" | "access_redeemed" | "manual_view"

/** Los únicos que puede disparar el navegador. El resto se registra en el server. */
export const CLIENT_EVENT_KINDS: EventKind[] = ["landing_view", "checkout_click"]

export const VISITOR_COOKIE_NAME = "cev_v"
export const VISITOR_COOKIE_TTL_DAYS = 180

export type RecordEventInput = {
  kind: EventKind
  productId?: string | null
  customerId?: string | null
  path?: string | null
  referrer?: string | null
  visitor?: string | null
}

export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    await insert("page_events", {
      kind: input.kind,
      product_id: input.productId ?? null,
      customer_id: input.customerId ?? null,
      path: trim(input.path, 300),
      referrer: trim(input.referrer, 300),
      visitor: trim(input.visitor, 64),
    })
  } catch (error) {
    console.error("[capital] no se pudo registrar el evento", input.kind, error)
  }
}

function trim(value: string | null | undefined, max: number): string | null {
  if (!value) return null
  const clean = value.trim()
  return clean ? clean.slice(0, max) : null
}
