"use client"

import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  countryByIso,
  formatPhonePreview,
  normalizePhone,
  splitPastedNumber,
} from "@/lib/phone"

const capitalField =
  "rounded-sm border border-black/15 bg-white px-3 py-3 text-sm text-[#070707] outline-none transition placeholder:text-neutral-400 focus:border-[#c8b48a]/80"

const siteField =
  "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

type PhoneInputProps = {
  id?: string
  name?: string
  isoName?: string
  required?: boolean
  defaultCountry?: string
  onChange?: (e164: string, iso: string) => void
  error?: string
  variant?: "capital" | "site"
  placeholder?: string
  hint?: string
  purpose?: "whatsapp" | "phone"
}

export function PhoneInput({
  id = "phone",
  name = "whatsapp",
  isoName = "whatsapp_iso",
  required,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  onChange,
  error,
  variant = "capital",
  placeholder,
  hint,
  purpose = "whatsapp",
}: PhoneInputProps) {
  const [iso, setIso] = useState(defaultCountry)
  const [national, setNational] = useState("")

  const field = variant === "capital" ? capitalField : siteField
  const country = countryByIso(iso)
  const preview = useMemo(() => formatPhonePreview(iso, national), [iso, national])
  const parsed = normalizePhone(iso, national)
  const e164 = parsed.ok ? `+${parsed.e164}` : ""

  function emit(nextIso: string, nextNational: string) {
    const result = normalizePhone(nextIso, nextNational)
    onChange?.(result.ok ? `+${result.e164}` : "", result.ok ? result.iso : nextIso)
  }

  function handleNationalChange(raw: string) {
    const split = splitPastedNumber(raw, iso)
    setIso(split.iso)
    const nextNational =
      raw.startsWith("+") || raw.startsWith("00") || split.iso !== iso ? split.national : raw.replace(/[^\d\s()-]/g, "")
    setNational(nextNational)
    emit(split.iso, nextNational)
  }

  const describedBy = error ? `${id}-error` : `${id}-hint`
  const defaultHint = parsed.ok
    ? `Se guarda ${preview} para ${purpose === "phone" ? "el teléfono" : "WhatsApp"}.`
    : `País ${country.name} (+${country.dial}). Escribí el número local, sin el código.`

  return (
    <div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`${id}-iso`}>
          Código de país
        </label>
        <select
          id={`${id}-iso`}
          name={isoName}
          value={iso}
          required={required}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            const next = e.target.value
            setIso(next)
            emit(next, national)
          }}
          className={cn(
            field,
            "w-[7.75rem] shrink-0 cursor-pointer pr-7",
            error && (variant === "capital" ? "border-red-400" : "border-red-500"),
          )}
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} +{c.dial} {c.iso}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          placeholder={placeholder ?? (iso === "AR" ? "11 2345 6789" : "Número")}
          value={national}
          onChange={(e) => handleNationalChange(e.target.value)}
          className={cn(
            field,
            "min-w-0 flex-1",
            error && (variant === "capital" ? "border-red-400" : "border-red-500"),
          )}
        />
        <input type="hidden" name={name} value={e164} />
      </div>
      <p id={`${id}-hint`} className={cn("mt-2 text-xs", variant === "capital" ? "text-neutral-500" : "text-muted-foreground")}>
        {hint ?? defaultHint}
      </p>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
