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
CREATE OR REPLACE FUNCTION admin.enqueue_search_entity(p_entity_type text, p_entity_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  INSERT INTO admin.search_outbox AS pending
    ("entityType", "entityId", "availableAt", "updatedAt")
  VALUES
    (p_entity_type, p_entity_id, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp())
  ON CONFLICT ("entityType", "entityId") DO UPDATE SET
    "version" = pending."version" + 1,
    "attempts" = 0,
    "lastError" = NULL,
    "availableAt" = pg_catalog.clock_timestamp(),
    "updatedAt" = pg_catalog.clock_timestamp();
$$;
CREATE OR REPLACE FUNCTION admin.capture_search_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  old_id text;
  new_id text;
  affected_id text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_id := OLD."id"::text;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_id := NEW."id"::text;
  END IF;

  FOR affected_id IN
    SELECT DISTINCT candidate
    FROM pg_catalog.unnest(ARRAY[old_id, new_id]) AS ids(candidate)
    WHERE candidate IS NOT NULL
    ORDER BY candidate
  LOOP
    PERFORM admin.enqueue_search_entity(TG_ARGV[0], affected_id);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER products_search_insert_delete
AFTER INSERT OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_entity('product');

CREATE OR REPLACE TRIGGER products_search_update
AFTER UPDATE OF "id", "name", "slug", "description", "isActive", "status", "minPrice"
ON public.products
FOR EACH ROW
WHEN (ROW(OLD."id", OLD."name", OLD."slug", OLD."description", OLD."isActive", OLD."status", OLD."minPrice")
  IS DISTINCT FROM ROW(NEW."id", NEW."name", NEW."slug", NEW."description", NEW."isActive", NEW."status", NEW."minPrice"))
EXECUTE FUNCTION admin.capture_search_entity('product');

CREATE OR REPLACE TRIGGER orders_search_insert_delete
AFTER INSERT OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_entity('order');

CREATE OR REPLACE TRIGGER orders_search_update
AFTER UPDATE OF "id", "checkoutEmail", "status", "totalAmount", "createdAt", "archivedAt"
ON public.orders
FOR EACH ROW
WHEN (ROW(OLD."id", OLD."checkoutEmail", OLD."status", OLD."totalAmount", OLD."createdAt", OLD."archivedAt")
  IS DISTINCT FROM ROW(NEW."id", NEW."checkoutEmail", NEW."status", NEW."totalAmount", NEW."createdAt", NEW."archivedAt"))
EXECUTE FUNCTION admin.capture_search_entity('order');

CREATE OR REPLACE TRIGGER customers_search_insert_delete
AFTER INSERT OR DELETE ON public."user"
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_entity('customer');

CREATE OR REPLACE TRIGGER customers_search_update
AFTER UPDATE OF "id", "name", "email", "image" ON public."user"
FOR EACH ROW
WHEN (ROW(OLD."id", OLD."name", OLD."email", OLD."image")
  IS DISTINCT FROM ROW(NEW."id", NEW."name", NEW."email", NEW."image"))
EXECUTE FUNCTION admin.capture_search_entity('customer');

CREATE OR REPLACE TRIGGER staff_search_insert_delete
AFTER INSERT OR DELETE ON admin.admin_user
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_entity('staff');

CREATE OR REPLACE TRIGGER staff_search_update
AFTER UPDATE OF "id", "name", "email", "image", "role", "banned" ON admin.admin_user
FOR EACH ROW
WHEN (ROW(OLD."id", OLD."name", OLD."email", OLD."image", OLD."role", OLD."banned")
  IS DISTINCT FROM ROW(NEW."id", NEW."name", NEW."email", NEW."image", NEW."role", NEW."banned"))
EXECUTE FUNCTION admin.capture_search_entity('staff');
CREATE OR REPLACE FUNCTION admin.capture_search_product_dependency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  old_parent uuid;
  new_parent uuid;
  affected_id uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_parent := OLD."productId";
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_parent := NEW."productId";
  END IF;

  FOR affected_id IN
    SELECT DISTINCT candidate
    FROM pg_catalog.unnest(ARRAY[old_parent, new_parent]) AS ids(candidate)
    WHERE candidate IS NOT NULL
    ORDER BY candidate
  LOOP
    PERFORM admin.enqueue_search_entity('product', affected_id::text);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER images_search_insert_delete
AFTER INSERT OR DELETE ON public.images
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_product_dependency();

CREATE OR REPLACE TRIGGER images_search_update
AFTER UPDATE OF "id", "productId", "url", "order" ON public.images
FOR EACH ROW
WHEN (ROW(OLD."id", OLD."productId", OLD."url", OLD."order")
  IS DISTINCT FROM ROW(NEW."id", NEW."productId", NEW."url", NEW."order"))
EXECUTE FUNCTION admin.capture_search_product_dependency();

CREATE OR REPLACE TRIGGER variants_search_insert_delete
AFTER INSERT OR DELETE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_product_dependency();

CREATE OR REPLACE TRIGGER variants_search_update
AFTER UPDATE OF "productId", "sku", "isActive" ON public.product_variants
FOR EACH ROW
WHEN (ROW(OLD."productId", OLD."sku", OLD."isActive")
  IS DISTINCT FROM ROW(NEW."productId", NEW."sku", NEW."isActive"))
EXECUTE FUNCTION admin.capture_search_product_dependency();

CREATE OR REPLACE TRIGGER product_categories_search_insert_delete
AFTER INSERT OR DELETE ON public.product_categories
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_product_dependency();

CREATE OR REPLACE TRIGGER product_categories_search_update
AFTER UPDATE OF "productId", "categoryId" ON public.product_categories
FOR EACH ROW
WHEN (ROW(OLD."productId", OLD."categoryId")
  IS DISTINCT FROM ROW(NEW."productId", NEW."categoryId"))
EXECUTE FUNCTION admin.capture_search_product_dependency();
CREATE OR REPLACE FUNCTION admin.enqueue_search_category_products(p_category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  affected_id uuid;
BEGIN
  FOR affected_id IN
    SELECT DISTINCT association."productId"
    FROM public.product_categories AS association
    WHERE association."categoryId" = p_category_id
    ORDER BY association."productId"
  LOOP
    PERFORM admin.enqueue_search_entity('product', affected_id::text);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION admin.capture_search_category_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD."id" IS DISTINCT FROM NEW."id" THEN
      PERFORM admin.enqueue_search_entity('category', OLD."id"::text);
    END IF;

    IF ROW(OLD."id", OLD."name", OLD."isActive")
      IS DISTINCT FROM ROW(NEW."id", NEW."name", NEW."isActive") THEN
      PERFORM admin.enqueue_search_category_products(OLD."id");
      IF OLD."id" IS DISTINCT FROM NEW."id" THEN
        PERFORM admin.enqueue_search_category_products(NEW."id");
      END IF;
    END IF;
  END IF;

  PERFORM admin.enqueue_search_entity('category', NEW."id"::text);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION admin.capture_search_category_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  PERFORM admin.enqueue_search_category_products(OLD."id");
  PERFORM admin.enqueue_search_entity('category', OLD."id"::text);
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER categories_search_insert
AFTER INSERT ON public.categories
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_category_change();

CREATE OR REPLACE TRIGGER categories_search_update
AFTER UPDATE OF "id", "name", "slug", "description", "isActive" ON public.categories
FOR EACH ROW
WHEN (ROW(OLD."id", OLD."name", OLD."slug", OLD."description", OLD."isActive")
  IS DISTINCT FROM ROW(NEW."id", NEW."name", NEW."slug", NEW."description", NEW."isActive"))
EXECUTE FUNCTION admin.capture_search_category_change();

CREATE OR REPLACE TRIGGER categories_search_delete
BEFORE DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION admin.capture_search_category_delete();
ALTER FUNCTION admin.enqueue_search_entity(text, text) OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_entity() OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_product_dependency() OWNER TO search_outbox_writer;
ALTER FUNCTION admin.enqueue_search_category_products(uuid) OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_category_change() OWNER TO search_outbox_writer;
ALTER FUNCTION admin.capture_search_category_delete() OWNER TO search_outbox_writer;

REVOKE ALL ON FUNCTION admin.enqueue_search_entity(text, text)
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_entity()
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_product_dependency()
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.enqueue_search_category_products(uuid)
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_category_change()
FROM PUBLIC, client_app, admin_app, search_worker;
REVOKE ALL ON FUNCTION admin.capture_search_category_delete()
FROM PUBLIC, client_app, admin_app, search_worker;
