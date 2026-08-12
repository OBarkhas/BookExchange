"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Topbar from "./Topbar";
import AppSidebar from "./AppSidebar";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const pathname = usePathname();
  const fullscreen = pathname.startsWith("/ai");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-cream">
      <div className="animate-blob pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-yellow-100/50 blur-3xl [animation-delay:-6s]" />

      <AppSidebar userId={userId} hideBottomNav={fullscreen} />

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip lg:pl-64">
        <Topbar userId={userId} />
        <main
          key={pathname}
          className={cn(
            "page-enter relative z-10 mx-auto w-full min-w-0 max-w-md flex-1 overflow-x-clip sm:max-w-2xl lg:max-w-6xl",
            fullscreen
              ? "px-4 py-0 sm:px-6"
              : "px-4 py-6 pb-32 sm:px-6 sm:py-8 lg:pb-12",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
