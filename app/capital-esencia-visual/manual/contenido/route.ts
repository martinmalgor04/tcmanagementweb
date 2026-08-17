import { readFile } from "node:fs/promises"
import path from "node:path"

import { hasManualAccess } from "@/lib/capital/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Sirve el HTML del manual dentro del iframe de /manual.
 *
 * Las route handlers NO pasan por el layout, así que la puerta se repite acá:
 * sin esta verificación bastaría con conocer la URL para leer el manual entero
 * sin haber comprado.
 *
 * El archivo vive en content/ y no en public/ justamente para que sólo se pueda
 * llegar a él por esta ruta.
 */

const MANUAL_FILE = path.join(process.cwd(), "content", "capital-esencia-visual", "manual.html")

let cached: string | null = null

async function readManual(): Promise<string> {
  if (!cached) cached = await readFile(MANUAL_FILE, "utf8")
  return cached
}

export async function GET() {
  const notFound = new Response("Not Found", {
    status: 404,
    headers: { "x-robots-tag": "noindex, nofollow" },
  })

  if (!(await hasManualAccess())) return notFound

  let html: string
  try {
    html = await readManual()
  } catch (error) {
    console.error("[capital] no se pudo leer el manual", error)
    return new Response("Error", { status: 500 })
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      // private: que no quede cacheado en la CDN de Vercel ni en proxies
      // compartidos, donde lo podría levantar alguien sin entitlement.
      "cache-control": "private, no-store, max-age=0, must-revalidate",
    },
  })
}
