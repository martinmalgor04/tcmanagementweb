import {
  findCustomerByEmail,
  findPaidVerifiedOrder,
  getProduct,
  grantEntitlement,
  hasActiveEntitlement,
} from "../lib/capital/access"
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

  let orderId: string | null = null
  if (!(await hasActiveEntitlement(customer.id, product.id))) {
    const order = await findPaidVerifiedOrder(customer.id, product.id)
    if (!order) {
      console.error("No hay acceso activo ni pago verificado.")
      process.exit(1)
    }
    await grantEntitlement(customer.id, product.id, order.id)
    orderId = order.id
  }

  const result = await deliverAccess({ customer, product, orderId })
  const origin = new URL(result.accessUrl || outboundSiteUrl()).origin
  console.log({ emailStatus: result.emailStatus, origin })
  if (result.emailStatus !== "sent") process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
