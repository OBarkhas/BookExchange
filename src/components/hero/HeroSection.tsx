import { SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  BookOpen,
  ArrowLeftRight,
  ShoppingBag,
  Sparkles,
  Search,
} from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Book Exchange",
    desc: "Swap your finished books for new reads with other community members for free.",
  },
  {
    icon: ShoppingBag,
    title: "Buy & Sell",
    desc: "List your books for sale or find great deals on pre-owned books nearby.",
  },
  {
    icon: Search,
    title: "Easy Discovery",
    desc: "Search by title, author, or condition to connect with local readers easily.",
  },
];

export default function HeroSection() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(#fcd34d_1px,transparent_1px)] bg-[size:26px_26px] opacity-20" />
      <div className="animate-blob pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-yellow-100/70 blur-3xl [animation-delay:-4s]" />
      <div className="animate-blob pointer-events-none absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-amber-100/60 blur-2xl [animation-delay:-8s]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/90" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-8 text-center">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-amber-100 bg-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-6xl">
            BookLoop
            <span className="mt-2 block text-2xl font-normal text-amber-600 md:text-3xl">
              Buy, Sell &amp; Exchange Used Books
            </span>
          </h1>
        </div>

        <p className="mx-auto max-w-xl text-base leading-relaxed text-stone-600 md:text-lg">
          Give your read books a new life. Connect directly with local book
          lovers to exchange or sell your pre-loved books effortlessly.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm shadow-amber-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 ring-1 ring-amber-100 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 group-hover:text-white group-hover:ring-amber-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-zinc-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-stone-500">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
          <SignUpButton mode="modal">
            <button className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 active:scale-95 sm:w-auto">
              Get Started
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button className="w-full rounded-xl border border-amber-200 bg-white px-7 py-3 text-sm font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 hover:text-stone-900 active:scale-95 sm:w-auto">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}
