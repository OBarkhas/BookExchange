"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  BookOpen,
  ArrowLeftRight,
  Lock,
} from "lucide-react";
import type { Book } from "@/generated/prisma/client";
import { fetcher, formatPrice, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import BookForm from "./BookForm";
import { showToast } from "@/components/ui/ToastContainer";

interface ListingManageCardProps {
  book: Book;
  hasActiveExchange?: boolean;
  canManage?: boolean;
  layout?: "row" | "grid";
}

export default function ListingManageCard({
  book,
  hasActiveExchange = false,
  canManage = true,
  layout = "row",
}: ListingManageCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState<"toggle" | "delete" | null>(null);

  const locked = hasActiveExchange;
  const forSale = book.price != null;
  const cover = book.images[0];

  const statusBadge = locked
    ? { label: "In exchange", cls: "bg-violet-50 text-violet-700 ring-violet-200" }
    : !book.isAvailable
      ? { label: "Sold", cls: "bg-stone-100 text-stone-500 ring-stone-200" }
      : { label: "Live", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };

  const toggleAvailable = async () => {
    setBusy("toggle");
    try {
      await fetcher(`/api/listings/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !book.isAvailable }),
      });
      showToast(
        book.isAvailable
          ? "Marked as sold — hidden from the marketplace"
          : "Listing is live again 🎉",
        book.isAvailable ? "info" : "success",
      );
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const deleteListing = async () => {
    setBusy("delete");
    try {
      await fetcher(`/api/listings/${book.id}`, { method: "DELETE" });
      setDeleteOpen(false);
      showToast("Listing deleted");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete", "error");
    } finally {
      setBusy(null);
    }
  };

  const priceMeta = forSale ? (
    <>
      <span className="font-bold text-amber-600">{formatPrice(book.price)}</span>
      {book.listingType !== "SELL_ONLY" && " · open to swaps"}
    </>
  ) : (
    <span className="inline-flex items-center gap-1 font-medium text-teal-600">
      <ArrowLeftRight className="h-3 w-3" /> Swap only
    </span>
  );


  const coverBlock = (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-100">
      {cover ? (
        <img
          src={cover}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <BookOpen className="h-5 w-5 text-amber-300" />
        </div>
      )}
    </div>
  );

  const infoBlock = (
    <div className="min-w-0 flex-1">
      <Link
        href={`/listings/${book.id}`}
        className="block truncate font-semibold text-zinc-900 hover:text-amber-700"
      >
        {book.title}
      </Link>
      <p className="truncate text-sm text-stone-500">{book.author}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-400">
        {priceMeta}
      </p>
    </div>
  );

  const actionsBlock = canManage ? (
    <div className="flex items-center gap-2">
      {locked && (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
          <Lock className="h-3 w-3" /> Locked
        </span>
      )}
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        disabled={locked}
        title={locked ? "Completed listings cannot be edited" : "Edit listing"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-zinc-900 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-stone-600"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        type="button"
        onClick={toggleAvailable}
        disabled={locked || busy !== null}
        title={
          locked
            ? "This book is part of an active exchange"
            : book.isAvailable
              ? "Mark as sold / unavailable"
              : "Bring the listing back live"
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 hover:text-zinc-900 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === "toggle" ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-amber-500" />
        ) : book.isAvailable ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        {book.isAvailable ? "Mark sold" : "Relist"}
      </button>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  ) : null;


  if (layout === "grid") {
    return (
      <>
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/85 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <Link href={`/listings/${book.id}`} className="relative block aspect-[4/3]">
            {coverBlock}
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                statusBadge.cls,
              )}
            >
              {statusBadge.label}
            </span>
          </Link>
          <div className="flex flex-1 flex-col p-3">{infoBlock}</div>
          {actionsBlock && (
            <div className="flex flex-wrap items-center gap-2 border-t border-amber-100/70 px-3 py-2.5">
              {actionsBlock}
            </div>
          )}
        </div>
        {renderModals()}
      </>
    );
  }

  return (
    <>
      <div className="group flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:border-amber-300 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link href={`/listings/${book.id}`} className="block shrink-0">
            <div className="relative h-16 w-14 overflow-hidden rounded-lg">{coverBlock}</div>
          </Link>
          {infoBlock}
          <span
            className={cn(
              "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 sm:inline-block",
              statusBadge.cls,
            )}
          >
            {statusBadge.label}
          </span>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-2 sm:pl-4">{actionsBlock}</div>
        )}
      </div>
      {renderModals()}
    </>
  );


  function renderModals() {
    return (
      <>
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Edit "${book.title}"`}
          size="lg"
        >
          <BookForm
            mode="edit"
            book={book}
            onSaved={() => {
              setEditOpen(false);
              router.refresh();
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>

        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete this listing?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={busy === "delete"}
                onClick={deleteListing}
              >
                <Trash2 className="h-4 w-4" /> Delete listing
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-stone-600">
            This permanently removes <span className="font-semibold text-zinc-900">“{book.title}”</span>{" "}
            and all its related requests and chats from the marketplace. This
            can&apos;t be undone.
          </p>
        </Modal>
      </>
    );
  }
}
