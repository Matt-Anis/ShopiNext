DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'search_outbox_writer') THEN
    CREATE ROLE search_outbox_writer NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'search_worker') THEN
    CREATE ROLE search_worker LOGIN NOINHERIT;
  END IF;
END;
$$;

REVOKE ALL ON TABLE
  admin.search_outbox, admin.search_sync_runs, admin.search_sync_leases
FROM PUBLIC, client_app, admin_app;

GRANT USAGE ON SCHEMA public, admin TO search_outbox_writer, search_worker;
GRANT SELECT, INSERT, UPDATE ON TABLE admin.search_outbox TO search_outbox_writer;
GRANT SELECT ("productId", "categoryId") ON TABLE public.product_categories TO search_outbox_writer;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  admin.search_outbox, admin.search_sync_runs, admin.search_sync_leases
TO search_worker;

GRANT SELECT ON TABLE
  public.products, public.categories, public.product_categories,
  public.images, public.product_variants
TO search_worker;
GRANT SELECT ("id", "checkoutEmail", "status", "totalAmount", "createdAt", "archivedAt")
ON TABLE public.orders TO search_worker;
GRANT SELECT ("id", "name", "email", "image")
ON TABLE public."user" TO search_worker;
GRANT SELECT ("id", "name", "email", "image", "role", "banned")
ON TABLE admin.admin_user TO search_worker;
