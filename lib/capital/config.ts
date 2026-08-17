/**
 * Configuración del infoproducto. Sólo se importa desde el server.
 */

export const PRODUCT_SLUG = "capital-esencia-visual"

/** Ruta gated donde vive el HTML interactivo. Debe coincidir con products.access_path. */
export const ACCESS_PATH = "/capital-esencia-visual/manual"

/** Ruta que canjea el magic link. */
export const ACCESS_ENTRY_PATH = "/capital-esencia-visual/acceso"
export const ACCESS_INVALID_PATH = "/capital-esencia-visual/acceso-invalido"

/** El link del mail vive 7 días y admite 3 canjes. */
export const ACCESS_TOKEN_TTL_DAYS = 7
export const ACCESS_TOKEN_MAX_USES = 3

/** Una vez adentro, la sesión del navegador dura 30 días. */
export const ACCESS_COOKIE_NAME = "cev_access"
export const ACCESS_COOKIE_TTL_DAYS = 30

export const DEFAULT_FROM_EMAIL = "TC Management <hola@tcmanagement.com.ar>"
export const SUPPORT_WHATSAPP = "https://wa.me/5493624000000"

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`)
  }
  return value
}

export function supabaseConfig() {
  return {
    url: required("SUPABASE_URL").replace(/\/+$/, ""),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  }
}

export function sessionSecret(): string {
  return required("CAPITAL_SESSION_SECRET")
}

export function siteUrl(): string {
  const explicit = process.env.CAPITAL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, "")
  if (process.env.VERCEL_ENV === "production") return "https://tcmanagement.com.ar"
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return { apiKey, from: process.env.CAPITAL_FROM_EMAIL || DEFAULT_FROM_EMAIL }
}

/** Sin este token no se puede confirmar un pago contra Mercado Pago. */
export function mercadoPagoToken(): string | null {
  return process.env.MP_ACCESS_TOKEN || null
}

export function adminToken(): string | null {
  return process.env.CAPITAL_ADMIN_TOKEN || null
}
