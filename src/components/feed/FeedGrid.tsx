import type { FeedItem } from "@/lib/feed";
import BookCard from "@/components/books/BookCard";
import PostCard from "@/components/feed/PostCard";

export default function FeedGrid({ items }: { items: FeedItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) =>
        item.type === "book" ? (
          <BookCard key={item.book.id} book={item.book} />
        ) : (
          <PostCard key={item.post.id} post={item.post} />
        ),
      )}
    </div>
  );
}
