import { fulfillMercadoPagoPayment } from "../lib/capital/fulfillment"

async function main() {
  const paymentId = process.argv[2]
  if (!paymentId) {
    console.error("Uso: npx tsx --env-file=.env.local scripts/recuperar-pago.ts <payment_id>")
    process.exit(1)
  }

  const result = await fulfillMercadoPagoPayment(paymentId, {
    email: process.argv[3] || null,
    nombre: process.argv[4] || null,
    apellido: process.argv[5] || null,
  })

  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
