CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'REQUEST',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "category" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

CREATE INDEX "CommunityPost_kind_idx" ON "CommunityPost"("kind");

CREATE INDEX "CommunityPost_userId_idx" ON "CommunityPost"("userId");

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
