import type { User } from "@clerk/nextjs/server";
import Link from "next/link";
import { BookOpen, Library, Repeat, Users, BadgeCheck } from "lucide-react";
import type { UserBadge } from "@/generated/prisma/client";
import AppShell from "@/components/navbar/AppShell";
import QuickActions from "@/components/home/QuickActions";
import BookCard, { type BookCardBook } from "@/components/books/BookCard";
import { initials } from "@/lib/utils";

interface SignedInHomeProps {
  user: User;
  myListings: number;
  activeExchanges: number;
  memberCount: number;
  recentListings: BookCardBook[];
  badges: UserBadge[];
}

export default function SignedInHome({
  user,
  myListings,
  activeExchanges,
  memberCount,
  recentListings,
  badges,
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
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-8 shadow-xl shadow-amber-500/25 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <Link
                href={`/profile/${user.id}`}
                title="Open my profile"
                className="transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName || "Profile"}
                    className="h-16 w-16 rounded-2xl border-2 border-white/60 object-cover shadow-lg sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/60 bg-white/20 text-2xl font-bold text-white shadow-lg sm:h-20 sm:w-20">
                    {initials(displayName)}
                  </div>
                )}
              </Link>
              <div className="text-white">
                <p className="text-sm font-medium text-amber-50/90">
                  Welcome back,
                </p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {displayName || "Book Lover"} 👋
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-50/80">
                  <BookOpen className="h-4 w-4" />
                  {email}
                </p>
              </div>
            </div>

            <Link
              href={`/profile/${user.id}`}
              className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <span className="text-sm font-medium text-white">
                {badges.length > 0
                  ? `${badges.length} badge${badges.length > 1 ? "s" : ""} earned`
                  : "Your account is synced"}
              </span>
              {badges.length > 0 && (
                <span className="text-base">{badges[0].icon}</span>
              )}
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {badges.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <BadgeCheck className="h-5 w-5 text-amber-500" />
              Your badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-yellow-50 px-4 py-2.5 shadow-sm"
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {badge.badgeName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Fresh on the market
            </h2>
            <Link
              href="/browse"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Browse all →
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-white/60 px-6 py-12 text-center">
              <p className="text-2xl">📚</p>
              <p className="mt-2 font-semibold text-zinc-900">
                The market is waiting for your books
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Be the first to list a book in your community.
              </p>
              <Link
                href="/listings/new"
                className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
              >
                List your first book
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentListings.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Jump back in
          </h2>
          <QuickActions />
        </section>

        <footer className="mt-14 border-t border-amber-100 pb-4 pt-6 text-center text-sm text-stone-400">
          BookLoop — give your read books a new life. 📚
        </footer>
      </div>
    </AppShell>
  );
}
