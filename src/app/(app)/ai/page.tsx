import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Package,
  BookOpen,
  CheckCircle2,
  Clock,
  Heart,
  Repeat,
  ArrowLeft,
} from "lucide-react";

const AiChat = dynamic(
  () => import("@/components/ai/AiChat"),
  {
    loading: () => (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/80 shadow-sm shadow-amber-900/5 backdrop-blur-sm">
        <div className="h-14 shrink-0 animate-pulse border-b border-amber-100/80 bg-amber-50/60" />
        <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "h-14 animate-pulse rounded-2xl bg-amber-100/50",
                index % 2 === 1 ? "ml-auto w-1/2" : "w-3/4",
              )}
            />
          ))}
        </div>
        <div className="h-16 shrink-0 animate-pulse border-t border-amber-100/80 bg-amber-50/60" />
      </div>
    ),
  },
);

export default async function AiPage() {
  const user = await getDbUser();
  if (!user) redirect("/");

  const [listings, shelf, wishlist, swaps] = await Promise.all([
    db.book.findMany({
      where: { userId: user.id, isAvailable: true, expiresAt: { gt: new Date() } },
      orderBy: { lastBumpedAt: "desc" },
      take: 20,
      select: { title: true, author: true, category: true },
    }),
    db.userBookShelf.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { title: true, author: true, status: true, rating: true },
    }),
    db.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true, author: true },
    }),
    db.exchangeRequest.findMany({
      where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { status: true },
    }),
  ]);

  const reading = shelf.filter((item) => item.status === "READING");
  const completedCount = shelf.filter((item) => item.status === "COMPLETED").length;
  const wantToReadCount = shelf.filter((item) => item.status === "WANT_TO_READ").length;
  const completedSwaps = swaps.filter((item) => item.status === "COMPLETED").length;

  const stats = [
    { icon: Package, label: "Active listings", value: listings.length },
    { icon: BookOpen, label: "Currently reading", value: reading.length },
    { icon: CheckCircle2, label: "Finished", value: completedCount },
    { icon: Clock, label: "Want to read", value: wantToReadCount },
    { icon: Heart, label: "Wishlist", value: wishlist.length },
    { icon: Repeat, label: "Swaps completed", value: completedSwaps },
  ];

  return (
    <div className="flex flex-col gap-4 overflow-x-hidden py-2 md:pb-28 lg:h-[calc(100dvh-64px)] lg:gap-0 lg:overflow-hidden lg:py-0">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          title="Back to dashboard"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-stone-600 shadow-sm shadow-amber-900/5 transition-all duration-200 hover:-translate-x-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            AI Reading Coach
          </h1>
          <p className="mt-0.5 hidden text-sm text-stone-500 sm:block">
            Personalized picks, reading-speed estimates, and answers about your
            library — powered by Groq.
          </p>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 items-stretch gap-6 lg:flex-1 lg:grid-cols-3">
        <div className="h-[calc(100dvh-128px)] min-h-[28rem] min-w-0 md:h-[calc(100dvh-192px)] lg:col-span-2 lg:h-auto">
          <AiChat />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:scroll-thin">
          <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm shadow-amber-900/5 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-zinc-900">
              Your library at a glance
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-400">
              Booksy uses this data to personalize every answer.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-xl border border-amber-100 bg-amber-50/50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-md hover:shadow-amber-500/10"
                >
                  <stat.icon className="h-4 w-4 text-amber-600 transition-transform duration-200 group-hover:scale-110" />
                  <p className="mt-2 text-xl font-bold tabular-nums text-zinc-900">
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {reading.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm shadow-amber-900/5 backdrop-blur-sm">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
                <BookOpen className="h-4 w-4 text-amber-600" />
                Currently reading
              </h3>
              <ul className="mt-3 space-y-2.5">
                {reading.slice(0, 3).map((item, index) => (
                  <li key={`${item.title}-${index}`} className="text-sm">
                    <p className="font-medium leading-snug text-zinc-800">
                      {item.title}
                    </p>
                    <p className="text-xs text-stone-500">{item.author}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {wishlist.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm shadow-amber-900/5 backdrop-blur-sm">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
                <Heart className="h-4 w-4 text-amber-600" />
                On your wishlist
              </h3>
              <ul className="mt-3 space-y-2">
                {wishlist.slice(0, 5).map((item, index) => (
                  <li
                    key={`${item.title}-${index}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-zinc-800">
                        {item.title}
                      </p>
                      {item.author && (
                        <p className="text-xs text-stone-500">{item.author}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
