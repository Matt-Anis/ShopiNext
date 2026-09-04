-- Custom SQL migration file, put your code below! --

-- Extend the min-price sync (0015_add_products_min_price_trigger.sql) to
-- react to isActive changes too, and exclude inactive variants from the
-- min-price calculation.
CREATE OR REPLACE FUNCTION sync_product_min_price()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  affected_id uuid;
BEGIN
  affected_id := COALESCE(NEW."productId", OLD."productId");

  UPDATE "products"
  SET "minPrice" = (
    SELECT min("price")
    FROM "product_variants"
    WHERE "productId" = affected_id
      AND "stock" > 0
      AND "isActive"
  )
  WHERE "id" = affected_id;

  IF TG_OP = 'UPDATE' AND OLD."productId" IS DISTINCT FROM NEW."productId" THEN
    UPDATE "products"
    SET "minPrice" = (
      SELECT min("price")
      FROM "product_variants"
      WHERE "productId" = OLD."productId"
        AND "stock" > 0
        AND "isActive"
    )
    WHERE "id" = OLD."productId";
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_sync_min_price ON "product_variants";

CREATE TRIGGER product_variants_sync_min_price
AFTER INSERT OR DELETE OR UPDATE OF "price", "stock", "productId", "isActive"
ON "product_variants"
FOR EACH ROW
EXECUTE FUNCTION sync_product_min_price();

-- Cascade product deactivation down to its variants. One-directional only:
-- deactivating a product deactivates its (still-active) variants, but
-- reactivating a product does NOT resurrect variants that were separately
-- deactivated beforehand.
CREATE OR REPLACE FUNCTION cascade_product_deactivation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "product_variants"
  SET "isActive" = false
  WHERE "productId" = NEW."id"
    AND "isActive" = true;

  RETURN NULL;
END;
$$;

CREATE TRIGGER products_cascade_deactivation
AFTER UPDATE OF "isActive" ON "products"
FOR EACH ROW
WHEN (NEW."isActive" = false AND OLD."isActive" = true)
EXECUTE FUNCTION cascade_product_deactivation();
