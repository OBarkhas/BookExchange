import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth";
import Navbar from "@/components/navbar/Navbar";

/**
 * Authenticated app shell. All pages inside /(app) require a signed-in,
 * DB-synced user and share the top navigation bar.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDbUser();
  if (!user) redirect("/");

  return (
    <div className="relative min-h-screen bg-cream">
      <div className="animate-blob pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-yellow-100/50 blur-3xl [animation-delay:-6s]" />
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
