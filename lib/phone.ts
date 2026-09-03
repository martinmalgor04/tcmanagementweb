/**
 * Teléfono / WhatsApp: código de país + número.
 *
 * Esto NO verifica que el número exista ni que tenga WhatsApp. Sólo arma un
 * E.164 plausible (dígitos, largo, país) para que el link de wa.me funcione.
 */

export type PhoneCountry = {
  iso: string
  name: string
  dial: string
  flag: string
  nationalMin: number
  nationalMax: number
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "AR", name: "Argentina", dial: "54", flag: "🇦🇷", nationalMin: 10, nationalMax: 11 },
  { iso: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾", nationalMin: 8, nationalMax: 8 },
  { iso: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾", nationalMin: 8, nationalMax: 9 },
  { iso: "BR", name: "Brasil", dial: "55", flag: "🇧🇷", nationalMin: 10, nationalMax: 11 },
  { iso: "CL", name: "Chile", dial: "56", flag: "🇨🇱", nationalMin: 9, nationalMax: 9 },
  { iso: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴", nationalMin: 8, nationalMax: 8 },
  { iso: "PE", name: "Perú", dial: "51", flag: "🇵🇪", nationalMin: 9, nationalMax: 9 },
  { iso: "CO", name: "Colombia", dial: "57", flag: "🇨🇴", nationalMin: 10, nationalMax: 10 },
  { iso: "EC", name: "Ecuador", dial: "593", flag: "🇪🇨", nationalMin: 9, nationalMax: 9 },
  { iso: "VE", name: "Venezuela", dial: "58", flag: "🇻🇪", nationalMin: 10, nationalMax: 10 },
  { iso: "MX", name: "México", dial: "52", flag: "🇲🇽", nationalMin: 10, nationalMax: 10 },
  { iso: "PA", name: "Panamá", dial: "507", flag: "🇵🇦", nationalMin: 7, nationalMax: 8 },
  { iso: "CR", name: "Costa Rica", dial: "506", flag: "🇨🇷", nationalMin: 8, nationalMax: 8 },
  { iso: "DO", name: "Rep. Dominicana", dial: "1", flag: "🇩🇴", nationalMin: 10, nationalMax: 10 },
  { iso: "GT", name: "Guatemala", dial: "502", flag: "🇬🇹", nationalMin: 8, nationalMax: 8 },
  { iso: "HN", name: "Honduras", dial: "504", flag: "🇭🇳", nationalMin: 8, nationalMax: 8 },
  { iso: "NI", name: "Nicaragua", dial: "505", flag: "🇳🇮", nationalMin: 8, nationalMax: 8 },
  { iso: "SV", name: "El Salvador", dial: "503", flag: "🇸🇻", nationalMin: 8, nationalMax: 8 },
  { iso: "ES", name: "España", dial: "34", flag: "🇪🇸", nationalMin: 9, nationalMax: 9 },
  { iso: "IT", name: "Italia", dial: "39", flag: "🇮🇹", nationalMin: 8, nationalMax: 11 },
  { iso: "FR", name: "Francia", dial: "33", flag: "🇫🇷", nationalMin: 9, nationalMax: 9 },
  { iso: "DE", name: "Alemania", dial: "49", flag: "🇩🇪", nationalMin: 10, nationalMax: 11 },
  { iso: "PT", name: "Portugal", dial: "351", flag: "🇵🇹", nationalMin: 9, nationalMax: 9 },
  { iso: "GB", name: "Reino Unido", dial: "44", flag: "🇬🇧", nationalMin: 10, nationalMax: 10 },
  { iso: "US", name: "Estados Unidos", dial: "1", flag: "🇺🇸", nationalMin: 10, nationalMax: 10 },
  { iso: "CA", name: "Canadá", dial: "1", flag: "🇨🇦", nationalMin: 10, nationalMax: 10 },
  { iso: "AU", name: "Australia", dial: "61", flag: "🇦🇺", nationalMin: 9, nationalMax: 9 },
  { iso: "CH", name: "Suiza", dial: "41", flag: "🇨🇭", nationalMin: 9, nationalMax: 9 },
  { iso: "NL", name: "Países Bajos", dial: "31", flag: "🇳🇱", nationalMin: 9, nationalMax: 9 },
  { iso: "BE", name: "Bélgica", dial: "32", flag: "🇧🇪", nationalMin: 8, nationalMax: 9 },
  { iso: "IE", name: "Irlanda", dial: "353", flag: "🇮🇪", nationalMin: 8, nationalMax: 9 },
  { iso: "PL", name: "Polonia", dial: "48", flag: "🇵🇱", nationalMin: 9, nationalMax: 9 },
  { iso: "RO", name: "Rumania", dial: "40", flag: "🇷🇴", nationalMin: 9, nationalMax: 9 },
  { iso: "TR", name: "Turquía", dial: "90", flag: "🇹🇷", nationalMin: 10, nationalMax: 10 },
  { iso: "JP", name: "Japón", dial: "81", flag: "🇯🇵", nationalMin: 10, nationalMax: 10 },
  { iso: "KR", name: "Corea del Sur", dial: "82", flag: "🇰🇷", nationalMin: 9, nationalMax: 10 },
  { iso: "CN", name: "China", dial: "86", flag: "🇨🇳", nationalMin: 11, nationalMax: 11 },
  { iso: "IN", name: "India", dial: "91", flag: "🇮🇳", nationalMin: 10, nationalMax: 10 },
  { iso: "AE", name: "Emiratos", dial: "971", flag: "🇦🇪", nationalMin: 9, nationalMax: 9 },
  { iso: "IL", name: "Israel", dial: "972", flag: "🇮🇱", nationalMin: 8, nationalMax: 9 },
]

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]))

const DIAL_CANDIDATES = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)

export const DEFAULT_PHONE_COUNTRY = "AR"

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

export function countryByIso(iso: string): PhoneCountry {
  return BY_ISO.get(iso) ?? PHONE_COUNTRIES[0]
}

export type PhoneResult =
  | { ok: true; e164: string; iso: string; national: string }
  | { ok: false; error: string }

function arNational(national: string): PhoneResult | { national: string } {
  let n = national
  if (n.startsWith("0")) n = n.slice(1)

  if (n.startsWith("15")) {
    return {
      ok: false,
      error: "Sin el 15. Poné código de área y número (ej. 379 479 8659).",
    }
  }

  // Ya viene con el 9 de móvil internacional.
  if (n.length === 11 && n.startsWith("9")) return { national: n }

  if (n.length === 10) return { national: `9${n}` }

  if (n.length < 10) {
    return {
      ok: false,
      error: "Falta el código de área. Ej. 11 2345 6789 o 379 479 8659.",
    }
  }

  return {
    ok: false,
    error: "Ese número no cierra para Argentina. Revisá el código de área.",
  }
}

function restLooksNational(country: PhoneCountry, rest: string): boolean {
  if (country.iso === "AR") return rest.length === 10 || rest.length === 11
  return rest.length >= country.nationalMin && rest.length <= country.nationalMax
}

export function detectCountryFromDigits(digits: string): PhoneCountry | null {
  for (const country of DIAL_CANDIDATES) {
    if (!digits.startsWith(country.dial)) continue
    const rest = digits.slice(country.dial.length)
    if (restLooksNational(country, rest)) return country
  }
  return null
}

/**
 * Si pegan un número internacional en el campo nacional, separamos país y resto.
 */
export function splitPastedNumber(
  raw: string,
  selectedIso: string,
): { iso: string; national: string } {
  const trimmed = raw.trim()
  const digits = digitsOnly(trimmed)
  const selected = countryByIso(selectedIso)

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const detected = detectCountryFromDigits(digits.startsWith("00") ? digits.slice(2) : digits)
    if (detected) {
      return { iso: detected.iso, national: digits.slice(detected.dial.length) }
    }
  }

  if (digits.startsWith(selected.dial) && restLooksNational(selected, digits.slice(selected.dial.length))) {
    return { iso: selected.iso, national: digits.slice(selected.dial.length) }
  }

  const detected = detectCountryFromDigits(digits)
  if (detected && digits.length >= detected.dial.length + detected.nationalMin) {
    return { iso: detected.iso, national: digits.slice(detected.dial.length) }
  }

  return { iso: selectedIso, national: digits }
}

export function normalizePhone(iso: string, nationalRaw: string): PhoneResult {
  const country = countryByIso(iso)
  const split = splitPastedNumber(nationalRaw, country.iso)
  const resolved = countryByIso(split.iso)
  let national = digitsOnly(split.national)

  if (!national) {
    return { ok: false, error: "Falta el número." }
  }

  if (resolved.iso === "AR") {
    const ar = arNational(national)
    if ("ok" in ar) return ar
    national = ar.national
  } else if (national.length < resolved.nationalMin || national.length > resolved.nationalMax) {
    return {
      ok: false,
      error: `Para ${resolved.name} el número lleva ${
        resolved.nationalMin === resolved.nationalMax
          ? `${resolved.nationalMin} dígitos`
          : `${resolved.nationalMin} a ${resolved.nationalMax} dígitos`
      }, sin el ${resolved.dial}.`,
    }
  }

  return {
    ok: true,
    iso: resolved.iso,
    national,
    e164: `${resolved.dial}${national}`,
  }
}

/**
 * Acepta lo que manda el formulario (E.164) o un pegado libre.
 * `isoHint` es el país elegido en el selector.
 */
export function parsePhone(raw: string, isoHint = DEFAULT_PHONE_COUNTRY): PhoneResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: "Falta el número." }

  if (/[A-Za-z]/.test(trimmed) && digitsOnly(trimmed).length < 8) {
    return { ok: false, error: "Eso no es un teléfono. Elegí el país y escribí sólo el número." }
  }

  const digits = digitsOnly(trimmed)
  if (digits.length < 8) {
    return { ok: false, error: "Ese número es demasiado corto." }
  }

  if (trimmed.startsWith("+") || trimmed.startsWith("00") || detectCountryFromDigits(digits)) {
    const iso =
      splitPastedNumber(trimmed, isoHint).iso ||
      detectCountryFromDigits(digits)?.iso ||
      isoHint
    const national = splitPastedNumber(trimmed, iso).national
    return normalizePhone(iso, national)
  }

  return normalizePhone(isoHint, trimmed)
}

export function formatPhonePreview(iso: string, nationalRaw: string): string {
  const result = normalizePhone(iso, nationalRaw)
  if (!result.ok) {
    const digits = digitsOnly(nationalRaw)
    const dial = countryByIso(iso).dial
    return digits ? `+${dial} ${digits}` : `+${dial}`
  }
  const dial = countryByIso(result.iso).dial
  if (result.iso === "AR" && result.national.startsWith("9")) {
    return `+54 9 ${result.national.slice(1)}`
  }
  return `+${dial} ${result.national}`
}

export function waMeDigits(e164: string): string {
  return digitsOnly(e164)
}
