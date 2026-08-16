import type { Metadata } from "next"
import CapitalLanding from "@/components/capital/capital-landing"
import "./capital.css"

export const metadata: Metadata = {
  title: "Capital de Esencia Visual — Manual digital | TC Management",
  description:
    "El poder de los símbolos y los colores en la estrategia de la vestimenta. Manual digital de Tarsila Cicconetti: aprendé a traducir tu esencia en imagen.",
  openGraph: {
    title: "Capital de Esencia Visual — Manual digital | TC Management",
    description:
      "Tu ropa habla antes que vos. Aprendé el lenguaje del color, las estampas, las prendas y los accesorios.",
    url: "https://tcmanagement.com.ar/capital-esencia-visual",
    siteName: "TC Management",
    locale: "es_AR",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function CapitalEsenciaVisualPage() {
  return <CapitalLanding />
}
