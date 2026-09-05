-- Custom SQL migration file, put your code below! --

-- Backfill products that existed before the status column was added:
-- they were already fully published, not mid-wizard drafts.
UPDATE "products" SET "status" = 'active' WHERE "status" = 'draft';