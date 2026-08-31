-- Una sola cortesía pagada por persona y producto. Sin esto, un doble clic
-- en el panel insertaba dos órdenes y mandaba dos avisos de venta.

create unique index if not exists orders_one_paid_cortesia_per_customer_product
  on public.orders (customer_id, product_id)
  where provider = 'cortesia' and status = 'paid';
