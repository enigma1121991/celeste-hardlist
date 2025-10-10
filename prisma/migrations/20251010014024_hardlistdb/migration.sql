-- CreateEnum
CREATE TYPE "GmColor" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "GmTier" AS ENUM ('GM1', 'GM2', 'GM3');

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('FULL_CLEAR_VIDEO', 'FULL_CLEAR', 'CLEAR_VIDEO', 'CLEAR', 'FULL_CLEAR_GB', 'CLEAR_GB', 'CREATOR_CLEAR', 'ALL_DEATHLESS_SEGMENTS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "youtubeUrl" TEXT,
    "twitchUrl" TEXT,
    "discordHandle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "gmColor" "GmColor" NOT NULL,
    "gmTier" "GmTier" NOT NULL,
    "lowDeathRecord" INTEGER,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "RunType" NOT NULL,
    "evidenceUrl" TEXT,
    "deaths" INTEGER,
    "verifiedStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_handle_key" ON "Player"("handle");

-- CreateIndex
CREATE INDEX "Player_handle_idx" ON "Player"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_name_key" ON "CreatorProfile"("name");

-- CreateIndex
CREATE INDEX "CreatorProfile_name_idx" ON "CreatorProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Map_slug_key" ON "Map"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Map_name_key" ON "Map"("name");

-- CreateIndex
CREATE INDEX "Map_slug_idx" ON "Map"("slug");

-- CreateIndex
CREATE INDEX "Map_name_idx" ON "Map"("name");

-- CreateIndex
CREATE INDEX "Map_creatorId_idx" ON "Map"("creatorId");

-- CreateIndex
CREATE INDEX "Map_stars_idx" ON "Map"("stars");

-- CreateIndex
CREATE INDEX "Run_mapId_idx" ON "Run"("mapId");

-- CreateIndex
CREATE INDEX "Run_playerId_idx" ON "Run"("playerId");

-- CreateIndex
CREATE INDEX "Run_type_idx" ON "Run"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Run_mapId_playerId_type_evidenceUrl_key" ON "Run"("mapId", "playerId", "type", "evidenceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_sha256_key" ON "Snapshot"("sha256");

-- CreateIndex
CREATE INDEX "Snapshot_sha256_idx" ON "Snapshot"("sha256");

-- CreateIndex
CREATE INDEX "Snapshot_capturedAt_idx" ON "Snapshot"("capturedAt");

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
