import type { Metadata } from "next"
import { redirect } from "next/navigation"

import CompradoraForm from "@/components/capital/compradora-form"
import "../capital.css"

export const metadata: Metadata = {
  title: "Completá tus datos — Capital de Esencia Visual | TC Management",
  description: "Confirmá tu compra y dejá tus datos para recibir el manual.",
  robots: { index: false, follow: false },
}

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-black.png`

const PAGO_OK = new Set(["approved", "success", "authorized"])
const PAGO_PENDIENTE = new Set(["pending", "in_process", "in_mediation"])

function estadoPago(params: Record<string, string | string[] | undefined>): "paid" | "pending" | null {
  const raw = params.collection_status ?? params.status
  const status = (Array.isArray(raw) ? raw[0] : raw || "").toLowerCase()
  if (PAGO_OK.has(status)) return "paid"
  if (PAGO_PENDIENTE.has(status)) return "pending"
  return null
}

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const estado = estadoPago(params)

  // Volver desde Mercado Pago sin acreditar (o entrar a /gracias a mano)
  // no es un pago: de vuelta a la landing, no al formulario.
  if (!estado) {
    redirect("/capital-esencia-visual")
  }

  const pendiente = estado === "pending"

  return (
    <div className="capital-landing cev-grain relative min-h-[100svh] px-6 py-12 font-[inherit]">
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
