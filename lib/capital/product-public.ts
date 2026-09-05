/**
 * Datos del manual que viajan al navegador para Meta Pixel.
 *
 * Es el único lugar del cliente donde vive el precio para ads. Si cambia el
 * precio, actualizar acá y en products.price_cents (la base). El Purchase del
 * Pixel y de CAPI toman el monto real del pago de Mercado Pago, no de acá.
 */
export const META_PRODUCT = {
  contentName: "Manual Capital de Esencia Visual",
  value: 19999,
  currency: "ARS",
} as const
