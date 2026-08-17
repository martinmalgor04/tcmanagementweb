/**
 * Envío del mail de acceso.
 *
 * Todo envío deja una fila en email_events. Si no hay RESEND_API_KEY el mail
 * queda en `queued` y se puede reenviar después sin perder el registro.
 */

import { ACCESS_TOKEN_TTL_DAYS, resendConfig } from "./config"
import { insert, update } from "./db"
import type { Customer, Product } from "./access"

type EmailTemplate = "purchase_access" | "reminder" | "custom"
type EmailStatus = "queued" | "sent" | "failed"

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
    `El link es personal y vence en ${ACCESS_TOKEN_TTL_DAYS} días. Una vez que entrás, tu navegador queda habilitado.`,
    "",
    "TC Management",
  ].join("\n")
}

function accessEmailHtml(args: {
  nombre: string | null
  product: Product
  accessUrl: string
}): string {
  const saludo = args.nombre ? `Hola ${escapeHtml(args.nombre)},` : "Hola,"

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#070707;font-family:Helvetica,Arial,sans-serif;color:#f5f4f2">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070707">
      <tr>
        <td align="center" style="padding:48px 24px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
            <tr>
              <td style="padding-bottom:32px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c8b48a">
                TC Management
              </td>
            </tr>
            <tr>
              <td style="font-size:26px;font-weight:700;line-height:1.2;text-transform:uppercase;color:#f5f4f2">
                ${escapeHtml(args.product.name)}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:15px;line-height:1.7;color:#a3a3a3">
                ${saludo}<br /><br />
                Tu acceso ya está listo. Entrá desde este botón:
              </td>
            </tr>
            <tr>
              <td style="padding:32px 0">
                <a href="${args.accessUrl}"
                   style="display:inline-block;background:#c8b48a;color:#070707;padding:16px 32px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none">
                  Abrir el manual
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:1.7;color:#737373">
                El link es personal y vence en ${ACCESS_TOKEN_TTL_DAYS} días. Cuando lo abrís, tu navegador
                queda habilitado y podés volver cuando quieras.<br /><br />
                Si el botón no anda, copiá esta dirección:<br />
                <span style="color:#a3a3a3;word-break:break-all">${args.accessUrl}</span>
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
