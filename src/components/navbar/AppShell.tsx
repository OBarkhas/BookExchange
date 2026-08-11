"use client";

import type { ReactNode } from "react";
import Topbar from "./Topbar";
import AppSidebar from "./AppSidebar";

export default function AppShell({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-cream">
      <div className="animate-blob pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-yellow-100/50 blur-3xl [animation-delay:-6s]" />

      <AppSidebar userId={userId} />

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip lg:pl-64">
        <Topbar userId={userId} />
        <main className="relative z-10 mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 pb-36 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
