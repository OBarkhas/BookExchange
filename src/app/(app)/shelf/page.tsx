import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import ShelfManager from "@/components/shelf/ShelfManager";

export default async function ShelfPage() {
  const user = await getDbUser();

  const [shelf, wishlist] = await Promise.all([
    db.userBookShelf.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
    }),
    db.wishlist.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
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
