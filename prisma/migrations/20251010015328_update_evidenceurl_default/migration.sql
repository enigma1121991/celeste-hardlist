/*
  Warnings:

  - Made the column `evidenceUrl` on table `Run` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Map_stars_idx";

-- AlterTable
ALTER TABLE "Map" ALTER COLUMN "stars" DROP NOT NULL,
ALTER COLUMN "gmColor" DROP NOT NULL,
ALTER COLUMN "gmTier" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Run" ALTER COLUMN "evidenceUrl" SET NOT NULL,
ALTER COLUMN "evidenceUrl" SET DEFAULT '';
