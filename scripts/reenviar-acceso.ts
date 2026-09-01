import { findCustomerByEmail, getProduct } from "../lib/capital/access"
import { PRODUCT_SLUG, outboundSiteUrl } from "../lib/capital/config"
import { deliverAccess } from "../lib/capital/deliver"

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error("Uso: npx tsx --env-file=.env.local scripts/reenviar-acceso.ts <email>")
    process.exit(1)
  }

  const product = await getProduct(PRODUCT_SLUG)
  const customer = await findCustomerByEmail(email)
  if (!product || !customer) {
    console.error("No hay compradora o producto.")
    process.exit(1)
  }

  const result = await deliverAccess({ customer, product, orderId: null })
  const origin = new URL(result.accessUrl || outboundSiteUrl()).origin
  console.log({ emailStatus: result.emailStatus, origin })
  if (result.emailStatus !== "sent") process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
