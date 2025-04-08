import type { Metadata } from "next"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import PortfolioClientPage from "./PortfolioClientPage"

export const metadata: Metadata = {
  title: "Portfolio | TC Management – Agencia de Modelos",
  description:
    "Explora nuestro portfolio de campañas y proyectos en TC Management. Trabajos destacados de nuestros modelos.",
  openGraph: {
    title: "Portfolio | TC Management",
    description:
      "Explora nuestro portfolio de campañas y proyectos en TC Management. Trabajos destacados de nuestros modelos.",
    images: [{ url: "/images/og-portfolio.jpg" }],
  },
}

export default function PortfolioPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PortfolioClientPage />
      <SiteFooter />
    </div>
  )
}
