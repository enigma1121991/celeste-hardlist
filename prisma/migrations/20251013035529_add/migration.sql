/*
  Warnings:

  - The values [CREATOR__FULL_CLEAR] on the enum `RunType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RunType_new" AS ENUM ('FULL_CLEAR_VIDEO', 'FULL_CLEAR', 'CLEAR_VIDEO', 'CLEAR', 'FULL_CLEAR_GB', 'CLEAR_GB', 'CREATOR_CLEAR', 'CREATOR_FULL_CLEAR', 'CREATOR_GOLDEN', 'CREATOR_FULL_CLEAR_GOLDEN', 'ALL_DEATHLESS_SEGMENTS', 'UNKNOWN');
ALTER TABLE "Run" ALTER COLUMN "type" TYPE "RunType_new" USING ("type"::text::"RunType_new");
ALTER TYPE "RunType" RENAME TO "RunType_old";
ALTER TYPE "RunType_new" RENAME TO "RunType";
DROP TYPE "public"."RunType_old";
COMMIT;
