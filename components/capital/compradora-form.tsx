"use client"

import { useMemo, useState, type FormEvent } from "react"

import { PhoneInput } from "@/components/phone-input"
import { parseCompradora, type FieldErrors } from "@/lib/customer-fields"

type Status = "idle" | "sending" | "ok" | "error"

type Result = {
  access: boolean
  accessUrl: string | null
  emailStatus: "sent" | "queued" | "failed" | "skipped"
}

const fieldClass =
  "w-full rounded-sm border border-black/15 bg-white px-4 py-3 text-sm text-[#070707] outline-none transition placeholder:text-neutral-400 focus:border-[#c8b48a]/80"

const fieldErrorClass =
  "w-full rounded-sm border border-red-400 bg-white px-4 py-3 text-sm text-[#070707] outline-none transition placeholder:text-neutral-400 focus:border-red-500"

const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-500"

function FieldMessage({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={id} className="mt-1 text-sm text-red-500">
      {error}
    </p>
  )
}

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
  const [fields, setFields] = useState<FieldErrors>({})
  const [result, setResult] = useState<Result | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setFields({})
    setStatus("sending")
    const fd = new FormData(e.currentTarget)
    const payload = {
      nombre: String(fd.get("nombre") || ""),
      apellido: String(fd.get("apellido") || ""),
      email: String(fd.get("email") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      whatsapp_iso: String(fd.get("whatsapp_iso") || ""),
      ciudad: String(fd.get("ciudad") || ""),
      instagram: String(fd.get("instagram") || ""),
      mp_status: mp.status,
      mp_payment_id: mp.paymentId,
      empresa: String(fd.get("empresa") || ""),
    }

    const local = parseCompradora(payload)
    if (!local.ok) {
      setFields(local.fields)
      setError(local.message)
      setStatus("error")
      return
    }

    try {
      const res = await fetch("/api/capital/compradoras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFields(body.fields ?? {})
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
      <div className="border border-black/10 bg-white px-8 py-12 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-[#c8b48a]">Listo</p>
        <h2 className="mt-4 text-2xl font-bold uppercase tracking-tight">
          {result?.access ? "Acceso habilitado" : "Datos guardados"}
        </h2>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-neutral-600">
          {result?.access
            ? "Te mandamos el link de acceso al mail que cargaste. Si no aparece, mirá spam."
            : "Estamos confirmando tu pago. Apenas se acredite te llega el acceso al mail que cargaste."}
        </p>
        {result?.accessUrl && (
          <a
            href={result.accessUrl}
            className="cev-cta cev-shine relative mt-8 inline-flex items-center justify-center rounded-full bg-[#070707] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#f5f4f2]"
          >
            Entrar ahora
          </a>
        )}
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      onInput={() => {
        if (error) setError("")
        if (Object.keys(fields).length) setFields({})
      }}
      className="relative space-y-5"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="nombre">
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            autoComplete="given-name"
            aria-invalid={Boolean(fields.nombre)}
            aria-describedby={fields.nombre ? "nombre-error" : undefined}
            className={fields.nombre ? fieldErrorClass : fieldClass}
          />
          <FieldMessage id="nombre-error" error={fields.nombre} />
        </div>
        <div>
          <label className={labelClass} htmlFor="apellido">
            Apellido *
          </label>
          <input
            id="apellido"
            name="apellido"
            required
            autoComplete="family-name"
            aria-invalid={Boolean(fields.apellido)}
            aria-describedby={fields.apellido ? "apellido-error" : undefined}
            className={fields.apellido ? fieldErrorClass : fieldClass}
          />
          <FieldMessage id="apellido-error" error={fields.apellido} />
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
          inputMode="email"
          required
          autoComplete="email"
          spellCheck={false}
          aria-invalid={Boolean(fields.email)}
          aria-describedby={fields.email ? "email-error" : undefined}
          className={fields.email ? fieldErrorClass : fieldClass}
        />
        <FieldMessage id="email-error" error={fields.email} />
      </div>
      <div>
        <label className={labelClass} htmlFor="whatsapp">
          WhatsApp *
        </label>
        <PhoneInput
          id="whatsapp"
          name="whatsapp"
          isoName="whatsapp_iso"
          required
          variant="capital"
          error={fields.whatsapp}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ciudad">
            Ciudad
          </label>
          <input
            id="ciudad"
            name="ciudad"
            autoComplete="address-level2"
            aria-invalid={Boolean(fields.ciudad)}
            className={fields.ciudad ? fieldErrorClass : fieldClass}
          />
          <FieldMessage id="ciudad-error" error={fields.ciudad} />
        </div>
        <div>
          <label className={labelClass} htmlFor="instagram">
            Instagram
          </label>
          <input
            id="instagram"
            name="instagram"
            placeholder="@usuario"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(fields.instagram)}
            className={fields.instagram ? fieldErrorClass : fieldClass}
          />
          <FieldMessage id="instagram-error" error={fields.instagram} />
        </div>
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" tabIndex={-1} autoComplete="off" />
      </div>
      {error && !Object.keys(fields).length && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="cev-cta cev-shine relative mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#070707] px-10 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#f5f4f2] disabled:opacity-60"
      >
        {status === "sending" ? "Guardando…" : "Enviar mis datos"}
      </button>
    </form>
  )
}
