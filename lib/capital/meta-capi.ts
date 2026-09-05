/**
 * Conversions API de Meta. Sólo se importa desde el server.
 *
 * Es el camino que garantiza que ninguna venta aprobada se pierda del reporte
 * de ads: sale desde el webhook (o desde el formulario), no depende de que la
 * compradora vuelva a /gracias. El `event_id` es el payment_id de Mercado
 * Pago, el mismo que manda el Pixel desde el navegador, así Meta deduplica.
 *
 * Email y teléfono viajan hasheados en SHA-256, normalizados antes.
 * Nunca lanza: una falla en Meta no puede frenar la entrega del manual.
 */

import { createHash } from "node:crypto"

import { isUsablePayerEmail } from "./mercadopago"

/** Actualizar cuando Meta deprecie la versión. */
export const META_GRAPH_VERSION = "v21.0"

export function metaCapiConfig(): { pixelId: string; accessToken: string; testEventCode: string | null } | null {
  const pixelId = (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "").replace(/\D/g, "")
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  if (!pixelId || !accessToken) return null
  return { pixelId, accessToken, testEventCode: process.env.META_TEST_EVENT_CODE?.trim() || null }
}

export type MetaPurchaseInput = {
  /** payment_id de Mercado Pago. Mismo valor que el `eventID` del Pixel. */
  eventId: string
  /** Unix timestamp en segundos del momento del pago. */
  eventTime: number
  value: number
  currency: string
  contentName: string
  eventSourceUrl: string
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  clientIp?: string | null
  clientUa?: string | null
  fbp?: string | null
  fbc?: string | null
}

export type MetaCapiResult =
  | { ok: true; eventsReceived: number; fbtraceId?: string }
  | { ok: false; skipped: true; reason: "not_configured" }
  | { ok: false; skipped: false; error: string }

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const value = (email || "").trim().toLowerCase().replace(/\s+/g, "")
  return isUsablePayerEmail(value) ? value : null
}

/** Sólo dígitos con código de país: `+54 9 362 ...` → `549362...`. */
export function normalizePhone(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "")
  return digits.length >= 8 ? digits : null
}

function normalizeName(name: string | null | undefined): string | null {
  const value = (name || "").trim().toLowerCase()
  return value ? value : null
}

export function buildUserData(input: MetaPurchaseInput): Record<string, unknown> {
  const userData: Record<string, unknown> = {}

  const email = normalizeEmail(input.email)
  if (email) userData.em = [sha256(email)]

  const phone = normalizePhone(input.phone)
  if (phone) userData.ph = [sha256(phone)]

  const fn = normalizeName(input.firstName)
  if (fn) userData.fn = [sha256(fn)]

  const ln = normalizeName(input.lastName)
  if (ln) userData.ln = [sha256(ln)]

  if (input.clientIp) userData.client_ip_address = input.clientIp
  if (input.clientUa) userData.client_user_agent = input.clientUa
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  return userData
}

export function buildPurchasePayload(input: MetaPurchaseInput, testEventCode: string | null) {
  // Meta rechaza eventos con más de 7 días o en el futuro.
  const now = Math.floor(Date.now() / 1000)
  const sevenDays = 7 * 24 * 60 * 60
  const eventTime =
    input.eventTime > now || input.eventTime < now - sevenDays ? now : Math.floor(input.eventTime)

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTime,
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: buildUserData(input),
        custom_data: {
          value: input.value,
          currency: input.currency,
          content_name: input.contentName,
        },
      },
    ],
  }
  if (testEventCode) payload.test_event_code = testEventCode
  return payload
}

export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<MetaCapiResult> {
  const config = metaCapiConfig()
  if (!config) {
    console.warn("[capital] META_CAPI_ACCESS_TOKEN / META_PIXEL_ID sin cargar: Purchase no se manda a Meta", input.eventId)
    return { ok: false, skipped: true, reason: "not_configured" }
  }

  const payload = buildPurchasePayload(input, config.testEventCode)

  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${config.pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // El token va en el body, nunca en la URL: las URLs quedan en logs.
      body: JSON.stringify({ ...payload, access_token: config.accessToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    const body = (await res.json().catch(() => ({}))) as {
      events_received?: number
      fbtrace_id?: string
      error?: { message?: string; code?: number }
    }

    if (!res.ok) {
      const error = body.error?.message || `HTTP ${res.status}`
      console.error("[capital] Meta CAPI rechazó el Purchase", input.eventId, error)
      return { ok: false, skipped: false, error }
    }

    return { ok: true, eventsReceived: body.events_received ?? 0, fbtraceId: body.fbtrace_id }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[capital] Meta CAPI no respondió", input.eventId, message)
    return { ok: false, skipped: false, error: message }
  }
}
