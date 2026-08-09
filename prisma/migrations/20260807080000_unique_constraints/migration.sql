CREATE UNIQUE INDEX "UserBadge_userId_badgeName_key" ON "UserBadge"("userId", "badgeName");

CREATE UNIQUE INDEX "Review_reviewerId_receiverId_key" ON "Review"("reviewerId", "receiverId");
