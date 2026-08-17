import type { Metadata } from "next"

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
const CONTENT_PATH = "/capital-esencia-visual/manual/contenido"

/**
 * El manual es un documento completo, con su propio head, estilos y scripts.
 * Va en un iframe y no inyectado en la página para que su CSS no choque con el
 * del sitio y para que se vea exactamente como fue diseñado. El iframe apunta a
 * una ruta propia, que vuelve a validar el acceso por su cuenta.
 */
export default function ManualPage() {
  return (
    <div className="flex h-[100svh] flex-col bg-black">
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-white/10 px-5 py-3">
        <img src={LOGO_WORDMARK} alt="TC Management" className="h-4 w-auto" />
        <a
          href="/capital-esencia-visual/salir"
          className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-300"
        >
          Salir
        </a>
      </header>

      <iframe
        src={CONTENT_PATH}
        title="Capital de Esencia Visual — Manual digital"
        className="min-h-0 w-full flex-1 border-0"
      />
    </div>
  )
}
