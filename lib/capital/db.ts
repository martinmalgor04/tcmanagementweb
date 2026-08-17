/**
 * Cliente PostgREST mínimo con service_role.
 *
 * NUNCA importar desde un componente cliente: la service_role key hace bypass
 * de RLS y tiene acceso total a la base.
 */

import { supabaseConfig } from "./config"

if (typeof window !== "undefined") {
  throw new Error("lib/capital/db sólo puede usarse en el server")
}

const TIMEOUT_MS = 10_000

export class DbError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message)
    this.name = "DbError"
  }
}

async function request<T>(path: string, init: RequestInit, prefer?: string): Promise<T> {
  const { url, serviceRoleKey } = supabaseConfig()

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...(init.headers || {}),
    },
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new DbError(`PostgREST ${res.status} en ${path}`, res.status, detail)
  }

  if (res.status === 204) return null as T

  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function select<T>(table: string, query: string): Promise<T[]> {
  return request<T[]>(`${table}?${query}`, { method: "GET" })
}

export async function selectOne<T>(table: string, query: string): Promise<T | null> {
  const rows = await select<T>(table, `${query}&limit=1`)
  return rows[0] ?? null
}

export async function insert<T>(
  table: string,
  row: Record<string, unknown>,
  options: { onConflict?: string; merge?: boolean } = {},
): Promise<T> {
  const params = options.onConflict ? `?on_conflict=${options.onConflict}` : ""
  const prefer = ["return=representation"]
  if (options.merge) prefer.push("resolution=merge-duplicates")

  const rows = await request<T[]>(
    `${table}${params}`,
    { method: "POST", body: JSON.stringify(row) },
    prefer.join(","),
  )
  return rows[0]
}

export async function update<T>(
  table: string,
  query: string,
  patch: Record<string, unknown>,
): Promise<T | null> {
  const rows = await request<T[]>(
    `${table}?${query}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    "return=representation",
  )
  return rows[0] ?? null
}

export function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  return request<T>(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) })
}
