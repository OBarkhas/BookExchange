import type { User } from "@clerk/nextjs/server";
import Link from "next/link";
import { BookOpen, Library, Repeat, Users, Sparkles } from "lucide-react";
import type { FeedItem } from "@/lib/feed";
import AppShell from "@/components/navbar/AppShell";
import PostComposer from "@/components/feed/PostComposer";
import FeedGrid from "@/components/feed/FeedGrid";
import EmptyState from "@/components/ui/EmptyState";
import { initials } from "@/lib/utils";

interface SignedInHomeProps {
  user: User;
  myListings: number;
  activeExchanges: number;
  memberCount: number;
  feed: FeedItem[];
}

export default function SignedInHome({
  user,
  myListings,
  activeExchanges,
  memberCount,
  feed,
}: SignedInHomeProps) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  const stats = [
    { icon: Library, label: "Books Listed", value: myListings },
    { icon: Repeat, label: "Active Exchanges", value: activeExchanges },
    { icon: Users, label: "Community Members", value: memberCount },
  ];

  return (
    <AppShell userId={user.id}>
      <div className="py-2">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-6 shadow-xl shadow-amber-500/25 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/profile/${user.id}`}
                title="Open my profile"
                className="transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName || "Profile"}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 rounded-2xl border-2 border-white/60 object-cover shadow-lg sm:h-16 sm:w-16"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/60 bg-white/20 text-xl font-bold text-white shadow-lg sm:h-16 sm:w-16">
                    {initials(displayName)}
                  </div>
                )}
              </Link>
              <div className="text-white">
                <p className="text-sm font-medium text-amber-50/90">
                  Welcome back,
                </p>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {displayName || "Book Lover"} 👋
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-50/80">
                  <BookOpen className="h-4 w-4" />
                  {email}
                </p>
              </div>
            </div>

            <PostComposer
              label="Post"
              variant="glass"
              className="hidden sm:inline-flex"
            />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm shadow-amber-900/5 backdrop-blur-sm transition-all duration-300 hover:border-amber-300 hover:shadow-md"
            >
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600 ring-1 ring-amber-100">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                <p className="text-sm text-stone-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Community Feed
            </h2>
            <div className="flex items-center gap-3">
              <PostComposer label="Post" />
              <Link
                href="/browse"
                className="text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
              >
                Browse all →
              </Link>
            </div>
          </div>
          {feed.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="The feed is waiting for you"
              description="List a book or post a request to kick things off for your community."
              action={<PostComposer label="Start posting" />}
            />
          ) : (
            <FeedGrid items={feed} />
          )}
        </section>

        <footer className="mt-14 border-t border-amber-100 pb-4 pt-6 text-center text-sm text-stone-400">
          BookLoop — give your read books a new life. 📚
        </footer>
      </div>
    </AppShell>
  );
}
