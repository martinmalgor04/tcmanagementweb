import type { Metadata } from "next"
import ReenviarAccesoForm from "@/components/capital/reenviar-acceso-form"
import "../capital.css"

export const metadata: Metadata = {
  title: "Link vencido — Capital de Esencia Visual | TC Management",
  robots: { index: false, follow: false },
}

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-white.png`

export default function AccesoInvalidoPage() {
  return (
    <div className="capital-landing cev-grain relative min-h-[100svh] px-6 py-12 font-[inherit]">
      <div className="relative z-10 mx-auto w-full max-w-lg">
        <img src={LOGO_WORDMARK} alt="TC Management" className="h-5 w-auto sm:h-7" />
        <p className="mt-12 text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">
          Acceso
        </p>
        <h1 className="mt-4 text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
          Ese link ya no sirve
        </h1>
        <p className="mt-4 leading-relaxed text-neutral-400">
          Puede que lo hayas reemplazado por uno más nuevo. Poné el mail con el que
          compraste y te mandamos otro al instante.
        </p>
        <div className="mt-10">
          <ReenviarAccesoForm />
        </div>
      </div>
    </div>
  )
}
