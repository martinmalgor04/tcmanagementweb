/**
 * Reglas de acceso al infoproducto.
 *
 * Regla de oro: el HTML se desbloquea sólo si existe un entitlement `active`.
 * Guardar datos del formulario no alcanza; hace falta además una order `paid`.
 */

import {
  ACCESS_ENTRY_PATH,
  ACCESS_TOKEN_MAX_USES,
  ACCESS_TOKEN_TTL_DAYS,
  outboundSiteUrl,
} from "./config"
import { insert, rpc, select, selectOne, update } from "./db"
import { createAccessToken, hashAccessToken } from "./tokens"

export type Product = {
  id: string
  slug: string
  name: string
  price_cents: number
  currency: string
  access_path: string
  is_active: boolean
}

export type Customer = {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  whatsapp: string | null
  ciudad: string | null
  instagram: string | null
}

export type Order = {
  id: string
  customer_id: string
  product_id: string
  status: "pending" | "paid" | "failed" | "refunded"
  payment_verified: boolean
  provider_payment_id: string | null
  paid_at: string | null
  amount_cents: number
  currency: string
  /** Cuándo se reportó el Purchase a Meta CAPI. null = pendiente o falló. */
  meta_capi_sent_at?: string | null
}

export type CustomerInput = {
  email: string
  nombre?: string | null
  apellido?: string | null
  whatsapp?: string | null
  ciudad?: string | null
  instagram?: string | null
  source?: string
}

export async function getProduct(slug: string): Promise<Product | null> {
  return selectOne<Product>("products", `slug=eq.${encodeURIComponent(slug)}&select=*`)
}

/**
 * Upsert por email. Sólo se mandan los campos con valor: PostgREST arma el
 * `do update set` con las columnas presentes, así un reenvío del formulario con
 * campos vacíos no pisa datos que ya teníamos.
 */
export async function upsertCustomer(input: CustomerInput): Promise<Customer> {
  const row: Record<string, unknown> = { email: input.email.trim().toLowerCase() }

  for (const field of ["nombre", "apellido", "whatsapp", "ciudad", "instagram", "source"] as const) {
    const value = input[field]
    if (value) row[field] = value
  }

  return insert<Customer>("customers", row, { onConflict: "email", merge: true })
}

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  return selectOne<Customer>(
    "customers",
    `email=eq.${encodeURIComponent(email.trim().toLowerCase())}&select=*`,
  )
}

export type RecordOrderInput = {
  customerId: string
  product: Product
  status: Order["status"]
  /** true sólo si el estado lo confirmó la API del proveedor. */
  paymentVerified?: boolean
  provider?: string
  providerPaymentId?: string | null
  amountCents?: number
  rawPayload?: unknown
}

export async function recordOrder(input: RecordOrderInput): Promise<Order> {
  const provider = input.provider || "mercadopago"

  const existing = input.providerPaymentId
    ? await findOrderByPaymentId(provider, input.providerPaymentId)
    : null

  const verified = existing?.payment_verified || Boolean(input.paymentVerified)

  // Los parámetros de la URL de retorno los controla el navegador: sin
  // confirmación del proveedor, la orden queda pendiente hasta que llegue el
  // webhook. Antes bastaba con mandar mp_status=approved para quedar "paid".
  const claimed = input.status === "paid" && !verified ? "pending" : input.status

  // Un pago acreditado no se degrada, salvo que el proveedor confirme una
  // devolución o un contracargo.
  const status =
    existing?.status === "paid" && !(verified && claimed === "refunded") ? "paid" : claimed

  const row: Record<string, unknown> = {
    customer_id: input.customerId,
    product_id: input.product.id,
    provider,
    provider_payment_id: input.providerPaymentId || null,
    status,
    // Una vez verificado, no se vuelve atrás.
    payment_verified: verified,
    amount_cents: input.amountCents ?? input.product.price_cents,
    currency: input.product.currency,
  }

  if (status === "paid") {
    row.paid_at = existing?.paid_at ?? new Date().toISOString()
  }
  if (input.rawPayload) {
    row.raw_payload = input.rawPayload
  }

  if (input.providerPaymentId) {
    return insert<Order>("orders", row, {
      onConflict: "provider,provider_payment_id",
      merge: true,
    })
  }

  // Sin id de pago no hay clave natural: reusamos la última order pendiente
  // del mismo cliente para no llenar la tabla de duplicados.
  const pending = await selectOne<Order>(
    "orders",
    `customer_id=eq.${input.customerId}&product_id=eq.${input.product.id}` +
      `&status=eq.pending&order=created_at.desc&select=*`,
  )

  if (pending) {
    const updated = await update<Order>("orders", `id=eq.${pending.id}`, row)
    if (updated) return updated
  }

  return insert<Order>("orders", row)
}

export async function findOrderByPaymentId(
  provider: string,
  providerPaymentId: string,
): Promise<Order | null> {
  return selectOne<Order>(
    "orders",
    `provider=eq.${encodeURIComponent(provider)}` +
      `&provider_payment_id=eq.${encodeURIComponent(providerPaymentId)}&select=*`,
  )
}

export async function findPaidVerifiedOrder(
  customerId: string,
  productId: string,
): Promise<Order | null> {
  return selectOne<Order>(
    "orders",
    `customer_id=eq.${customerId}&product_id=eq.${productId}` +
      `&status=eq.paid&payment_verified=eq.true&order=paid_at.desc&select=*`,
  )
}

export async function findCustomerById(id: string): Promise<Customer | null> {
  return selectOne<Customer>("customers", `id=eq.${id}&select=*`)
}

/**
 * Completa datos de una compradora que ya existe (pago por webhook, después
 * el formulario de /gracias). No pisa con vacíos.
 */
export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  const row: Record<string, unknown> = {}

  for (const field of ["nombre", "apellido", "whatsapp", "ciudad", "instagram", "source"] as const) {
    const value = input[field]
    if (value) row[field] = value
  }
  if (input.email) row.email = input.email.trim().toLowerCase()

  const updated = await update<Customer>("customers", `id=eq.${id}`, row)
  if (!updated) throw new Error("No se pudo actualizar la compradora")
  return updated
}

/**
 * Da de baja el acceso: devolución, contracargo o baja a mano desde el panel.
 * Los links vivos dejan de servir en el acto.
 */
export async function revokeEntitlement(customerId: string, productId: string): Promise<void> {
  const now = new Date().toISOString()

  await update("entitlements", `customer_id=eq.${customerId}&product_id=eq.${productId}`, {
    status: "revoked",
    revoked_at: now,
  })

  const live = await select<{ id: string }>(
    "access_tokens",
    `customer_id=eq.${customerId}&product_id=eq.${productId}&revoked_at=is.null&select=id`,
  )
  for (const token of live) {
    await update("access_tokens", `id=eq.${token.id}`, { revoked_at: now })
  }
}

export async function grantEntitlement(
  customerId: string,
  productId: string,
  orderId: string | null,
): Promise<void> {
  // Una baja hecha a propósito no se revive sola: si el entitlement está
  // revocado, hay que volver a darlo desde el panel.
  const existing = await selectOne<{ status: string }>(
    "entitlements",
    `customer_id=eq.${customerId}&product_id=eq.${productId}&select=status`,
  )
  if (existing?.status === "revoked") return

  await insert("entitlements", {
    customer_id: customerId,
    product_id: productId,
    order_id: orderId,
    status: "active",
    granted_at: new Date().toISOString(),
    revoked_at: null,
  }, { onConflict: "customer_id,product_id", merge: true })
}

export async function hasActiveEntitlement(customerId: string, productId: string): Promise<boolean> {
  const row = await selectOne<{ id: string }>(
    "entitlements",
    `customer_id=eq.${customerId}&product_id=eq.${productId}&status=eq.active&select=id`,
  )
  return row !== null
}

/**
 * Genera un magic link nuevo. No toca los anteriores: la baja va aparte y
 * después de que el mail salga, así un envío fallido no deja a la compradora
 * sin el link que ya tenía. Ver deliverAccess.
 */
export async function issueAccessLink(
  customerId: string,
  productId: string,
): Promise<{ url: string; tokenId: string }> {
  const now = new Date()
  const { raw, hash } = createAccessToken()
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  const token = await insert<{ id: string }>("access_tokens", {
    customer_id: customerId,
    product_id: productId,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
    max_uses: ACCESS_TOKEN_MAX_USES,
  })

  return {
    url: `${outboundSiteUrl()}${ACCESS_ENTRY_PATH}?token=${encodeURIComponent(raw)}`,
    tokenId: token.id,
  }
}

/**
 * Da de baja los links vivos salvo el que se acaba de entregar, para que uno
 * viejo reenviado por WhatsApp deje de servir.
 */
export async function revokePreviousAccessTokens(
  customerId: string,
  productId: string,
  keepTokenId: string,
): Promise<void> {
  const now = new Date()

  const live = await select<{ id: string }>(
    "access_tokens",
    `customer_id=eq.${customerId}&product_id=eq.${productId}` +
      `&revoked_at=is.null&expires_at=gt.${now.toISOString()}&id=neq.${keepTokenId}&select=id`,
  )
  for (const token of live) {
    await update("access_tokens", `id=eq.${token.id}`, { revoked_at: now.toISOString() })
  }
}

/**
 * Canje atómico en la base (ver función redeem_access_token). Devuelve null si
 * el token venció, se quedó sin usos, fue revocado o el entitlement no está activo.
 */
export async function redeemAccessLink(
  rawToken: string,
): Promise<{ customerId: string; productId: string } | null> {
  const rows = await rpc<{ customer_id: string; product_id: string }[]>("redeem_access_token", {
    p_token_hash: hashAccessToken(rawToken),
  })

  const row = Array.isArray(rows) ? rows[0] : null
  if (!row) return null

  return { customerId: row.customer_id, productId: row.product_id }
}
