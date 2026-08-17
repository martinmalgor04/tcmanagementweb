-- Núcleo de infoproductos de TC Management.
-- Diseñado para N productos: products define el catálogo, el resto cuelga de ahí.
-- Ninguna tabla es accesible con la anon key: todo pasa por API routes con service_role.

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.tg_set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'ARS' check (char_length(currency) = 3),
  access_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Catálogo de infoproductos. access_path es la ruta gated de esta app.';

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default extensions.gen_random_uuid(),
  email extensions.citext not null unique,
  nombre text,
  apellido text,
  whatsapp text,
  ciudad text,
  instagram text,
  source text not null default 'landing-cev',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is 'Una fila por email. Sin PII más allá de lo que pide el formulario.';

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.tg_set_updated_at();

create index if not exists customers_created_at_idx
  on public.customers (created_at desc);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  -- false = el estado salió de la URL de retorno, que la controla el navegador.
  -- true  = lo confirmó la API de Mercado Pago. Ver la consulta de auditoría en el README.
  payment_verified boolean not null default false,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ARS',
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Compuesto en vez de unique simple: el mismo id de pago puede repetirse
  -- entre proveedores distintos. NULL no colisiona en Postgres.
  constraint orders_provider_payment_id_key unique (provider, provider_payment_id)
);

comment on column public.orders.raw_payload is 'Payload crudo del webhook o de la verificación contra el proveedor.';

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.tg_set_updated_at();

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_product_id_idx on public.orders (product_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_unverified_idx
  on public.orders (created_at desc)
  where status = 'paid' and payment_verified = false;

-- ---------------------------------------------------------------------------
-- entitlements: la única fuente de verdad de quién puede ver el HTML
-- ---------------------------------------------------------------------------

create table if not exists public.entitlements (
  id uuid primary key default extensions.gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entitlements_customer_product_key unique (customer_id, product_id)
);

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.tg_set_updated_at();

create index if not exists entitlements_product_id_idx on public.entitlements (product_id);
create index if not exists entitlements_order_id_idx on public.entitlements (order_id);

-- ---------------------------------------------------------------------------
-- access_tokens: magic link. Sólo se guarda el hash.
-- ---------------------------------------------------------------------------

create table if not exists public.access_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses smallint not null default 3 check (max_uses > 0),
  uses smallint not null default 0 check (uses >= 0),
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column public.access_tokens.token_hash is 'sha256 hex del token en claro. El token en claro sólo existe en el mail.';
comment on column public.access_tokens.used_at is 'Primer uso. El contador de usos es la columna uses.';

create index if not exists access_tokens_customer_id_idx on public.access_tokens (customer_id);
create index if not exists access_tokens_product_id_idx on public.access_tokens (product_id);
create index if not exists access_tokens_created_at_idx on public.access_tokens (created_at desc);
create index if not exists access_tokens_live_idx
  on public.access_tokens (expires_at desc)
  where revoked_at is null;

-- ---------------------------------------------------------------------------
-- email_events
-- ---------------------------------------------------------------------------

create table if not exists public.email_events (
  id uuid primary key default extensions.gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  template text not null check (template in ('purchase_access', 'reminder', 'custom')),
  to_email extensions.citext not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'delivered', 'opened', 'bounced')),
  error text,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.email_events is 'Sin proveedor de mail configurado los envíos quedan en queued para reenviarlos a mano.';

create trigger email_events_set_updated_at
  before update on public.email_events
  for each row execute function public.tg_set_updated_at();

create index if not exists email_events_customer_id_idx on public.email_events (customer_id);
create index if not exists email_events_order_id_idx on public.email_events (order_id);
create index if not exists email_events_product_id_idx on public.email_events (product_id);
create index if not exists email_events_created_at_idx on public.email_events (created_at desc);
create index if not exists email_events_pending_idx
  on public.email_events (created_at desc)
  where status in ('queued', 'failed');

-- ---------------------------------------------------------------------------
-- Canje de token: atómico, para que max_uses no se pueda pasar con requests
-- concurrentes. Devuelve 0 filas si el token no sirve.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_access_token(p_token_hash text)
returns table (customer_id uuid, product_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token public.access_tokens%rowtype;
begin
  select t.* into v_token
  from public.access_tokens t
  where t.token_hash = p_token_hash
    and t.revoked_at is null
    and t.expires_at > now()
    and t.uses < t.max_uses
  for update;

  if not found then
    return;
  end if;

  if not exists (
    select 1
    from public.entitlements e
    where e.customer_id = v_token.customer_id
      and e.product_id = v_token.product_id
      and e.status = 'active'
  ) then
    return;
  end if;

  update public.access_tokens t
  set uses = t.uses + 1,
      used_at = coalesce(t.used_at, now())
  where t.id = v_token.id;

  customer_id := v_token.customer_id;
  product_id := v_token.product_id;
  return next;
end;
$$;

revoke all on function public.redeem_access_token(text) from public, anon, authenticated;
grant execute on function public.redeem_access_token(text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS: activada en todo, sin políticas.
-- Sin política, anon y authenticated no ven ni escriben nada. service_role
-- (sólo en API routes del server) hace bypass de RLS.
-- El día que haya login, agregar acá políticas del tipo:
--   grant select on public.orders to authenticated;
--   create policy "own orders" on public.orders for select to authenticated
--     using (customer_id = (select c.id from public.customers c
--                           where c.email = (select auth.jwt() ->> 'email')));
-- ---------------------------------------------------------------------------

alter table public.products     enable row level security;
alter table public.customers    enable row level security;
alter table public.orders       enable row level security;
alter table public.entitlements enable row level security;
alter table public.access_tokens enable row level security;
alter table public.email_events enable row level security;

alter table public.products     force row level security;
alter table public.customers    force row level security;
alter table public.orders       force row level security;
alter table public.entitlements force row level security;
alter table public.access_tokens force row level security;
alter table public.email_events force row level security;

revoke all on public.products     from anon, authenticated;
revoke all on public.customers    from anon, authenticated;
revoke all on public.orders       from anon, authenticated;
revoke all on public.entitlements from anon, authenticated;
revoke all on public.access_tokens from anon, authenticated;
revoke all on public.email_events from anon, authenticated;

-- Las tablas creadas por una migración no quedan expuestas al Data API por sí
-- solas: el default ACL le da a service_role sólo TRUNCATE/REFERENCES/TRIGGER.
-- Sin este grant las API routes reciben 42501. service_role tiene bypassrls,
-- así que la RLS sin políticas no lo frena.
grant select, insert, update, delete on
  public.products,
  public.customers,
  public.orders,
  public.entitlements,
  public.access_tokens,
  public.email_events
to service_role;

notify pgrst, 'reload schema';
