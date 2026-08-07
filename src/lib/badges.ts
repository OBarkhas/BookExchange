import { db } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export const BADGES = {
  FIRST_LISTING: {
    name: "First Listing",
    icon: "📚",
    description: "Listed your first book",
  },
  LIBRARIAN: {
    name: "Librarian",
    icon: "🏛️",
    description: "Listed 5+ books on BookLoop",
  },
  FIRST_SWAP: {
    name: "First Swap",
    icon: "🔄",
    description: "Completed your first exchange",
  },
  EXCHANGE_EXPERT: {
    name: "Exchange Expert",
    icon: "🤝",
    description: "Completed 3+ exchanges",
  },
  TRUSTED_READER: {
    name: "Trusted Reader",
    icon: "⭐",
    description: "Received 3+ reviews with a 4.5★ average",
  },
  EVENT_HOST: {
    name: "Event Host",
    icon: "🎪",
    description: "Hosted your first book swap meet",
  },
  BOOKWORM: {
    name: "Bookworm",
    icon: "🐛",
    description: "Added 5+ books to your shelf",
  },
} as const;

export type BadgeKey = keyof typeof BADGES;

export const BADGE_ORDER: BadgeKey[] = [
  "FIRST_LISTING",
  "LIBRARIAN",
  "FIRST_SWAP",
  "EXCHANGE_EXPERT",
  "TRUSTED_READER",
  "EVENT_HOST",
  "BOOKWORM",
];

/**
 * Recalculates the user's badge eligibility and awards any newly earned
 * badges (each with a notification). Safe to call after any activity.
 */
export async function checkAndAwardBadges(userId: string) {
  const [listingCount, completedCount, reviewResult, eventCount, shelfCount, existingBadges] =
    await Promise.all([
      db.book.count({ where: { userId } }),
      db.exchangeRequest.count({
        where: { OR: [{ senderId: userId }, { receiverId: userId }], status: "COMPLETED" },
      }),
      db.review.aggregate({
        where: { receiverId: userId },
        _count: true,
        _avg: { rating: true },
      }),
      db.event.count({ where: { organizerId: userId } }),
      db.userBookShelf.count({ where: { userId } }),
      db.userBadge.findMany({
        where: { userId },
        select: { badgeName: true },
      }),
    ]);

  const owned = new Set(existingBadges.map((b) => b.badgeName));
  const earned: BadgeKey[] = [];

  if (listingCount >= 1) earned.push("FIRST_LISTING");
  if (listingCount >= 5) earned.push("LIBRARIAN");
  if (completedCount >= 1) earned.push("FIRST_SWAP");
  if (completedCount >= 3) earned.push("EXCHANGE_EXPERT");
  if (reviewResult._count >= 3 && (reviewResult._avg.rating ?? 0) >= 4.5) {
    earned.push("TRUSTED_READER");
  }
  if (eventCount >= 1) earned.push("EVENT_HOST");
  if (shelfCount >= 5) earned.push("BOOKWORM");

  for (const key of earned) {
    const badge = BADGES[key];
    if (owned.has(badge.name)) continue;
    // Upsert keeps badge rows unique even when concurrent actions race.
    await db.userBadge.upsert({
      where: { userId_badgeName: { userId, badgeName: badge.name } },
      create: { userId, badgeName: badge.name, icon: badge.icon },
      update: {},
    });
    await createNotification(
      userId,
      "You earned a badge! 🏅",
      `You unlocked the "${badge.name}" badge ${badge.icon}`,
      `/profile/${userId}`,
    );
  }
}
