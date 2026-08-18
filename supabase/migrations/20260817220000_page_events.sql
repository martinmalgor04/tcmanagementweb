-- Eventos para las métricas del embudo: visita a la landing, clic al checkout,
-- canje del link y lectura del manual.
--
-- Es una tabla de sólo agregado y con mucho más volumen que el resto, así que
-- la clave es bigint identity y no uuid: ocupa la mitad, se inserta en orden y
-- no fragmenta el índice.

create table if not exists public.page_events (
  id bigint generated always as identity primary key,
  kind text not null check (
    kind in ('landing_view', 'checkout_click', 'access_redeemed', 'manual_view')
  ),
  product_id uuid references public.products (id) on delete set null,
  -- Sólo en los eventos posteriores a la compra; en la landing es anónimo.
  customer_id uuid references public.customers (id) on delete set null,
  path text,
  referrer text,
  -- Identificador anónimo de navegador, para separar visitas de recargas.
  -- No es PII: es un random que ponemos nosotros en una cookie.
  visitor text,
  created_at timestamptz not null default now()
);

comment on table public.page_events is 'Eventos del embudo. Sin PII: visitor es un random propio.';

-- La consulta del panel siempre filtra por kind y después por rango de fechas.
-- Compuesto en ese orden: igualdad primero, rango después.
create index if not exists page_events_kind_created_idx
  on public.page_events (kind, created_at desc);

create index if not exists page_events_customer_idx
  on public.page_events (customer_id, created_at desc)
  where customer_id is not null;

create index if not exists page_events_product_idx on public.page_events (product_id);

alter table public.page_events enable row level security;
alter table public.page_events force row level security;

revoke all on public.page_events from anon, authenticated;

-- Igual que el resto: sólo se escribe desde API routes con service_role.
grant select, insert, update, delete on public.page_events to service_role;
grant usage, select on all sequences in schema public to service_role;

notify pgrst, 'reload schema';
