import type { Metadata } from "next"
import ManualShell from "@/components/capital/manual-shell"
import "../capital.css"

export const metadata: Metadata = {
  title: "Capital de Esencia Visual — Manual",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-white.png`

export default function ManualPage() {
  return (
    <div className="capital-landing cev-grain relative min-h-[100svh] px-6 py-12 font-[inherit]">
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-6">
          <img src={LOGO_WORDMARK} alt="TC Management" className="h-5 w-auto sm:h-7" />
          <a
            href="/capital-esencia-visual/salir"
            className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-300"
          >
            Salir
          </a>
        </header>

        <p className="mt-16 text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">
          Manual digital
        </p>
        <h1 className="mt-4 text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
          Capital de
          <br />
          Esencia Visual
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-neutral-400">
          El poder de los símbolos y los colores en la estrategia de la vestimenta.
        </p>

        <div className="mt-16">
          <ManualShell />
        </div>
      </div>
    </div>
  )
}
