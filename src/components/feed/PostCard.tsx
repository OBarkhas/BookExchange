import Link from "next/link";
import { MessageCircle } from "lucide-react";
import {
  POST_KIND_COLORS,
  POST_KIND_LABELS,
  POST_KINDS,
  type PostKind,
} from "@/lib/categories";
import { timeAgo } from "@/lib/utils";
import type { FeedPost } from "@/lib/feed";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";

export default function PostCard({ post }: { post: FeedPost }) {
  const kind: PostKind = POST_KINDS.includes(post.kind as PostKind)
    ? (post.kind as PostKind)
    : "REQUEST";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/90 shadow-sm shadow-amber-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10">
      <Link
        href={`/profile/${post.user.id}`}
        className="flex items-center justify-between gap-2 border-b border-amber-50 bg-gradient-to-r from-amber-50/60 to-transparent px-4 py-3"
      >
        <StatusBadge
          label={POST_KIND_LABELS[kind]}
          className={POST_KIND_COLORS[kind]}
        />
        <span className="flex items-center gap-1 text-[11px] text-stone-400">
          <MessageCircle className="h-3 w-3" />
          {timeAgo(post.createdAt)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/profile/${post.user.id}`}
          className="line-clamp-2 font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-amber-700"
        >
          {post.title}
        </Link>
        {post.body && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
            {post.body}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Link
            href={`/profile/${post.user.id}`}
            className="flex min-w-0 items-center gap-2 rounded-lg transition-colors hover:bg-amber-50/70"
          >
            <Avatar
              name={post.user.name}
              imageUrl={post.user.imageUrl}
              size="xs"
            />
            <span className="truncate text-xs font-medium text-stone-700 group-hover:text-amber-700">
              {post.user.name ?? "Book lover"}
            </span>
          </Link>
          {post.category && (
            <span className="shrink-0 rounded-full bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-500 ring-1 ring-stone-200">
              {post.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
