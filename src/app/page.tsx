import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { buildFeed } from "@/lib/feed";
import HeroSection from "@/components/hero/HeroSection";
import SignedInHome from "@/components/home/SignedInHome";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <HeroSection />;
  }

  const [myListings, activeExchanges, memberCount, recentListings, recentPosts] =
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
        take: 12,
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          condition: true,
          listingType: true,
          price: true,
          images: true,
          lastBumpedAt: true,
          user: {
            select: { id: true, name: true, imageUrl: true, district: true },
          },
        },
      }),
      db.communityPost.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          category: true,
          createdAt: true,
          user: { select: { id: true, name: true, imageUrl: true } },
        },
      }),
    ]);

  const feed = buildFeed(recentListings, recentPosts, 12);

  return (
    <SignedInHome
      user={user}
      myListings={myListings}
      activeExchanges={activeExchanges}
      memberCount={memberCount}
      feed={feed}
    />
  );
}
