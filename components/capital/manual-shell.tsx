"use client"

import { useState } from "react"

/**
 * Cáscara del manual interactivo.
 *
 * Cuando esté listo el HTML definitivo, reemplazar el contenido de cada módulo
 * por los componentes reales. La navegación y el gating no hace falta tocarlos.
 */

type Modulo = {
  id: string
  numero: string
  titulo: string
  bajada: string
}

const MODULOS: Modulo[] = [
  {
    id: "color",
    numero: "01",
    titulo: "Color",
    bajada: "Qué comunica cada color y cómo elegir tu paleta según el mensaje que querés dar.",
  },
  {
    id: "estampas",
    numero: "02",
    titulo: "Estampas",
    bajada: "El lenguaje de los símbolos: qué dice una raya, un animal print o un floral.",
  },
  {
    id: "prendas",
    numero: "03",
    titulo: "Prendas",
    bajada: "Siluetas, largos y volúmenes. Cómo la forma construye percepción.",
  },
  {
    id: "accesorios",
    numero: "04",
    titulo: "Accesorios",
    bajada: "El detalle que cierra el relato o lo contradice.",
  },
]

export default function ManualShell() {
  const [activo, setActivo] = useState(MODULOS[0].id)
  const modulo = MODULOS.find((m) => m.id === activo) ?? MODULOS[0]

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <nav aria-label="Módulos del manual" className="lg:sticky lg:top-12 lg:self-start">
        <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.4em] text-neutral-500">
          Módulos
        </p>
        <ul className="space-y-1">
          {MODULOS.map((m) => {
            const seleccionado = m.id === activo
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setActivo(m.id)}
                  aria-current={seleccionado ? "true" : undefined}
                  className={`flex w-full items-baseline gap-3 border-l-2 px-4 py-3 text-left text-sm uppercase tracking-[0.14em] transition ${
                    seleccionado
                      ? "border-[#c8b48a] bg-white/[0.04] text-[#f5f4f2]"
                      : "border-white/10 text-neutral-500 hover:border-white/30 hover:text-neutral-300"
                  }`}
                >
                  <span className="text-[10px] tracking-[0.3em] text-[#c8b48a]">{m.numero}</span>
                  {m.titulo}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <article className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-[#c8b48a]">
          Módulo {modulo.numero}
        </p>
        <h2 className="mt-4 text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
          {modulo.titulo}
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-neutral-400">{modulo.bajada}</p>

        <div className="mt-10 border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-500">En preparación</p>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-neutral-400">
            El contenido interactivo de este módulo se publica acá. Tu acceso ya está
            activo, así que cuando entres de nuevo lo vas a ver sin volver a pedir el link.
          </p>
        </div>
      </article>
    </div>
  )
}
