import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-100/80 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/25">
            <BookOpen className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Book<span className="text-amber-600">Loop</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-amber-300 ring-offset-2 ring-offset-cream transition-shadow duration-200 hover:shadow-md hover:shadow-amber-500/20">
              <UserButton />
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-700 transition-all duration-200 hover:bg-amber-100/70 hover:text-stone-900">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 active:scale-95">
                Get started
              </button>
            </SignUpButton>
          </Show>
        </div>
      </div>
    </header>
  );
}
