import dynamic from "next/dynamic";
import PageHeader from "@/components/ui/PageHeader";

const BookForm = dynamic(() => import("@/components/books/BookForm"), {
  loading: () => (
    <div className="space-y-4">
      <div className="h-10 animate-pulse rounded-xl bg-amber-100/40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-10 animate-pulse rounded-xl bg-amber-100/40" />
        <div className="h-10 animate-pulse rounded-xl bg-amber-100/40" />
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-amber-100/40" />
      <div className="h-10 animate-pulse rounded-xl bg-amber-100/40" />
    </div>
  ),
});

export const metadata = { title: "List a Book — BookLoop" };

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="List a Book"
        subtitle="Give your read books a new life — swap them or sell them to local readers."
      />
      <div className="rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm shadow-amber-900/5 backdrop-blur-sm sm:p-8">
        <BookForm mode="create" />
      </div>
    </div>
  );
}
