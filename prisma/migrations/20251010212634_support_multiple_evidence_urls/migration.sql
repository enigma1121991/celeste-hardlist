/*
  Warnings:

  - You are about to drop the column `evidenceUrl` on the `Run` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mapId,playerId,type]` on the table `Run` will be added. If there are existing duplicate values, this will fail.

*/

-- Step 1: Add new evidenceUrls column as TEXT[]
ALTER TABLE "Run" ADD COLUMN IF NOT EXISTS "evidenceUrls" TEXT[] NOT NULL DEFAULT '{}';

-- Step 2: Migrate data from evidenceUrl to evidenceUrls (wrap single URL in array)
UPDATE "Run" 
SET "evidenceUrls" = CASE 
  WHEN "evidenceUrl" = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["evidenceUrl"]
END
WHERE "evidenceUrl" IS NOT NULL;

-- Step 3: Drop the old unique constraint that included evidenceUrl (if it exists)
ALTER TABLE "Run" DROP CONSTRAINT IF EXISTS "Run_mapId_playerId_type_evidenceUrl_key";

-- Step 4: Create new unique constraint without evidenceUrl (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Run_mapId_playerId_type_key'
  ) THEN
    CREATE UNIQUE INDEX "Run_mapId_playerId_type_key" ON "Run"("mapId", "playerId", "type");
  END IF;
END $$;

-- Step 5: Drop the old evidenceUrl column
ALTER TABLE "Run" DROP COLUMN IF EXISTS "evidenceUrl";

