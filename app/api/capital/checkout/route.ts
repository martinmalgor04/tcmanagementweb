import { NextResponse } from "next/server"

import { getProduct } from "@/lib/capital/access"
import {
  MP_FALLBACK_CHECKOUT_URL,
  PRODUCT_SLUG,
  mercadoPagoToken,
  publicHttpsOrigin,
  siteUrl,
} from "@/lib/capital/config"
import { attributionFromRequest, createCheckoutPreference } from "@/lib/capital/mercadopago"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Arranca Checkout Pro: crea una preferencia y redirige a Mercado Pago.
 *
 * POST es el camino del CTA: el atrás del navegador vuelve a la landing
 * en vez de recrear otra preferencia. GET queda por si alguien tiene el
 * link viejo guardado.
 *
 * Sin MP_ACCESS_TOKEN se usa el link estático, para no cortar las ventas
 * de producción hasta que estén las credenciales live.
 */
async function startCheckout(request: Request) {
  const origin = new URL(request.url).origin
  const errorUrl = new URL("/capital-esencia-visual?checkout=error", origin)

  if (!mercadoPagoToken()) {
    return NextResponse.redirect(MP_FALLBACK_CHECKOUT_URL, 302)
  }

  try {
    const product = await getProduct(PRODUCT_SLUG)
    if (!product?.is_active) {
      return NextResponse.redirect(errorUrl, 302)
    }

    const landing = `${origin}/capital-esencia-visual`
    const gracias = `${landing}/gracias`
    const notifyBase = publicHttpsOrigin(siteUrl()) ?? publicHttpsOrigin(origin)

    const preference = await createCheckoutPreference({
      title: product.name,
      productId: product.slug,
      unitPrice: product.price_cents / 100,
      currency: product.currency,
      successUrl: gracias,
      pendingUrl: gracias,
      // "Volver" o pago rechazado: de vuelta a la landing, no al formulario.
      failureUrl: `${landing}?checkout=cancelado`,
      notificationUrl: notifyBase ? `${notifyBase}/api/capital/mercadopago/webhook` : null,
      // Cookies del Pixel + IP/UA: vuelven en el pago y alimentan CAPI.
      attribution: attributionFromRequest(request),
    })

    return NextResponse.redirect(preference.initPoint, 302)
  } catch (error) {
    console.error("[capital] checkout falló", error)
    return NextResponse.redirect(errorUrl, 302)
  }
}

export function GET(request: Request) {
  return startCheckout(request)
}

export function POST(request: Request) {
  return startCheckout(request)
}
