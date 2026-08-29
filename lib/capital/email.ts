/**
 * Envío del mail de acceso.
 *
 * Todo envío deja una fila en email_events. Si no hay RESEND_API_KEY el mail
 * queda en `queued` y se puede reenviar después sin perder el registro.
 */

import { ACCESS_TOKEN_TTL_DAYS, creatorEmail, ownerEmail, resendConfig } from "./config"
import { insert, update } from "./db"
import type { Customer, Product } from "./access"

type EmailTemplate = "purchase_access" | "reminder" | "custom"
export type EmailStatus = "queued" | "sent" | "failed"

type EmailEvent = { id: string }

export type SendAccessEmailInput = {
  customer: Customer
  product: Product
  accessUrl: string
  orderId: string | null
}

export async function sendAccessEmail(input: SendAccessEmailInput): Promise<EmailStatus> {
  const { customer, product, accessUrl, orderId } = input
  const subject = `Tu acceso a ${product.name}`

  const event = await insert<EmailEvent>("email_events", {
    customer_id: customer.id,
    order_id: orderId,
    product_id: product.id,
    template: "purchase_access" satisfies EmailTemplate,
    to_email: customer.email,
    provider: resendConfig() ? "resend" : "none",
    status: "queued",
    // Nunca guardamos el link: lleva el token en claro.
    payload: { subject, ttl_days: ACCESS_TOKEN_TTL_DAYS },
  })

  const resend = resendConfig()
  if (!resend) {
    return "queued"
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: resend.from,
        to: [customer.email],
        subject,
        html: accessEmailHtml({ nombre: customer.nombre, product, accessUrl }),
        text: accessEmailText({ nombre: customer.nombre, product, accessUrl }),
      }),
    })

    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }

    if (!res.ok) {
      await update("email_events", `id=eq.${event.id}`, {
        status: "failed",
        error: body.message || `Resend respondió ${res.status}`,
      })
      return "failed"
    }

    await update("email_events", `id=eq.${event.id}`, {
      status: "sent",
      provider_message_id: body.id ?? null,
    })
    return "sent"
  } catch (error) {
    await update("email_events", `id=eq.${event.id}`, {
      status: "failed",
      error: error instanceof Error ? error.message : "Error desconocido",
    })
    return "failed"
  }
}

function accessEmailText(args: {
  nombre: string | null
  product: Product
  accessUrl: string
}): string {
  const saludo = args.nombre ? `Hola ${args.nombre},` : "Hola,"
  return [
    saludo,
    "",
    `Ya tenés acceso a ${args.product.name}.`,
    "",
    args.accessUrl,
    "",
    "Guardá este mail: el link es tu llave y es personal, no lo compartas.",
    "Cuando lo abrís, ese navegador queda habilitado y podés volver cuando quieras.",
    "",
    "TC Management",
  ].join("\n")
}

const CDN = "https://pub-9195f8a94602486395419c2bb7beab6b.r2.dev"
const EMAIL_LOGO = `${CDN}/LOGOS/tc-wordmark-white.png`
const EMAIL_PORTADA = `${CDN}/CEV/portada-simbologia.jpg`

function accessEmailHtml(args: {
  nombre: string | null
  product: Product
  accessUrl: string
}): string {
  const saludo = args.nombre ? `Hola ${escapeHtml(args.nombre)},` : "Hola,"

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
  </head>
  <body style="margin:0;padding:0;background:#070707;font-family:Georgia,'Times New Roman',serif;color:#f5f4f2">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">
      Ya tenés acceso a ${escapeHtml(args.product.name)}. Entrá cuando quieras.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070707">
      <tr>
        <td align="center" style="padding:52px 20px 64px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
            <tr>
              <td align="center" style="padding-bottom:44px">
                <img src="${EMAIL_LOGO}" alt="TC Management" width="104"
                     style="display:block;width:104px;height:auto;opacity:0.85" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:44px;font-size:17px;line-height:1.6;font-style:italic;color:#d6d3ce">
                Tu ejemplar te espera.
              </td>
            </tr>
            <tr>
              <td style="background:#0d0c0b;border:1px solid rgba(200,180,138,0.28);padding:14px">
                <img src="${EMAIL_PORTADA}" alt="${escapeHtml(args.product.name)}" width="450"
                     style="display:block;width:100%;height:auto" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:44px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#c8b48a;font-family:Helvetica,Arial,sans-serif">
                Manual digital
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:16px;font-size:32px;line-height:1.3;letter-spacing:0.5px;color:#f5f4f2">
                ${escapeHtml(args.product.name)}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:22px">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:36px;border-top:1px solid rgba(200,180,138,0.5)"></td>
                    <td style="padding:0 12px;font-size:9px;line-height:1;color:#c8b48a">&#9670;</td>
                    <td style="width:36px;border-top:1px solid rgba(200,180,138,0.5)"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:28px;font-size:15px;line-height:1.85;color:#a8a5a0">
                ${saludo}<br />
                Tu acceso ya está listo. Entrá cuando quieras &mdash; el manual
                queda abierto para vos.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:36px 0 4px">
                <a href="${args.accessUrl}"
                   style="display:inline-block;background:#c8b48a;color:#070707;padding:17px 46px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-family:Helvetica,Arial,sans-serif">
                  Abrir el manual
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:60px">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr><td style="border-top:1px solid rgba(255,255,255,0.07)"></td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:28px;font-size:12px;line-height:1.9;color:#66625d;font-family:Helvetica,Arial,sans-serif">
                Guardá este mail: el link es tu llave y es personal, no lo compartas.<br />
                Cuando lo abrís, ese navegador queda habilitado y podés volver cuando quieras.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:18px;font-size:11px;line-height:1.8;color:#4e4a45;font-family:Helvetica,Arial,sans-serif">
                Si el botón no anda, copiá esta dirección:<br />
                <span style="color:#7a766f;word-break:break-all">${args.accessUrl}</span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:48px;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#45423e;font-family:Helvetica,Arial,sans-serif">
                TC Management
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export type SaleNotificationInput = {
  customer: Customer
  product: Product
  amountCents: number
  orderId: string | null
}

/**
 * Aviso de venta al dueño y a la creadora. Best-effort: no se registra en
 * email_events ni frena la entrega si Resend falla, porque la compradora ya
 * tiene su acceso resuelto en `sendAccessEmail`.
 */
export async function notifySale(input: SaleNotificationInput): Promise<void> {
  const resend = resendConfig()
  if (!resend) return

  const to = [ownerEmail(), creatorEmail()].filter((email): email is string => Boolean(email))
  if (to.length === 0) return

  const esCortesia = input.amountCents <= 0
  const monto = esCortesia
    ? "Cortesía"
    : (input.amountCents / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: input.product.currency || "ARS",
      })
  const titulo = esCortesia ? "Acceso de cortesía" : "Nueva venta"

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: resend.from,
        to,
        subject: esCortesia
          ? `🎁 Acceso de cortesía · ${input.product.name}`
          : `💰 Nueva venta · ${input.product.name} · ${monto}`,
        html: saleNotificationHtml({ ...input, monto, titulo }),
        text: saleNotificationText({ ...input, monto, titulo }),
      }),
    })
  } catch (error) {
    console.error("[capital] no se pudo avisar la venta", error)
  }
}

function saleNotificationText(args: SaleNotificationInput & { monto: string; titulo: string }): string {
  const nombre = [args.customer.nombre, args.customer.apellido].filter(Boolean).join(" ") || "—"
  return [
    `${args.titulo}: ${args.product.name} (${args.monto})`,
    "",
    `Compradora: ${nombre}`,
    `Mail: ${args.customer.email}`,
    args.customer.whatsapp ? `WhatsApp: ${args.customer.whatsapp}` : null,
    args.customer.instagram ? `Instagram: ${args.customer.instagram}` : null,
    args.orderId ? `Orden: ${args.orderId}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

function saleNotificationHtml(args: SaleNotificationInput & { monto: string; titulo: string }): string {
  const nombre = [args.customer.nombre, args.customer.apellido].filter(Boolean).join(" ") || "—"

  const row = (label: string, value: string | null) =>
    value
      ? `<tr>
           <td style="padding:6px 16px 6px 0;font-size:12px;color:#8a8a8a;white-space:nowrap">${escapeHtml(label)}</td>
           <td style="padding:6px 0;font-size:14px;color:#f5f4f2">${escapeHtml(value)}</td>
         </tr>`
      : ""

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#070707;font-family:Helvetica,Arial,sans-serif;color:#f5f4f2">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070707">
      <tr>
        <td align="center" style="padding:40px 20px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
            <tr>
              <td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8b48a;padding-bottom:16px">
                ${escapeHtml(args.titulo)}
              </td>
            </tr>
            <tr>
              <td style="font-size:28px;font-weight:700;color:#f5f4f2;padding-bottom:4px">
                ${escapeHtml(args.monto)}
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#a3a3a3;padding-bottom:24px">
                ${escapeHtml(args.product.name)}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  ${row("Compradora", nombre)}
                  ${row("Mail", args.customer.email)}
                  ${row("WhatsApp", args.customer.whatsapp)}
                  ${row("Instagram", args.customer.instagram)}
                  ${row("Orden", args.orderId)}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
