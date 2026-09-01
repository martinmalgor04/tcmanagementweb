-- Idempotencia de la entrega en la base, no en el código.
--
-- deliverAccess decidía con un SELECT y recién después insertaba: dos entregas
-- simultáneas (formulario de /gracias y webhook) pasaban las dos el chequeo,
-- mandaban dos mails, y la segunda revocaba el token de la primera. El índice
-- convierte esa carrera en un 409 que el código ya sabe tratar.
--
-- Parcial a propósito: los reenvíos van con order_id nulo y no deben chocar, y
-- un envío 'failed' tiene que poder reintentarse.
create unique index if not exists email_events_one_access_per_order
  on public.email_events (order_id, template)
  where order_id is not null and status in ('queued', 'sent');
