/**
 * Manda el mail de acceso a mano, desde esta máquina, apuntando a producción.
 *
 * Sirve como salida de emergencia cuando Vercel tiene alguna variable mal
 * cargada y los envíos automáticos fallan. Usa las mismas funciones que la app,
 * así que el token queda registrado igual que cualquier otro.
 *
 *   npx tsx scripts/enviar-acceso.mts alguien@mail.com
 *
 * Requiere .env.local con SUPABASE_SERVICE_ROLE_KEY y RESEND_API_KEY.
 */

import { createRequire } from "node:module"

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env")
loadEnvConfig(process.cwd())
process.env.CAPITAL_SITE_URL = "https://tcmanagement.com.ar"

const { findCustomerByEmail, getProduct, hasActiveEntitlement } = await import("../lib/capital/access")
const { PRODUCT_SLUG, resendConfig } = await import("../lib/capital/config")
const { deliverAccess } = await import("../lib/capital/deliver")

const email = process.argv[2]
if (!email) throw new Error("Uso: npx tsx scripts/enviar-acceso.mts alguien@mail.com")

console.log(`  from      : ${JSON.stringify(resendConfig()?.from)}`)

const product = await getProduct(PRODUCT_SLUG)
if (!product) throw new Error("No existe el producto")

const customer = await findCustomerByEmail(email)
if (!customer) throw new Error(`No hay clienta con el mail ${email}`)

if (!(await hasActiveEntitlement(customer.id, product.id))) {
  throw new Error("Esa clienta no tiene entitlement activo")
}

const { accessUrl, emailStatus } = await deliverAccess({ customer, product, orderId: null })
console.log(`  link      : ${accessUrl}`)
console.log(`  resultado : ${emailStatus}`)
