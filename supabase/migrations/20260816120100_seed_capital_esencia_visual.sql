-- Seed del primer infoproducto. Idempotente.

insert into public.products (slug, name, price_cents, currency, access_path, is_active)
values (
  'capital-esencia-visual',
  'Capital de Esencia Visual',
  1999900,
  'ARS',
  '/capital-esencia-visual/manual',
  true
)
on conflict (slug) do update
set name        = excluded.name,
    price_cents = excluded.price_cents,
    currency    = excluded.currency,
    access_path = excluded.access_path,
    is_active   = excluded.is_active;
