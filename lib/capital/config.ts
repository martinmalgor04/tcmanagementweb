/**
 * Configuración del infoproducto. Sólo se importa desde el server.
 */

export const PRODUCT_SLUG = "capital-esencia-visual"

/** Ruta gated donde vive el HTML interactivo. Debe coincidir con products.access_path. */
export const ACCESS_PATH = "/capital-esencia-visual/manual"

/** Ruta que canjea el magic link. */
export const ACCESS_ENTRY_PATH = "/capital-esencia-visual/acceso"
export const ACCESS_INVALID_PATH = "/capital-esencia-visual/acceso-invalido"

/**
 * El link del mail es la llave de la compradora, no un pase de un solo uso: el
 * manual se vuelve a consultar y cada dispositivo nuevo gasta un canje. Con
 * pocos usos, abrirlo desde el mail del celular y después desde la compu ya
 * dejaba a la clienta afuera.
 *
 * Lo que protege el contenido no es la escasez del link sino que es personal y
 * se puede revocar. Si uno se filtra, se da de baja ese y listo.
 */
export const ACCESS_TOKEN_TTL_DAYS = 365
export const ACCESS_TOKEN_MAX_USES = 50

/** Una vez adentro, el navegador queda habilitado y no hace falta el link. */
export const ACCESS_COOKIE_NAME = "cev_access"
export const ACCESS_COOKIE_TTL_DAYS = 365

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

export const PRODUCTION_SITE_URL = "https://tcmanagement.com.ar"

function isLocalhost(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(url)
}

/** Link de pago estático. Sólo se usa si todavía no hay MP_ACCESS_TOKEN. */
export const MP_FALLBACK_CHECKOUT_URL = "https://mpago.la/2kr9Sh7"

/**
 * Origen https público, o null. Mercado Pago descarta back_urls/auto_return
 * en HTTP y no puede pegarle un webhook a localhost.
 */
export function publicHttpsOrigin(url: string = siteUrl()): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" || isLocalhost(url)) return null
    return url.replace(/\/+$/, "")
  } catch {
    return null
  }
}

/**
 * Base para los links que viajan por mail. Corriendo en Vercel se ignora
 * cualquier valor que apunte a localhost: el síntoma de ese error es un mail
 * que sólo abre en la máquina de quien lo mandó, y la compradora se queda sin
 * poder entrar.
 */
export function siteUrl(): string {
  const explicit = (process.env.CAPITAL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "")

  if (explicit) {
    if (!process.env.VERCEL || !isLocalhost(explicit)) return explicit
    console.warn(`[capital] CAPITAL_SITE_URL=${explicit} es inválida en Vercel, se ignora`)
  }

  if (process.env.VERCEL_ENV === "production") return PRODUCTION_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

const FROM_PLAIN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/
const FROM_NAMED = /^[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/

/**
 * Resend rechaza el envío entero si el remitente no tiene forma de mail, y el
 * síntoma es que la compradora paga y no recibe nada. Ante un valor mal cargado
 * preferimos mandar desde la dirección conocida antes que no mandar.
 */
function normalizeFrom(raw: string | undefined): string {
  const value = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim()
  if (FROM_PLAIN.test(value) || FROM_NAMED.test(value)) return value
  if (value) {
    console.warn(`[capital] CAPITAL_FROM_EMAIL=${JSON.stringify(value)} no es válido, se usa ${DEFAULT_FROM_EMAIL}`)
  }
  return DEFAULT_FROM_EMAIL
}

export function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return { apiKey, from: normalizeFrom(process.env.CAPITAL_FROM_EMAIL) }
}

/** Crea el checkout y confirma el pago. Sin esto se usa el link estático. */
export function mercadoPagoToken(): string | null {
  return process.env.MP_ACCESS_TOKEN || null
}

export function adminToken(): string | null {
  return process.env.CAPITAL_ADMIN_TOKEN || null
}

/** Mail del dueño del producto. Es el único que el panel deja pasar sin pagar. */
export function ownerEmail(): string {
  return process.env.CAPITAL_OWNER_EMAIL || "martinmmalgor@gmail.com"
}

/** Mail de la creadora del contenido. Sin esto no se le avisa de las ventas. */
export function creatorEmail(): string | null {
  return process.env.CAPITAL_CREATOR_EMAIL || null
}
