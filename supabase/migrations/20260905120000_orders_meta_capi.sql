-- Idempotencia del Purchase hacia Meta (Conversions API), en la base.
--
-- El webhook de Mercado Pago reintenta, y el formulario de /gracias puede
-- correr en paralelo: los dos verían la misma orden paga y mandarían el
-- evento dos veces. El código reclama la columna con un UPDATE condicional
-- (`meta_capi_sent_at is null`) antes de llamar a Meta; si el envío falla la
-- vuelve a null para que el siguiente reintento lo tome.
--
-- Meta también deduplica por event_id, pero eso es defensa en profundidad:
-- acá queda registrado qué ventas efectivamente se reportaron.
alter table public.orders
  add column if not exists meta_capi_sent_at timestamptz;

comment on column public.orders.meta_capi_sent_at is
  'Momento en que el Purchase se mandó a Meta Conversions API. NULL = todavía no (o falló y se reintenta).';

notify pgrst, 'reload schema';
