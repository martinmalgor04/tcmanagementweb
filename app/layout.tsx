import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "TC Management – Agencia de Modelos",
  description: "Agencia de modelos en Corrientes, Argentina. Talento diverso para producciones, desfiles y campañas.",
  generator: "v0.dev",
  metadataBase: new URL("https://tcmanagement.com.ar"),
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "TC Management",
    description: "Agencia de modelos y talentos en Corrientes, Argentina.",
    url: "https://tcmanagement.com.ar",
    siteName: "TC Management",
    images: [
      {
        url: "/images/og-default.jpeg",
        width: 1200,
        height: 630,
        alt: "TC Management",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TC Management",
    description: "Agencia de modelos y talentos en Corrientes, Argentina.",
    images: ["/images/og-default.jpg"],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body
        className={`${montserrat.className} bg-background text-foreground transition-colors duration-300 ease-in-out`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'