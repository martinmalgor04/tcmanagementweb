"use client"

import { useState, type FormEvent } from "react"

type Status = "idle" | "sending" | "ok"

const fieldClass =
  "w-full rounded-sm border border-black/15 bg-white px-4 py-3 text-sm text-[#070707] outline-none transition placeholder:text-neutral-400 focus:border-[#c8b48a]/80"

const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500"

export default function ReenviarAccesoForm() {
  const [status, setStatus] = useState<Status>("idle")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("sending")
    const fd = new FormData(e.currentTarget)

    try {
      await fetch("/api/capital/reenviar-acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(fd.get("email") || ""),
          empresa: String(fd.get("empresa") || ""),
        }),
      })
    } catch {
      // El mensaje final es el mismo pase lo que pase.
    }

    setStatus("ok")
  }

  if (status === "ok") {
    return (
      <p className="border border-black/10 bg-white px-6 py-8 leading-relaxed text-neutral-600">
        Si ese mail tiene una compra registrada, en un minuto te llega un link nuevo. Mirá spam.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <div>
        <label className={labelClass} htmlFor="email">
          Tu email de compra
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
        />
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="cev-cta cev-shine relative inline-flex w-full items-center justify-center rounded-full bg-[#070707] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#f5f4f2] disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Mandame un link nuevo"}
      </button>
    </form>
  )
}
