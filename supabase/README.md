# Infoproductos TC — base de datos y acceso

Proyecto Supabase: `kpeauysjkpjswqbfvqka` (`https://kpeauysjkpjswqbfvqka.supabase.co`).
El proyecto viejo `ghexalvmqhvfnkgyagzb` (RAG/documents, tabla `cev_compradoras`) ya no lo
usa esta app.

## Aplicar las migraciones

Los archivos de `migrations/` están pensados para correrse en orden. Tres caminos:

1. **MCP.** Con el servidor `supabase-tcm` cargado y autenticado, pasar el contenido de cada
   archivo a `apply_migration`.
2. **CLI.** `supabase link --project-ref kpeauysjkpjswqbfvqka && supabase db push`
   (requiere estar logueado con la cuenta dueña del proyecto).
3. **SQL Editor** del dashboard: pegar y ejecutar cada archivo.

## Esquema

| Tabla | Para qué |
|---|---|
| `products` | Catálogo. Una fila por infoproducto, con la ruta gated en `access_path`. |
| `customers` | Una fila por email. Sin PII más allá del formulario. |
| `orders` | Un intento de compra. `status`: `pending`/`paid`/`failed`/`refunded`. `payment_verified` distingue el pago confirmado contra Mercado Pago del que sólo vino en la URL de retorno. |
| `entitlements` | Quién puede ver el HTML. Única fuente de verdad del gating. |
| `access_tokens` | Magic links. Sólo se guarda el sha256 del token. |
| `email_events` | Un registro por envío, con su estado en el proveedor. |
| `page_events` | Eventos del embudo para el panel. Sin PII. |

`price_cents` y `amount_cents` están en centavos: $19.999 ARS son `1999900`.

### Métricas

`page_events` guarda cuatro tipos de evento: `landing_view` y `checkout_click` los manda el
navegador contra `/api/capital/track`; `access_redeemed` y `manual_view` se escriben en el
server, donde no se pueden falsear. El endpoint público sólo acepta los dos primeros.

Es la única tabla con volumen, así que la clave es `bigint identity` y no `uuid`. El
`visitor` es un random propio en una cookie httpOnly, sirve para separar visitas de personas
y no identifica a nadie.

Las agregaciones viven en dos funciones, `capital_dashboard()` y `capital_customers(limit)`,
para no traerse las filas y contarlas en Node.

### RLS

Todas las tablas tienen RLS activa **sin ninguna política**, y además se les revocaron los
permisos a `anon` y `authenticated`. Es decir: con la anon key no se lee ni se escribe nada
(PostgREST devuelve `42501`). Todo pasa por API routes del server con la `service_role` key.

Ojo con una trampa de Supabase: las tablas creadas por una migración **no** quedan expuestas
al Data API solas. El default ACL le da a `service_role` sólo TRUNCATE/REFERENCES/TRIGGER, así
que la migración incluye un `grant select, insert, update, delete ... to service_role`
explícito. Sin eso las API routes reciben `42501`. Si más adelante agregás tablas a este
esquema, acordate del grant.

El día que haya login, la migración deja documentado el patrón de política por `customer_id`.

## Desarrollo local

`supabase start` levanta el stack y aplica las migraciones; `supabase db reset` las vuelve a
correr desde cero. Las keys locales salen de `supabase status -o env`.

## Variables de entorno (Vercel — todas sin `NEXT_PUBLIC_`)

| Variable | Obligatoria | Para qué |
|---|---|---|
| `SUPABASE_URL` | sí | `https://kpeauysjkpjswqbfvqka.supabase.co` |
| `SUPABASE_ANON_KEY` | sí | Reservada; hoy la app usa la service role. |
| `SUPABASE_SERVICE_ROLE_KEY` | sí | Único acceso a las tablas. Sólo en API routes. |
| `CAPITAL_SESSION_SECRET` | sí | Firma la cookie de acceso. 32 bytes hex. |
| `CAPITAL_SITE_URL` | sí en prod | Base de los links del mail (`https://tcmanagement.com.ar`). |
| `RESEND_API_KEY` | no | Sin esto los mails quedan en `queued`. |
| `CAPITAL_FROM_EMAIL` | no | Remitente. Default `hola@tcmanagement.com.ar`. |

| `MP_ACCESS_TOKEN` | no | Crea el checkout (preferencia) y verifica el pago. En local, usar el token TEST-. En Vercel de producción, el token live (`APP_USR-`). |
| `MP_PUBLIC_KEY` | no | Reservada para Checkout Bricks. Checkout Pro no la necesita en el cliente. |
| `MP_WEBHOOK_SECRET` | no | Valida la firma del webhook. |
| `CAPITAL_ADMIN_TOKEN` | no | Contraseña del panel y del endpoint de soporte. Sin esto el panel queda deshabilitado. |

## Panel

`/capital-esencia-visual/admin`, con el `CAPITAL_ADMIN_TOKEN` como contraseña. El token se
cambia por una cookie firmada de 7 días, así no viaja en cada request. Muestra el embudo
(visitas, clics, compras, accesos al manual), avisa de los pagos sin verificar y los mails
fallidos, y lista las compradoras con un botón para reenviarles el acceso.

La página lleva `noindex` y no está enlazada desde ningún lado.

## Mails

El dominio `tcmanagement.com.ar` está verificado en Resend (región `sa-east-1`), así que el
remitente `hola@tcmanagement.com.ar` sale sin problemas.

La app escribe `sent` o `failed` en `email_events`. Los estados `delivered`, `opened` y
`bounced` existen en el esquema pero hoy nadie los escribe: para eso haría falta enganchar un
webhook de Resend que actualice la fila por `provider_message_id`.

## Consultas útiles

```sql
-- Ventas del producto
select c.email, c.nombre, c.apellido, c.whatsapp, o.status, o.paid_at
from public.orders o
join public.customers c on c.id = o.customer_id
join public.products p on p.id = o.product_id
where p.slug = 'capital-esencia-visual'
order by o.created_at desc;

-- Quién tiene acceso hoy
select c.email, e.granted_at
from public.entitlements e
join public.customers c on c.id = e.customer_id
join public.products p on p.id = e.product_id
where p.slug = 'capital-esencia-visual' and e.status = 'active'
order by e.granted_at desc;

-- Auditoría: accesos dados sin confirmar el pago contra Mercado Pago.
-- Mientras no haya MP_ACCESS_TOKEN, todos los pagos caen acá. Cruzar contra
-- los cobros reales de Mercado Pago cada tanto.
select c.email, o.provider_payment_id, o.amount_cents, o.paid_at
from public.orders o
join public.customers c on c.id = o.customer_id
where o.status = 'paid' and o.payment_verified = false
order by o.paid_at desc;

-- Mails que nunca salieron
select to_email, template, status, error, created_at
from public.email_events
where status in ('queued', 'failed')
order by created_at desc;

-- Cortar el acceso de alguien
update public.entitlements e
set status = 'revoked', revoked_at = now()
from public.customers c
where c.id = e.customer_id and c.email = 'alguien@ejemplo.com';
```

## Soporte: generar un link a mano

```bash
curl -X POST https://tcmanagement.com.ar/api/capital/admin/acceso \
  -H "x-capital-admin-token: $CAPITAL_ADMIN_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"email":"compradora@ejemplo.com"}'
```

`{"grant": true}` además habilita a alguien que pagó por fuera de Mercado Pago
(transferencia, cortesía). `{"send": true}` manda el mail además de devolver el link.
