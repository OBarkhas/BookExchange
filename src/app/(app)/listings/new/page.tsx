import PageHeader from "@/components/ui/PageHeader";
import BookForm from "@/components/books/BookForm";

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
