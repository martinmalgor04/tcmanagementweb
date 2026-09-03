/**
 * Validación de los datos que carga una compradora.
 *
 * Son cheques de forma, no de existencia: no confirmamos que el mail tenga
 * buzón, ni que el Instagram exista, ni que el WhatsApp tenga cuenta. Si el
 * dato no parece lo que dice ser, se rechaza. Si parece, se guarda.
 */

import { DEFAULT_PHONE_COUNTRY, parsePhone } from "./phone"

export type CompradoraInput = {
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  whatsapp_iso?: string
  ciudad: string
  instagram: string
}

export type FieldErrors = Partial<Record<"nombre" | "apellido" | "email" | "whatsapp" | "ciudad" | "instagram", string>>

export type CompradoraParsed = {
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  ciudad: string | null
  instagram: string | null
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function hasLetter(value: string): boolean {
  return /\p{L}/u.test(value)
}

export function looksLikeEmail(value: string): boolean {
  const email = value.trim()
  if (email.length < 6 || email.length > 120) return false
  if (email.includes("..")) return false
  return EMAIL_SHAPE.test(email)
}

export function parseInstagram(value: string): string | null {
  let handle = value.trim()
  if (!handle) return null

  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
  handle = handle.replace(/^@/, "").split(/[/?#]/)[0].trim()
  if (!handle) return null
  if (handle.length > 30) return null
  if (!/^[A-Za-z0-9._]+$/.test(handle)) return null
  return handle
}

export function parseCompradora(raw: unknown):
  | { ok: true; data: CompradoraParsed }
  | { ok: false; fields: FieldErrors; message: string } {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const fields: FieldErrors = {}

  const nombre = asString(body.nombre).trim()
  const apellido = asString(body.apellido).trim()
  const email = asString(body.email).trim()
  const whatsappRaw = asString(body.whatsapp)
  const isoHint = asString(body.whatsapp_iso).trim() || DEFAULT_PHONE_COUNTRY
  const ciudad = asString(body.ciudad).trim()
  const instagramRaw = asString(body.instagram)

  if (!nombre) fields.nombre = "Falta el nombre."
  else if (nombre.length > 80) fields.nombre = "El nombre es demasiado largo."
  else if (!hasLetter(nombre)) fields.nombre = "El nombre tiene que tener letras."

  if (!apellido) fields.apellido = "Falta el apellido."
  else if (apellido.length > 80) fields.apellido = "El apellido es demasiado largo."
  else if (!hasLetter(apellido)) fields.apellido = "El apellido tiene que tener letras."

  if (!email) fields.email = "Falta el mail."
  else if (!looksLikeEmail(email)) {
    fields.email = "Eso no tiene forma de mail. Ej. maria@gmail.com."
  }

  const phone = parsePhone(whatsappRaw, isoHint)
  if (!phone.ok) fields.whatsapp = phone.error

  if (ciudad.length > 80) fields.ciudad = "La ciudad es demasiado larga."

  let instagram: string | null = null
  if (instagramRaw.trim()) {
    instagram = parseInstagram(instagramRaw)
    if (!instagram) {
      fields.instagram = "Poné el usuario, sin URL rara. Ej. @tarsila."
    }
  }

  const keys = Object.keys(fields)
  if (keys.length > 0) {
    const message =
      keys.length === 1
        ? fields[keys[0] as keyof FieldErrors] || "Revisá ese dato."
        : "Revisá los datos marcados."
    return { ok: false, fields, message }
  }

  return {
    ok: true,
    data: {
      nombre,
      apellido,
      email: email.toLowerCase(),
      whatsapp: phone.ok ? `+${phone.e164}` : "",
      ciudad: ciudad || null,
      instagram,
    },
  }
}
