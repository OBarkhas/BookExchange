"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { fetcher } from "@/lib/utils";
import StarRating from "@/components/ui/StarRating";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/ToastContainer";

export default function ReviewForm({ receiverId }: { receiverId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast("Pick a star rating first", "info");
      return;
    }
    setSubmitting(true);
    try {
      await fetcher("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, rating, comment }),
      });
      showToast("Review submitted — thank you! ⭐");
      setComment("");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
