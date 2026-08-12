import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";

const ShelfManager = dynamic(
  () => import("@/components/shelf/ShelfManager"),
  {
    loading: () => (
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-amber-100/50" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl bg-amber-100/40"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-amber-100/50" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-amber-100/40"
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
);

export default async function ShelfPage() {
  const user = await getDbUser();

  const [shelf, wishlist] = await Promise.all([
    db.userBookShelf.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, author: true, status: true, rating: true },
    }),
    db.wishlist.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, author: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="My Shelf"
        subtitle="Your reading journey — track, rate, and swap your books."
      />
      <ShelfManager initialShelf={shelf} initialWishlist={wishlist} />
    </div>
  );
}
