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
