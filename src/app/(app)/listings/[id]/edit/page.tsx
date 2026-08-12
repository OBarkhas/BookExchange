import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { EXCHANGE_LOCKED_STATUSES } from "@/lib/categories";
import PageHeader from "@/components/ui/PageHeader";
import BookForm from "@/components/books/BookForm";

export default async function EditListingPage({
  params,
}: PageProps<"/listings/[id]/edit">) {
  const { id } = await params;
  const user = await getDbUser();
  const book = await db.book.findUnique({ where: { id } });

  if (!book) notFound();
  if (!user || book.userId !== user.id) redirect(`/listings/${id}`);

  const locked = await db.exchangeRequest.findFirst({
    where: { bookId: id, status: { in: EXCHANGE_LOCKED_STATUSES } },
    select: { id: true },
  });
  if (locked) redirect(`/listings/${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Listing"
        subtitle="Update the details of your book listing."
      />
      <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm shadow-amber-900/5 backdrop-blur-sm sm:p-8">
        <BookForm mode="edit" book={book} />
      </div>
    </div>
  );
}
