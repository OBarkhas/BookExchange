"use client";

import type { ShelfItem } from "./ShelfSection";
import type { WishlistItem } from "./WishlistSection";
import ShelfSection from "./ShelfSection";
import WishlistSection from "./WishlistSection";

interface ShelfManagerProps {
  initialShelf: ShelfItem[];
  initialWishlist: WishlistItem[];
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
