import type { Metadata } from "next"
import { redirect } from "next/navigation"

import CompradoraForm from "@/components/capital/compradora-form"
import MetaPurchase from "@/components/capital/meta-purchase"
import { getProduct } from "@/lib/capital/access"
import { PRODUCT_SLUG, mercadoPagoToken } from "@/lib/capital/config"
import { checkPayment, paymentAmountCents, paymentMatchesProduct } from "@/lib/capital/mercadopago"
import "../capital.css"

export const metadata: Metadata = {
  title: "Completá tus datos — Capital de Esencia Visual | TC Management",
  description: "Confirmá tu compra y dejá tus datos para recibir el manual.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-black.png`

const PAGO_OK = new Set(["approved", "success", "authorized"])
const PAGO_PENDIENTE = new Set(["pending", "in_process", "in_mediation"])

type Params = Record<string, string | string[] | undefined>

function param(params: Params, ...keys: string[]): string {
  for (const key of keys) {
    const raw = params[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value) return value
  }
  return ""
}

function estadoPago(params: Params): "paid" | "pending" | null {
  const status = param(params, "collection_status", "status").toLowerCase()
  if (PAGO_OK.has(status)) return "paid"
  if (PAGO_PENDIENTE.has(status)) return "pending"
  return null
}

type Verificacion = {
  /** Meta sólo recibe el Purchase si la API de Mercado Pago confirmó el pago. */
  purchase: { paymentId: string; value: number; currency: string } | null
  /** Mercado Pago dice que el pago fue rechazado o cancelado. */
  rechazado: boolean
}

/**
 * Los parámetros de la URL los controla el navegador: no alcanzan para
 * reportar una venta a Meta. Con MP_ACCESS_TOKEN consultamos la API y sólo
 * ahí disparamos el Purchase, con el monto real y el payment_id como eventID.
 * Si la consulta falla, la página se muestra igual y CAPI cubre la venta.
 */
async function verificarPago(paymentId: string): Promise<Verificacion> {
  const nada: Verificacion = { purchase: null, rechazado: false }
  if (!paymentId || !mercadoPagoToken()) return nada

  try {
    const [check, product] = await Promise.all([checkPayment(paymentId), getProduct(PRODUCT_SLUG)])
    if (!check.verified || !check.payment) return nada
    if (check.status === "failed") return { purchase: null, rechazado: true }
    if (check.status !== "paid" || !product) return nada
    if (!paymentMatchesProduct(check.payment, product)) return nada

    return {
      purchase: {
        paymentId: String(check.payment.id),
        value: paymentAmountCents(check.payment, product.price_cents) / 100,
        currency: (check.payment.currency_id || product.currency).toUpperCase(),
      },
      rechazado: false,
    }
  } catch (error) {
    console.warn("[capital] /gracias no pudo verificar el pago", paymentId, error)
    return nada
  }
}

export default async function GraciasPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const estado = estadoPago(params)

  // Volver desde Mercado Pago sin acreditar (o entrar a /gracias a mano)
  // no es un pago: de vuelta a la landing, no al formulario.
  if (!estado) {
    redirect("/capital-esencia-visual")
  }

  const paymentId = param(params, "payment_id", "collection_id").replace(/\D/g, "")
  const verificacion = estado === "paid" ? await verificarPago(paymentId) : { purchase: null, rechazado: false }

  if (verificacion.rechazado) {
    redirect("/capital-esencia-visual?checkout=cancelado")
  }

  const pendiente = estado === "pending"

  return (
    <div className="capital-landing cev-grain relative min-h-[100svh] px-6 py-12 font-[inherit]">
      {verificacion.purchase && (
        <MetaPurchase
          paymentId={verificacion.purchase.paymentId}
          value={verificacion.purchase.value}
          currency={verificacion.purchase.currency}
        />
      )}
      <div className="relative z-10 mx-auto w-full max-w-lg">
        <img src={LOGO_WORDMARK} alt="TC Management" className="h-5 w-auto sm:h-7" />
        <p className="mt-12 text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">
          {pendiente ? "Pago pendiente" : "Pago recibido"}
        </p>
        <h1 className="mt-4 text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
          Completá tus datos
        </h1>
        <p className="mt-4 leading-relaxed text-neutral-600">
          {pendiente
            ? "Apenas se acredite te mandamos el manual. Nombre, mail y WhatsApp son obligatorios."
            : "Con esto te enviamos el manual y queda tu lugar en la base de TC. Nombre, mail y WhatsApp son obligatorios."}
        </p>
        <div className="mt-10">
          <CompradoraForm />
        </div>
      </div>
    </div>
  )
}
