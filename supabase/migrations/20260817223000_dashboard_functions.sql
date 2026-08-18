-- Consultas del panel. Van como funciones en la base y no como selects sueltos
-- desde la app para no traerse miles de filas y contarlas en Node.

create or replace function public.capital_dashboard()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with b as (
    select
      -- "Hoy" es el día en Argentina, no en UTC.
      (date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
        at time zone 'America/Argentina/Buenos_Aires') as hoy,
      now() - interval '7 days'  as d7,
      now() - interval '30 days' as d30
  ),
  ev as (
    select
      e.kind,
      count(*)                                          as total,
      count(*) filter (where e.created_at >= b.hoy)     as hoy,
      count(*) filter (where e.created_at >= b.d7)      as d7,
      count(*) filter (where e.created_at >= b.d30)     as d30,
      count(distinct e.visitor)                         as unicos
    from public.page_events e
    cross join b
    group by e.kind
  ),
  ord as (
    select
      count(*) filter (where o.status = 'paid')                                as pagadas,
      count(*) filter (where o.status = 'paid' and o.created_at >= b.hoy)      as pagadas_hoy,
      count(*) filter (where o.status = 'paid' and o.created_at >= b.d7)       as pagadas_d7,
      count(*) filter (where o.status = 'paid' and not o.payment_verified)     as sin_verificar,
      coalesce(sum(o.amount_cents) filter (where o.status = 'paid'), 0)::bigint as ingresos_cents
    from public.orders o
    cross join b
  )
  select jsonb_build_object(
    'eventos', coalesce(
      (select jsonb_object_agg(kind, jsonb_build_object(
        'total', total, 'hoy', hoy, 'd7', d7, 'd30', d30, 'unicos', unicos)) from ev),
      '{}'::jsonb),
    'ordenes', (select to_jsonb(ord) from ord),
    'lectoras_unicas', (
      select count(distinct customer_id) from public.page_events where kind = 'manual_view'),
    'compradoras', (select count(*) from public.customers),
    'entitlements_activos', (
      select count(*) from public.entitlements where status = 'active'),
    'mails_fallidos', (
      select count(*) from public.email_events where status = 'failed')
  );
$$;

revoke all on function public.capital_dashboard() from public, anon, authenticated;
grant execute on function public.capital_dashboard() to service_role;

-- Listado de compradoras con lo que hace falta para atenderlas: estado del
-- pago, si tiene acceso, cuánto leyó y cómo salió el último mail.
create or replace function public.capital_customers(p_limit integer default 200)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
  from (
    select
      c.id,
      c.email::text as email,
      c.nombre,
      c.apellido,
      c.whatsapp,
      c.ciudad,
      c.instagram,
      c.created_at,
      o.status              as orden_status,
      o.payment_verified,
      o.amount_cents,
      o.provider_payment_id,
      e.status              as entitlement,
      (select count(*) from public.page_events pe
         where pe.customer_id = c.id and pe.kind = 'manual_view')     as lecturas,
      (select max(pe.created_at) from public.page_events pe
         where pe.customer_id = c.id and pe.kind = 'manual_view')     as ultima_lectura,
      (select m.status from public.email_events m
         where m.customer_id = c.id order by m.created_at desc limit 1) as ultimo_mail
    from public.customers c
    left join lateral (
      select o2.* from public.orders o2
      where o2.customer_id = c.id
      order by o2.created_at desc
      limit 1
    ) o on true
    left join public.entitlements e on e.customer_id = c.id
    order by c.created_at desc
    limit least(greatest(p_limit, 1), 500)
  ) t;
$$;

revoke all on function public.capital_customers(integer) from public, anon, authenticated;
grant execute on function public.capital_customers(integer) to service_role;

notify pgrst, 'reload schema';
