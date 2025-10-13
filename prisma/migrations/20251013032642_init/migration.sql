DO $$
BEGIN
  CREATE TYPE "GmColor" AS ENUM ('GREEN','YELLOW','RED');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "GmTier" AS ENUM ('GM1','GM2','GM3');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "RunType" AS ENUM ('FULL_CLEAR_VIDEO','FULL_CLEAR','CLEAR_VIDEO','CLEAR','FULL_CLEAR_GB','CLEAR_GB','CREATOR_CLEAR','ALL_DEATHLESS_SEGMENTS','UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('PENDING','VERIFIED','DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER','VERIFIER','MOD','ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "ProposalType" AS ENUM ('MAP_DIFFICULTY','ADD_MAP','CHANGE_RULE','WEBSITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "ProposalStatus" AS ENUM ('PENDING','ACCEPTED','REJECTED_VETOED','REJECTED_VOTES');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "VoteType" AS ENUM ('YES','NO','ABSTAIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "Player" (
  "id" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "youtubeUrl" TEXT,
  "twitchUrl" TEXT,
  "discordHandle" TEXT,
  "bio" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreatorProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Map" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "stars" INTEGER,
  "gmColor" "GmColor",
  "gmTier" "GmTier",
  "lowDeathRecord" INTEGER,
  "canonicalVideoUrl" TEXT,
  "tags" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Run" (
  "id" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "type" "RunType" NOT NULL,
  "evidenceUrls" TEXT[],
  "submitterNotes" TEXT,
  "deaths" INTEGER,
  "verifiedStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "submittedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Snapshot" (
  "id" TEXT NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceUrl" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "discordId" TEXT,
  "discordUsername" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerClaim" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
  "claimToken" TEXT NOT NULL,
  "approvedBy" TEXT,
  "rejectedBy" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlayerClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationAction" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "verifierId" TEXT,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Proposal" (
  "id" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "type" "ProposalType" NOT NULL,
  "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "proposalData" JSONB NOT NULL,
  "closedById" TEXT,
  "closedReason" TEXT,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProposalVote" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vote" "VoteType" NOT NULL,
  "hasCleared" BOOLEAN NOT NULL DEFAULT false,
  "forceHighlight" BOOLEAN NOT NULL DEFAULT false,
  "reasoning" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProposalVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProposalComment" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentId" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProposalComment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Player_handle_key" ON "Player"("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "Player_userId_key" ON "Player"("userId");
CREATE INDEX IF NOT EXISTS "Player_handle_idx" ON "Player"("handle");
CREATE INDEX IF NOT EXISTS "Player_userId_idx" ON "Player"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "CreatorProfile_name_key" ON "CreatorProfile"("name");
CREATE INDEX IF NOT EXISTS "CreatorProfile_name_idx" ON "CreatorProfile"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "Map_slug_key" ON "Map"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Map_name_key" ON "Map"("name");
CREATE INDEX IF NOT EXISTS "Map_slug_idx" ON "Map"("slug");
CREATE INDEX IF NOT EXISTS "Map_name_idx" ON "Map"("name");
CREATE INDEX IF NOT EXISTS "Map_creatorId_idx" ON "Map"("creatorId");

CREATE INDEX IF NOT EXISTS "Run_mapId_idx" ON "Run"("mapId");
CREATE INDEX IF NOT EXISTS "Run_playerId_idx" ON "Run"("playerId");
CREATE INDEX IF NOT EXISTS "Run_type_idx" ON "Run"("type");
CREATE INDEX IF NOT EXISTS "Run_verifiedStatus_idx" ON "Run"("verifiedStatus");
CREATE INDEX IF NOT EXISTS "Run_submittedById_idx" ON "Run"("submittedById");
CREATE UNIQUE INDEX IF NOT EXISTS "Run_mapId_playerId_type_key" ON "Run"("mapId","playerId","type");

CREATE UNIQUE INDEX IF NOT EXISTS "Snapshot_sha256_key" ON "Snapshot"("sha256");
CREATE INDEX IF NOT EXISTS "Snapshot_sha256_idx" ON "Snapshot"("sha256");
CREATE INDEX IF NOT EXISTS "Snapshot_capturedAt_idx" ON "Snapshot"("capturedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_discordId_key" ON "User"("discordId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_discordId_idx" ON "User"("discordId");

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider","providerAccountId");

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "PlayerClaim_claimToken_key" ON "PlayerClaim"("claimToken");
CREATE INDEX IF NOT EXISTS "PlayerClaim_userId_idx" ON "PlayerClaim"("userId");
CREATE INDEX IF NOT EXISTS "PlayerClaim_playerId_idx" ON "PlayerClaim"("playerId");
CREATE INDEX IF NOT EXISTS "PlayerClaim_status_idx" ON "PlayerClaim"("status");
CREATE INDEX IF NOT EXISTS "PlayerClaim_claimToken_idx" ON "PlayerClaim"("claimToken");

CREATE INDEX IF NOT EXISTS "VerificationAction_runId_idx" ON "VerificationAction"("runId");
CREATE INDEX IF NOT EXISTS "VerificationAction_verifierId_idx" ON "VerificationAction"("verifierId");
CREATE INDEX IF NOT EXISTS "VerificationAction_createdAt_idx" ON "VerificationAction"("createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX IF NOT EXISTS "Proposal_createdById_idx" ON "Proposal"("createdById");
CREATE INDEX IF NOT EXISTS "Proposal_type_idx" ON "Proposal"("type");
CREATE INDEX IF NOT EXISTS "Proposal_status_idx" ON "Proposal"("status");
CREATE INDEX IF NOT EXISTS "Proposal_createdAt_idx" ON "Proposal"("createdAt");

CREATE INDEX IF NOT EXISTS "ProposalVote_proposalId_idx" ON "ProposalVote"("proposalId");
CREATE INDEX IF NOT EXISTS "ProposalVote_userId_idx" ON "ProposalVote"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProposalVote_proposalId_userId_key" ON "ProposalVote"("proposalId","userId");

CREATE INDEX IF NOT EXISTS "ProposalComment_proposalId_idx" ON "ProposalComment"("proposalId");
CREATE INDEX IF NOT EXISTS "ProposalComment_userId_idx" ON "ProposalComment"("userId");
CREATE INDEX IF NOT EXISTS "ProposalComment_parentId_idx" ON "ProposalComment"("parentId");
CREATE INDEX IF NOT EXISTS "ProposalComment_createdAt_idx" ON "ProposalComment"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'Player_userId_fkey'
  ) THEN
    ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Map_creatorId_fkey') THEN
    ALTER TABLE "Map" ADD CONSTRAINT "Map_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Run_mapId_fkey') THEN
    ALTER TABLE "Run" ADD CONSTRAINT "Run_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Run_playerId_fkey') THEN
    ALTER TABLE "Run" ADD CONSTRAINT "Run_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Run_submittedById_fkey') THEN
    ALTER TABLE "Run" ADD CONSTRAINT "Run_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Account_userId_fkey') THEN
    ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Session_userId_fkey') THEN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerClaim_userId_fkey') THEN
    ALTER TABLE "PlayerClaim" ADD CONSTRAINT "PlayerClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerClaim_playerId_fkey') THEN
    ALTER TABLE "PlayerClaim" ADD CONSTRAINT "PlayerClaim_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VerificationAction_runId_fkey') THEN
    ALTER TABLE "VerificationAction" ADD CONSTRAINT "VerificationAction_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VerificationAction_verifierId_fkey') THEN
    ALTER TABLE "VerificationAction" ADD CONSTRAINT "VerificationAction_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Proposal_createdById_fkey') THEN
    ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Proposal_closedById_fkey') THEN
    ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalVote_proposalId_fkey') THEN
    ALTER TABLE "ProposalVote" ADD CONSTRAINT "ProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalVote_userId_fkey') THEN
    ALTER TABLE "ProposalVote" ADD CONSTRAINT "ProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalComment_proposalId_fkey') THEN
    ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalComment_userId_fkey') THEN
    ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProposalComment_parentId_fkey') THEN
    ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProposalComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
