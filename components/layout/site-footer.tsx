"use client"

import Link from "next/link"
import Image from "next/image"
import { Instagram } from "lucide-react"
import { useTheme } from "next-themes"

export function SiteFooter() {
  // Get the current theme
  const { resolvedTheme } = useTheme()

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-white py-12 border-t border-neutral-800 transition-colors duration-300 ease-in-out">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {/* Columna 1: Logo + Texto + Redes */}
          <div className="flex flex-col items-center">
            <Link href="/" className="inline-block mb-4">
              {/* Always use white logo in footer since background is dark */}
              <Image
                src="/images/tc-logowhite.png"
                alt="TC Management"
                width={80}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            <p className="text-neutral-400 text-sm max-w-xs text-center transition-colors duration-300 ease-in-out">
              Representando talento excepcional en el modelaje desde 2023.
            </p>

            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/tc.managementd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-300 ease-in-out"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://wa.me/5493794781862"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-300 ease-in-out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
                </svg>
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-4 uppercase transition-colors duration-300 ease-in-out">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2 text-center">
              <li>
                <Link
                  href="/"
                  className="text-neutral-400 hover:text-white text-sm uppercase transition-colors duration-300 ease-in-out"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/women"
                  className="text-neutral-400 hover:text-white text-sm uppercase transition-colors duration-300 ease-in-out"
                >
                  Women
                </Link>
              </li>
              <li>
                <Link
                  href="/men"
                  className="text-neutral-400 hover:text-white text-sm uppercase transition-colors duration-300 ease-in-out"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-neutral-400 hover:text-white text-sm uppercase transition-colors duration-300 ease-in-out"
                >
                  Portfolio
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact - Updated without emojis */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mb-4 uppercase transition-colors duration-300 ease-in-out">Contacto</h3>
            <address className="not-italic text-neutral-400 text-sm text-center leading-relaxed space-y-3 transition-colors duration-300 ease-in-out">
              <p>Entre Ríos 569, Corrientes, Argentina</p>
              <p>tc.management@gmail.com</p>
              <p>+54 9 379 478 1862</p>
            </address>
          </div>
        </div>

        {/* Footer inferior */}
        <div className="border-t border-neutral-800 mt-12 pt-6 text-center text-neutral-400 text-sm transition-colors duration-300 ease-in-out">
          <p>&copy; {new Date().getFullYear()} TC Management. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
