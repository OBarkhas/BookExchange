"use client";

import { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import {
  addWishlist as addWishlistEntry,
  removeWishlist as deleteWishlistEntry,
} from "@/actions/shelf";
import type { Wishlist } from "@/generated/prisma/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/ToastContainer";

export type WishlistItem = Pick<Wishlist, "id" | "title" | "author">;

export default function WishlistSection({
  initialWishlist,
}: {
  initialWishlist: WishlistItem[];
}) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(initialWishlist);
  const [wishTitle, setWishTitle] = useState("");
  const [wishAuthor, setWishAuthor] = useState("");

  const addWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishTitle.trim()) return;
    try {
      const { item } = await addWishlistEntry(wishTitle, wishAuthor);
      setWishlist((prev) => [item, ...prev]);
      setWishTitle("");
      setWishAuthor("");
      showToast("Added to your wishlist!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add", "error");
    }
  };

  const removeWish = async (id: string) => {
    try {
      await deleteWishlistEntry(id);
      setWishlist((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove", "error");
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900">Wishlist</h2>
          <p className="text-xs text-stone-400">
            Books you&apos;re hunting for on the marketplace
          </p>
        </div>
      </div>

      <form onSubmit={addWish} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          name="wishTitle"
          placeholder="Book you're looking for…"
          value={wishTitle}
          onChange={(e) => setWishTitle(e.target.value)}
          className="flex-1"
        />
        <Input
          name="wishAuthor"
          placeholder="Author (optional)"
          value={wishAuthor}
          onChange={(e) => setWishAuthor(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!wishTitle.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {wishlist.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nothing on your wishlist"
          description="Tell the community what you're hunting for — your next favorite read might be listed."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white/85 px-4 py-3 shadow-sm transition-colors hover:border-amber-300"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {item.title}
                </p>
                {item.author && (
                  <p className="truncate text-xs text-stone-400">
                    {item.author}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeWish(item.id)}
                aria-label="Remove from wishlist"
                className="rounded-lg p-1.5 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
