"use client";

import type { UserBookShelf, Wishlist } from "@/generated/prisma/client";
import ShelfSection from "./ShelfSection";
import WishlistSection from "./WishlistSection";

interface ShelfManagerProps {
  initialShelf: UserBookShelf[];
  initialWishlist: Wishlist[];
}

export default function ShelfManager({
  initialShelf,
  initialWishlist,
}: ShelfManagerProps) {
  return (
    <div className="space-y-10">
      <ShelfSection initialShelf={initialShelf} />
      <WishlistSection initialWishlist={initialWishlist} />
    </div>
  );
}
