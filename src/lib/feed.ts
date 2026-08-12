import type { BookCardBook } from "@/components/books/BookCard";

export interface FeedPost {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  category: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; imageUrl: string | null };
}

export type FeedItem =
  | { type: "book"; book: BookCardBook }
  | { type: "post"; post: FeedPost };

export function buildFeed(
  books: BookCardBook[],
  posts: FeedPost[],
  limit = 12,
): FeedItem[] {
  const items: FeedItem[] = [
    ...books.map((book) => ({ type: "book" as const, book })),
    ...posts.map((post) => ({ type: "post" as const, post })),
  ];
  return items
    .sort((a, b) => {
      const dateA =
        a.type === "book"
          ? new Date(a.book.lastBumpedAt).getTime()
          : new Date(a.post.createdAt).getTime();
      const dateB =
        b.type === "book"
          ? new Date(b.book.lastBumpedAt).getTime()
          : new Date(b.post.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}
