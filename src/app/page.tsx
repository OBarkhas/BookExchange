import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import HeroSection from "@/components/hero/HeroSection";
import SignedInHome from "@/components/home/SignedInHome";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <HeroSection />;
  }

  const [myListings, activeExchanges, memberCount, recentListings, badges] =
    await Promise.all([
      db.book.count({
        where: { userId: user.id, expiresAt: { gt: new Date() } },
      }),
      db.exchangeRequest.count({
        where: {
          OR: [{ senderId: user.id }, { receiverId: user.id }],
          status: { in: ["PENDING", "ACCEPTED"] },
        },
      }),
      db.user.count(),
      db.book.findMany({
        where: { isAvailable: true, expiresAt: { gt: new Date() } },
        orderBy: { lastBumpedAt: "desc" },
        take: 8,
        include: {
          user: { select: { id: true, name: true, imageUrl: true, district: true } },
        },
      }),
      db.userBadge.findMany({
        where: { userId: user.id },
        orderBy: { awardedAt: "desc" },
      }),
    ]);

  return (
    <SignedInHome
      user={user}
      myListings={myListings}
      activeExchanges={activeExchanges}
      memberCount={memberCount}
      recentListings={recentListings}
      badges={badges}
    />
  );
}
