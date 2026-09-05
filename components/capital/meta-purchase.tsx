"use client"

import { useEffect } from "react"

import { META_PRODUCT } from "@/lib/capital/product-public"
import { fbqTrack } from "@/lib/meta-pixel-client"

/**
 * Purchase del Pixel en /gracias. Sólo se renderiza cuando el pago quedó
 * verificado contra la API de Mercado Pago (lo decide el server).
 *
 * `eventID` es el payment_id: el mismo que manda el webhook por Conversions
 * API, así Meta cuenta la venta una sola vez. El guard en sessionStorage evita
 * repetirlo si la compradora recarga la página.
 */
export default function MetaPurchase({
  paymentId,
  value,
  currency,
}: {
  paymentId: string
  value: number
  currency: string
}) {
  useEffect(() => {
    if (!paymentId) return
    const key = `cev_meta_purchase_${paymentId}`
    try {
      if (window.sessionStorage.getItem(key)) return
    } catch {
      // Sin sessionStorage (modo privado estricto): se manda igual, Meta deduplica por eventID.
    }

    // fbevents.js puede llegar después del primer render: reintenta un ratito.
    let attempts = 0
    const fire = () => {
      if (typeof window.fbq !== "function") {
        if (attempts++ < 20) setTimeout(fire, 250)
        return
      }
      fbqTrack(
        "Purchase",
        { value, currency, content_name: META_PRODUCT.contentName },
        { eventID: paymentId },
      )
      try {
        window.sessionStorage.setItem(key, "1")
      } catch {
        // ignorar
      }
    }
    fire()
  }, [paymentId, value, currency])

  return null
}
