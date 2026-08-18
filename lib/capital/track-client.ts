"use client"

/**
 * Envío de eventos desde el navegador.
 *
 * Usa sendBeacon para que el evento salga aunque la persona esté navegando a
 * otra página, que es justo lo que pasa con el clic al checkout. Si algo falla
 * se ignora: una métrica perdida no vale interrumpir a nadie.
 */

type ClientEventKind = "landing_view" | "checkout_click"

const ENDPOINT = "/api/capital/track"

export function track(kind: ClientEventKind): void {
  if (typeof window === "undefined") return

  const body = JSON.stringify({
    kind,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
  })

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))
      return
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Sin métricas, pero la página sigue andando.
  }
}
