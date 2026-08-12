"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Rocket,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeftRight,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  bumpListing,
  toggleListingAvailability,
  deleteListing,
  requestBook,
} from "@/actions/listings";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/ToastContainer";

export function ListingOwnerActions({
  bookId,
  isAvailable,
  isExpired,
}: {
  bookId: string;
  isAvailable: boolean;
  isExpired: boolean;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTransition] = useTransition();
  const [optimisticAvailable, addOptimistic] = useOptimistic(
    isAvailable,
    (_current: boolean, next: boolean) => next,
  );

  const run = async (action: "bump" | "toggle" | "delete") => {
    setBusy(action);
    try {
      if (action === "bump") {
        await bumpListing(bookId);
        showToast("Bumped to the top! ⚡ Your listing got 30 more days.");
      } else if (action === "toggle") {
        const next = !optimisticAvailable;
        startTransition(() => addOptimistic(next));
        await toggleListingAvailability(bookId, next);
        showToast(
          next ? "Listing paused" : "Listing is live again",
          "info",
        );
      } else {
        await deleteListing(bookId);
        showToast("Listing deleted");
        router.push(user ? `/profile/${user.id}` : "/browse");
      }
    } catch (err) {
      addOptimistic(isAvailable);
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          loading={busy === "bump"}
          disabled={isExpired}
          onClick={() => run("bump")}
        >
          <Rocket className="h-3.5 w-3.5" /> Bump to top
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={busy === "toggle"}
          onClick={() => run("toggle")}
        >
          {optimisticAvailable ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Pause
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Resume
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this listing?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={busy === "delete"}
              onClick={() => run("delete")}
            >
              <Trash2 className="h-4 w-4" /> Delete listing
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone-600">
          This permanently removes the listing and all its pending requests.
          This can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}

export function RequestBookButton({
  listingId,
  available,
  title,
}: {
  listingId: string;
  available: boolean;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [offeredBook, setOfferedBook] = useState("");
  const [, startTransition] = useTransition();
  const [optimisticSent, addOptimistic] = useOptimistic(
    false,
    (_current: boolean, next: boolean) => next,
  );

  const submit = async () => {
    setSubmitting(true);
    startTransition(() => addOptimistic(true));
    try {
      await requestBook(listingId, message, offeredBook);
      setOpen(false);
      showToast("Request sent! Chat is now open 💬");
      router.push("/messages");
    } catch (err) {
      addOptimistic(false);
      showToast(err instanceof Error ? err.message : "Could not send request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (optimisticSent) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Request sent — chat is open!
          </p>
          <p className="mt-0.5 text-xs text-emerald-600">
            Head to Messages to arrange your swap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        disabled={!available}
        onClick={() => setOpen(true)}
      >
        <ArrowLeftRight className="h-4 w-4" />
        {available ? "Request this book" : "No longer available"}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Request "${title}"`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={submit}>
              <Send className="h-4 w-4" /> Send request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            name="message"
            rows={3}
            label="Message to the seller"
            placeholder="Hi! I'd love to swap this book. Let's arrange a meetup…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Input
            name="offeredBook"
            label="Book you're offering (optional)"
            placeholder="e.g. Project Hail Mary by Andy Weir"
            value={offeredBook}
            onChange={(e) => setOfferedBook(e.target.value)}
          />
          <p className="text-xs text-stone-400">
            Once sent, you&apos;ll get a private chat with the seller to
            arrange the exchange.
          </p>
        </div>
      </Modal>
    </>
  );
}
