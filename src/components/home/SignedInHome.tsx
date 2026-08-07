import type { User } from "@clerk/nextjs/server";
import { BookOpen, Library, Users, Repeat } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import QuickActions from "@/components/home/QuickActions";

interface SignedInHomeProps {
  user: User;
}

function initials(name: string | null | undefined) {
  if (!name) return "BL";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const stats = [
  { icon: Library, label: "Books Listed", value: 0 },
  { icon: Repeat, label: "Active Exchanges", value: 0 },
  { icon: Users, label: "Community Members", value: "∞" },
];

export default function SignedInHome({ user }: SignedInHomeProps) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="relative min-h-screen bg-cream">
      <div className="animate-blob pointer-events-none absolute -top-40 right-0 h-[26rem] w-[26rem] rounded-full bg-amber-200/40 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute left-0 top-1/2 h-80 w-80 rounded-full bg-yellow-100/60 blur-3xl [animation-delay:-6s]" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-8 shadow-xl shadow-amber-500/25 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
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

            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">
                Your account is synced to BookLoop
              </span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            </div>
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

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Start swapping
            </h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Beta
            </span>
          </div>
          <QuickActions />
        </section>

        <footer className="mt-14 border-t border-amber-100 pb-4 pt-6 text-center text-sm text-stone-400">
          BookLoop — give your read books a new life. 📚
        </footer>
      </main>
    </div>
  );
}
