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
