"use client"

import { useMemo, useState, type FormEvent } from "react"

type Status = "idle" | "sending" | "ok" | "error"

type Result = {
  access: boolean
  accessUrl: string | null
  emailStatus: "sent" | "queued" | "failed" | "skipped"
}

const fieldClass =
  "w-full rounded-sm border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-[#f5f4f2] outline-none transition placeholder:text-neutral-600 focus:border-[#c8b48a]/50"

const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-400"

export default function CompradoraForm() {
  const mp = useMemo(() => {
    if (typeof window === "undefined") return { status: "", paymentId: "" }
    const q = new URLSearchParams(window.location.search)
    return {
      status: q.get("collection_status") || q.get("status") || "",
      paymentId: q.get("payment_id") || q.get("collection_id") || "",
    }
  }, [])

  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<Result | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setStatus("sending")
    const fd = new FormData(e.currentTarget)
    const payload = {
      nombre: String(fd.get("nombre") || ""),
      apellido: String(fd.get("apellido") || ""),
      email: String(fd.get("email") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      ciudad: String(fd.get("ciudad") || ""),
      instagram: String(fd.get("instagram") || ""),
      empresa: String(fd.get("empresa") || ""),
      mp_status: mp.status,
      mp_payment_id: mp.paymentId,
    }

    try {
      const res = await fetch("/api/capital/compradoras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || "No se pudo guardar.")
        setStatus("error")
        return
      }
      setResult({
        access: Boolean(body.access),
        accessUrl: body.accessUrl ?? null,
        emailStatus: body.emailStatus ?? "skipped",
      })
      setStatus("ok")
    } catch {
      setError("Sin conexión. Probá de nuevo.")
      setStatus("error")
    }
  }

  if (status === "ok") {
    return (
      <div className="border border-white/15 bg-white/[0.03] px-8 py-12 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-[#c8b48a]">Listo</p>
        <h2 className="mt-4 text-2xl font-bold uppercase tracking-tight">
          {result?.access ? "Acceso habilitado" : "Datos guardados"}
        </h2>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-neutral-400">
          {result?.access
            ? "Te mandamos el link de acceso al mail que cargaste. Si no aparece, mirá spam."
            : "Estamos confirmando tu pago. Apenas se acredite te llega el acceso al mail que cargaste."}
        </p>
        {result?.accessUrl && (
          <a
            href={result.accessUrl}
            className="cev-cta cev-shine relative mt-8 inline-flex items-center justify-center rounded-full bg-[#f5f4f2] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#070707]"
          >
            Entrar ahora
          </a>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="nombre">
            Nombre *
          </label>
          <input id="nombre" name="nombre" required autoComplete="given-name" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="apellido">
            Apellido *
          </label>
          <input id="apellido" name="apellido" required autoComplete="family-name" className={fieldClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          Email *
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
      <div>
        <label className={labelClass} htmlFor="whatsapp">
          WhatsApp *
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+54 9 …"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ciudad">
            Ciudad
          </label>
          <input id="ciudad" name="ciudad" autoComplete="address-level2" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="instagram">
            Instagram
          </label>
          <input id="instagram" name="instagram" placeholder="@usuario" className={fieldClass} />
        </div>
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="cev-cta cev-shine relative mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#f5f4f2] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#070707] disabled:opacity-60"
      >
        {status === "sending" ? "Guardando…" : "Enviar mis datos"}
      </button>
    </form>
  )
}
