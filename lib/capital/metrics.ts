/**
 * Datos del panel. Las agregaciones se hacen en la base (ver las funciones
 * capital_dashboard y capital_customers).
 */

import { rpc } from "./db"

type EventStats = { total: number; hoy: number; d7: number; d30: number; unicos: number }

export type Dashboard = {
  eventos: Partial<Record<"landing_view" | "checkout_click" | "access_redeemed" | "manual_view", EventStats>>
  ordenes: {
    pagadas: number
    pagadas_hoy: number
    pagadas_d7: number
    sin_verificar: number
    ingresos_cents: number
  }
  lectoras_unicas: number
  compradoras: number
  entitlements_activos: number
  mails_fallidos: number
}

export type CustomerRow = {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  whatsapp: string | null
  ciudad: string | null
  instagram: string | null
  created_at: string
  orden_status: string | null
  payment_verified: boolean | null
  amount_cents: number | null
  provider_payment_id: string | null
  entitlement: string | null
  lecturas: number
  ultima_lectura: string | null
  ultimo_mail: string | null
}

export function getDashboard(): Promise<Dashboard> {
  return rpc<Dashboard>("capital_dashboard", {})
}

export function getCustomers(limit = 200): Promise<CustomerRow[]> {
  return rpc<CustomerRow[]>("capital_customers", { p_limit: limit })
}

export const EMPTY_EVENT: EventStats = { total: 0, hoy: 0, d7: 0, d30: 0, unicos: 0 }
