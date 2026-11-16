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
