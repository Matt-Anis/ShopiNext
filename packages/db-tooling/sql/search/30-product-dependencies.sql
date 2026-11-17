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
