import { NextResponse } from "next/server"

import { getProduct } from "@/lib/capital/access"
import {
  MP_FALLBACK_CHECKOUT_URL,
  PRODUCT_SLUG,
  mercadoPagoToken,
  publicHttpsOrigin,
  siteUrl,
} from "@/lib/capital/config"
import { createCheckoutPreference } from "@/lib/capital/mercadopago"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Arranca Checkout Pro: crea una preferencia y redirige a Mercado Pago.
 *
 * Sin MP_ACCESS_TOKEN se usa el link estático, para no cortar las ventas
 * de producción hasta que estén las credenciales live.
 */
export async function GET(request: Request) {
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

    const backUrl = `${origin}/capital-esencia-visual/gracias`
    const notifyBase = publicHttpsOrigin(siteUrl()) ?? publicHttpsOrigin(origin)

    const preference = await createCheckoutPreference({
      title: product.name,
      productId: product.slug,
      unitPrice: product.price_cents / 100,
      currency: product.currency,
      backUrl,
      notificationUrl: notifyBase ? `${notifyBase}/api/capital/mercadopago/webhook` : null,
    })

    return NextResponse.redirect(preference.initPoint, 302)
  } catch (error) {
    console.error("[capital] checkout falló", error)
    return NextResponse.redirect(errorUrl, 302)
  }
}
