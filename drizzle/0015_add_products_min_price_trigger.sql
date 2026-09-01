-- Custom SQL migration file, put your code below! --

-- Recomputes products."minPrice" (cheapest in-stock variant price) whenever
-- a variant's price/stock/productId changes
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
  )
  WHERE "id" = affected_id;

  IF TG_OP = 'UPDATE' AND OLD."productId" IS DISTINCT FROM NEW."productId" THEN
    UPDATE "products"
    SET "minPrice" = (
      SELECT min("price")
      FROM "product_variants"
      WHERE "productId" = OLD."productId"
        AND "stock" > 0
    )
    WHERE "id" = OLD."productId";
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER product_variants_sync_min_price
AFTER INSERT OR DELETE OR UPDATE OF "price", "stock", "productId"
ON "product_variants"
FOR EACH ROW
EXECUTE FUNCTION sync_product_min_price();

-- One-time backfill for variants that already exist before this trigger did.
UPDATE "products" p
SET "minPrice" = sub.min_price
FROM (
  SELECT "productId", min("price") AS min_price
  FROM "product_variants"
  WHERE "stock" > 0
  GROUP BY "productId"
) sub
WHERE p."id" = sub."productId";
