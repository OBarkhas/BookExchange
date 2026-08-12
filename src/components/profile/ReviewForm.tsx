"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { submitReview } from "@/actions/profile";
import StarRating from "@/components/ui/StarRating";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/ToastContainer";

export default function ReviewForm({ receiverId }: { receiverId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const [optimisticSubmitted, addOptimistic] = useOptimistic(
    false,
    (_current: boolean, next: boolean) => next,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast("Pick a star rating first", "info");
      return;
    }
    const snapshotRating = rating;
    const snapshotComment = comment;
    setSubmitting(true);
    startTransition(() => addOptimistic(true));
    try {
      await submitReview(receiverId, snapshotRating, snapshotComment);
      showToast("Review submitted — thank you! ⭐");
      setComment("");
      setRating(0);
    } catch (err) {
      addOptimistic(false);
      showToast(err instanceof Error ? err.message : "Could not submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (optimisticSubmitted) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Review submitted — thank you! ⭐
          </p>
          <p className="mt-0.5 text-xs text-emerald-600">
            Your rating helps the community trust each other.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Star className="h-4 w-4 text-amber-500" />
        Rate this reader
      </p>
      <div className="mt-3">
        <StarRating value={rating} onChange={setRating} size={26} />
      </div>
      <div className="mt-3">
        <Textarea
          name="reviewComment"
          rows={3}
          placeholder="How was the exchange? Fast replies, friendly, honest condition notes…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" loading={submitting} disabled={rating === 0}>
          Submit review
        </Button>
      </div>
    </form>
  );
}
