"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, MessagesSquare, Send } from "lucide-react";
import { createPost } from "@/actions/posts";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import {
  BOOK_CATEGORIES,
  POST_KINDS,
  POST_KIND_LABELS,
  type PostKind,
} from "@/lib/categories";
import { showToast } from "@/components/ui/ToastContainer";
import { cn } from "@/lib/utils";

const VARIANTS = {
  solid:
    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700",
  glass:
    "bg-white/15 text-white shadow-none backdrop-blur-sm hover:bg-white/25",
};

export default function PostComposer({
  label = "Post",
  className,
  variant = "solid",
}: {
  label?: string;
  className?: string;
  variant?: keyof typeof VARIANTS;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"book" | "post" | null>(null);
  const [kind, setKind] = useState<PostKind>("REQUEST");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const reset = () => {
    setMode(null);
    setKind("REQUEST");
    setTitle("");
    setBody("");
    setCategory("");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      showToast("Give your post a title", "info");
      return;
    }
    setSubmitting(true);
    startTransition(async () => {
      try {
        await createPost({ kind, title, body, category });
        showToast("Post published! 🎉");
        close();
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Could not create post",
          "error",
        );
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
          VARIANTS[variant],
          className,
        )}
      >
        <Plus className="h-4 w-4" /> {label}
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Post to the community"
        size="md"
        footer={
          mode === "post" ? (
            <>
              <Button variant="ghost" onClick={() => setMode(null)}>
                Back
              </Button>
              <Button loading={submitting} onClick={submit}>
                <Send className="h-4 w-4" /> Publish post
              </Button>
            </>
          ) : undefined
        }
      >
        {mode === null && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
                router.push("/listings/new");
              }}
              className="group flex w-full items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-left transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Sell or Exchange a Book
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                  List a physical book with price, condition and photos for sale
                  or swap.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("post")}
              className="group flex w-full items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-4 text-left transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-sm">
                <MessagesSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  General Post or Request
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                  No book to list? Ask for recommendations, start a discussion,
                  or request a specific book.
                </p>
              </div>
            </button>
          </div>
        )}

        {mode === "post" && (
          <div className="space-y-4">
            <Select
              name="postKind"
              label="Post type"
              options={POST_KINDS.map((value) => ({
                value,
                label: POST_KIND_LABELS[value],
              }))}
              value={kind}
              onChange={(e) => setKind(e.target.value as PostKind)}
            />
            <Input
              name="postTitle"
              label="Title"
              placeholder="e.g. Looking for 'The Midnight Library' in Ulaanbaatar"
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <Textarea
              name="postBody"
              label="Details (optional)"
              rows={4}
              placeholder="Tell the community what you're looking for, sharing, or wondering about…"
              value={body}
              maxLength={2000}
              onChange={(e) => setBody(e.target.value)}
            />
            <Select
              name="postCategory"
              label="Category (optional)"
              options={BOOK_CATEGORIES.map((value) => ({ value, label: value }))}
              placeholder="All categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <p className="text-xs text-stone-400">
              Your post will appear instantly in the community feed.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
