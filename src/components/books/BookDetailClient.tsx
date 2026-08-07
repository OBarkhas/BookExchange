"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeftRight,
  Send,
} from "lucide-react";
import { fetcher } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/ToastContainer";

/* ------------------------------------------------------------------ */
/* Owner actions: bump, toggle availability, delete                    */
/* ------------------------------------------------------------------ */

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
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (action: "bump" | "toggle" | "delete") => {
    setBusy(action);
    try {
      if (action === "bump") {
        await fetcher(`/api/listings/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bump: true }),
        });
        showToast("Bumped to the top! ⚡ Your listing got 30 more days.");
      } else if (action === "toggle") {
        await fetcher(`/api/listings/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: !isAvailable }),
        });
        showToast(isAvailable ? "Listing paused" : "Listing is live again", "info");
      } else {
        await fetcher(`/api/listings/${bookId}`, { method: "DELETE" });
        showToast("Listing deleted");
        router.push("/shelf");
      }
      router.refresh();
    } catch (err) {
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
          {isAvailable ? (
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

/* ------------------------------------------------------------------ */
/* Request button + modal for buyers/swappers                          */
/* ------------------------------------------------------------------ */

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

  const submit = async () => {
    setSubmitting(true);
    try {
      await fetcher(`/api/listings/${listingId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          offeredBook: offeredBook.trim(),
        }),
      });
      setOpen(false);
      showToast("Request sent! Chat is now open 💬");
      router.push("/messages");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send request", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
