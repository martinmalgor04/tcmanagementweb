"use client"

import { useRef, useState } from "react"

/**
 * El POST lo resuelve la route del panel. Acá sólo se traba el envío para que
 * un doble clic no arme dos órdenes y dos mails.
 */
export function CortesiaForm() {
  const [pending, setPending] = useState(false)
  const locked = useRef(false)

  return (
    <form
      action="/capital-esencia-visual/admin/cortesia"
      method="post"
      onSubmit={(event) => {
        if (locked.current) {
          event.preventDefault()
          return
        }
        locked.current = true
        setPending(true)
      }}
      className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <input
        name="email"
        type="email"
        required
        placeholder="mail@ejemplo.com"
        className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-white/40 sm:col-span-2"
      />
      <input
        name="nombre"
        type="text"
        placeholder="Nombre (opcional)"
        className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-white/40"
      />
      <input
        name="apellido"
        type="text"
        placeholder="Apellido (opcional)"
        className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-white/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="whitespace-nowrap rounded-full bg-[#c8b48a] px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#070707] transition hover:bg-[#d8c69a] disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Dando acceso…" : "Dar acceso"}
      </button>
    </form>
  )
}
