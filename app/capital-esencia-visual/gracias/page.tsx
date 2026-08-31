import type { Metadata } from "next"
import CompradoraForm from "@/components/capital/compradora-form"
import "../capital.css"

export const metadata: Metadata = {
  title: "Completá tus datos — Capital de Esencia Visual | TC Management",
  description: "Confirmá tu compra y dejá tus datos para recibir el manual.",
  robots: { index: false, follow: false },
}

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-black.png`

export default function GraciasPage() {
  return (
    <div className="capital-landing cev-grain relative min-h-[100svh] px-6 py-12 font-[inherit]">
      <div className="relative z-10 mx-auto w-full max-w-lg">
        <img src={LOGO_WORDMARK} alt="TC Management" className="h-5 w-auto sm:h-7" />
        <p className="mt-12 text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">
          Pago recibido
        </p>
        <h1 className="mt-4 text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
          Completá tus datos
        </h1>
        <p className="mt-4 leading-relaxed text-neutral-600">
          Con esto te enviamos el manual y queda tu lugar en la base de TC.
          Nombre, mail y WhatsApp son obligatorios.
        </p>
        <div className="mt-10">
          <CompradoraForm />
        </div>
      </div>
    </div>
  )
}
