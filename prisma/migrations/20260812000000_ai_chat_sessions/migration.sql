-- CreateTable
CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

-- AddColumn (nullable first so we can backfill existing messages)
ALTER TABLE "AiChatMessage" ADD COLUMN "sessionId" TEXT;

-- Backfill: create one session per user that already has chat history,
-- titled from their first user message so nothing is lost.
INSERT INTO "AiChatSession" ("id", "title", "userId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    COALESCE(
        (SELECT LEFT(m2."content", 40)
         FROM "AiChatMessage" m2
         WHERE m2."userId" = m1."userId" AND m2."role" = 'user'
         ORDER BY m2."createdAt" ASC
         LIMIT 1),
        'Chat history'
    ),
    m1."userId",
    MIN(m1."createdAt"),
    MAX(m1."createdAt")
FROM "AiChatMessage" m1
GROUP BY m1."userId";

-- Assign every message to its user's session
UPDATE "AiChatMessage" m
SET "sessionId" = s."id"
FROM "AiChatSession" s
WHERE s."userId" = m."userId";

-- Make it required now that every row is backfilled
ALTER TABLE "AiChatMessage" ALTER COLUMN "sessionId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AiChatMessage_sessionId_createdAt_idx" ON "AiChatMessage"("sessionId", "createdAt");
CREATE INDEX "AiChatMessage_userId_idx" ON "AiChatMessage"("userId");
CREATE INDEX "AiChatSession_userId_updatedAt_idx" ON "AiChatSession"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
