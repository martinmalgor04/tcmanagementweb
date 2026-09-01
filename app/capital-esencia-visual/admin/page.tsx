import type { Metadata } from "next"

import { CortesiaForm } from "@/components/capital/cortesia-form"
import { RecuperarPagoForm } from "@/components/capital/recuperar-pago-form"
import { adminToken } from "@/lib/capital/config"
import { hasAdminSession } from "@/lib/capital/admin-session"
import { EMPTY_EVENT, getCustomers, getDashboard } from "@/lib/capital/metrics"
import "../capital.css"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Panel — Capital de Esencia Visual",
  robots: { index: false, follow: false, nocache: true },
}

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const LOGO_WORDMARK = `${CDN}/LOGOS/tc-wordmark-white.png`

function pesos(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })
}

function fecha(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

function porcentaje(parte: number, total: number): string {
  if (!total) return "—"
  return `${((parte / total) * 100).toFixed(1)}%`
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; aviso?: string }>
}) {
  const params = await searchParams

  if (!adminToken()) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Panel deshabilitado</h1>
        <p className="mt-4 leading-relaxed text-neutral-400">
          Falta la variable <code className="text-neutral-200">CAPITAL_ADMIN_TOKEN</code>. Cargala en
          Vercel y volvé a entrar.
        </p>
      </Shell>
    )
  }

  if (!(await hasAdminSession())) {
    return (
      <Shell>
        <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">Panel</p>
        <h1 className="mt-4 text-3xl font-bold uppercase tracking-tight">Capital de Esencia Visual</h1>
        <form action="/capital-esencia-visual/admin/entrar" method="post" className="mt-10 max-w-sm">
          <label
            htmlFor="token"
            className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500"
          >
            Token de admin
          </label>
          <input
            id="token"
            name="token"
            type="password"
            autoComplete="current-password"
            required
            className="mt-3 w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-neutral-100 outline-none focus:border-white/40"
          />
          {params.error && (
            <p className="mt-3 text-sm text-red-400">Ese token no es correcto.</p>
          )}
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#f5f4f2] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-[#070707] transition hover:bg-white"
          >
            Entrar
          </button>
        </form>
      </Shell>
    )
  }

  const [dashboard, customers] = await Promise.all([getDashboard(), getCustomers()])

  const visitas = dashboard.eventos.landing_view ?? EMPTY_EVENT
  const clics = dashboard.eventos.checkout_click ?? EMPTY_EVENT
  const lecturas = dashboard.eventos.manual_view ?? EMPTY_EVENT
  const { ordenes } = dashboard

  return (
    <Shell wide>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">Panel</p>
          <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight">Capital de Esencia Visual</h1>
        </div>
        <form action="/capital-esencia-visual/admin/salir" method="post">
          <button
            type="submit"
            className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-300"
          >
            Salir
          </button>
        </form>
      </header>

      {params.aviso && (
        <p className="mt-8 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-neutral-200">
          {params.aviso}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-start gap-3">
        <form action="/capital-esencia-visual/admin/acceder" method="post">
          <button
            type="submit"
            className="whitespace-nowrap rounded-full bg-[#f5f4f2] px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#070707] transition hover:bg-white"
          >
            Ver el manual
          </button>
        </form>

        <details className="group">
          <summary className="flex list-none items-center whitespace-nowrap rounded-full border border-[#c8b48a]/40 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c8b48a] transition hover:border-[#c8b48a] [&::-webkit-details-marker]:hidden">
            Dar acceso de cortesía
          </summary>
          <div className="mt-4 w-full max-w-xl rounded-xl border border-[#c8b48a]/25 bg-[#c8b48a]/[0.04] p-6">
            <p className="text-sm text-neutral-400">
              Para regalos, canjes o pagos que llegaron por afuera de Mercado Pago (efectivo,
              transferencia). Le manda el mismo mail que recibe quien compra en la landing, sin
              cobrarle nada y sin sumar al facturado.
            </p>
            <CortesiaForm />
          </div>
        </details>

        <details className="group">
          <summary className="flex list-none items-center whitespace-nowrap rounded-full border border-white/20 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300 transition hover:border-white/50 hover:text-white [&::-webkit-details-marker]:hidden">
            Recuperar pago de Mercado Pago
          </summary>
          <div className="mt-4 w-full max-w-xl rounded-xl border border-white/15 bg-white/[0.03] p-6">
            <p className="text-sm text-neutral-400">
              Pegá el número de operación del mail de Mercado Pago. Confirma el cobro
              contra la API, lo deja en la base y manda el acceso. El mail es opcional:
              sólo hace falta si Mercado Pago no lo trae.
            </p>
            <RecuperarPagoForm />
          </div>
        </details>
      </div>

      <section className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Visitas a la landing" value={visitas.total} detalle={`${visitas.hoy} hoy · ${visitas.unicos} personas`} />
        <Card label="Clics al checkout" value={clics.total} detalle={`${porcentaje(clics.total, visitas.total)} de las visitas`} />
        <Card label="Compras" value={ordenes.pagadas} detalle={`${porcentaje(ordenes.pagadas, clics.total)} de los clics`} />
        <Card label="Facturado" value={pesos(ordenes.ingresos_cents)} detalle={`${ordenes.pagadas_d7} en 7 días`} />
        <Card label="Accesos al manual" value={lecturas.total} detalle={`${dashboard.lectoras_unicas} personas distintas`} />
        <Card label="Con acceso activo" value={dashboard.entitlements_activos} detalle={`${dashboard.compradoras} registradas`} />
        <Card
          label="Pagos sin verificar"
          value={ordenes.sin_verificar}
          detalle={ordenes.sin_verificar ? "Revisalos en Mercado Pago" : "Todo confirmado"}
          alerta={ordenes.sin_verificar > 0}
        />
        <Card
          label="Mails fallidos"
          value={dashboard.mails_fallidos}
          detalle={dashboard.mails_fallidos ? "Reenviá desde la tabla" : "Sin problemas"}
          alerta={dashboard.mails_fallidos > 0}
        />
      </section>

      <h2 className="mt-14 text-[11px] font-medium uppercase tracking-[0.45em] text-neutral-500">
        Compradoras
      </h2>

      {customers.length === 0 ? (
        <p className="mt-6 text-neutral-400">Todavía no hay ninguna.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/15 text-left text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                <th className="py-3 pr-4 font-medium">Compradora</th>
                <th className="py-3 pr-4 font-medium">Contacto</th>
                <th className="py-3 pr-4 font-medium">Pago</th>
                <th className="py-3 pr-4 font-medium">Acceso</th>
                <th className="py-3 pr-4 font-medium">Lecturas</th>
                <th className="py-3 pr-4 font-medium">Último mail</th>
                <th className="py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.07] align-top">
                  <td className="py-4 pr-4">
                    <div className="font-medium text-neutral-100">
                      {[c.nombre, c.apellido].filter(Boolean).join(" ") || "Sin nombre"}
                    </div>
                    <div className="text-neutral-500">{c.email}</div>
                    <div className="mt-1 text-xs text-neutral-600">{fecha(c.created_at)}</div>
                  </td>
                  <td className="py-4 pr-4 text-neutral-400">
                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-neutral-200"
                      >
                        {c.whatsapp}
                      </a>
                    )}
                    <div className="text-neutral-500">{c.ciudad}</div>
                    {c.instagram && <div className="text-neutral-500">{c.instagram}</div>}
                    {c.orden_status === "paid" &&
                      (!c.whatsapp || /testuser\.com$|sin-mail\.tcmanagement/.test(c.email)) && (
                      <div className="mt-1 text-xs text-amber-400">faltan datos</div>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <div className="text-neutral-200">{c.orden_status ?? "—"}</div>
                    {c.amount_cents != null && (
                      <div className="text-neutral-500">{pesos(c.amount_cents)}</div>
                    )}
                    {c.orden_status === "paid" && !c.payment_verified && (
                      <div className="mt-1 text-xs text-amber-400">sin verificar</div>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <span className={c.entitlement === "active" ? "text-emerald-400" : "text-neutral-500"}>
                      {c.entitlement ?? "sin acceso"}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-neutral-300">
                    {c.lecturas}
                    <div className="text-xs text-neutral-600">{fecha(c.ultima_lectura)}</div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={c.ultimo_mail === "failed" ? "text-red-400" : "text-neutral-400"}>
                      {c.ultimo_mail ?? "—"}
                    </span>
                  </td>
                  <td className="py-4">
                    <form action="/capital-esencia-visual/admin/reenviar" method="post">
                      <input type="hidden" name="email" value={c.email} />
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition hover:border-white/50 hover:text-white"
                      >
                        Reenviar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}

function Card({
  label,
  value,
  detalle,
  alerta = false,
}: {
  label: string
  value: number | string
  detalle?: string
  alerta?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        alerta ? "border-amber-500/40 bg-amber-500/[0.04]" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-neutral-50">{value}</div>
      {detalle && <div className="mt-2 text-xs text-neutral-500">{detalle}</div>}
    </div>
  )
}

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="capital-admin cev-grain relative min-h-[100svh] px-6 py-12 font-[inherit]">
      <div className={`relative z-10 mx-auto w-full ${wide ? "max-w-6xl" : "max-w-lg"}`}>
        <img src={LOGO_WORDMARK} alt="TC Management" className="mb-10 h-5 w-auto" />
        {children}
      </div>
    </div>
  )
}
