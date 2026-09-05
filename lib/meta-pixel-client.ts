"use client"

/**
 * Meta Pixel desde el navegador.
 *
 * `fbq` lo define components/meta-pixel.tsx al cargar fbevents.js. Si el Pixel
 * no está configurado (sin NEXT_PUBLIC_META_PIXEL_ID) o todavía no cargó, la
 * llamada se ignora: una métrica de ads perdida no vale romper la página.
 */

type Fbq = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: Fbq
  }
}

export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").replace(/\D/g, "")

export type MetaStandardEvent = "PageView" | "InitiateCheckout" | "Purchase"

export function fbqTrack(
  event: MetaStandardEvent,
  params?: Record<string, unknown>,
  options?: { eventID: string },
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  try {
    if (options) window.fbq("track", event, params ?? {}, options)
    else if (params) window.fbq("track", event, params)
    else window.fbq("track", event)
  } catch {
    // Sin ads-tracking, pero la página sigue andando.
  }
}
