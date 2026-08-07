"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, ShoppingBag, RefreshCcw } from "lucide-react";
import type { Book, BookCondition } from "@/generated/prisma/client";
import { BOOK_CATEGORIES } from "@/lib/categories";
import { LISTING_DURATION_DAYS, fetcher } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import ImageUpload from "./ImageUpload";
import { showToast } from "@/components/ui/ToastContainer";
import { cn } from "@/lib/utils";

type ListingTypeValue = "EXCHANGE_ONLY" | "SELL_ONLY" | "BOTH";

interface BookFormProps {
  mode: "create" | "edit";
  book?: Book;
}

const listingTypeOptions: {
  value: ListingTypeValue;
  label: string;
  desc: string;
  icon: typeof ArrowLeftRight;
}[] = [
  { value: "EXCHANGE_ONLY", label: "Swap only", desc: "Trade for another book", icon: RefreshCcw },
  { value: "SELL_ONLY", label: "Sell only", desc: "Sell for cash", icon: ShoppingBag },
  { value: "BOTH", label: "Swap or sell", desc: "Happy with either", icon: ArrowLeftRight },
];

export default function BookForm({ mode, book }: BookFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [category, setCategory] = useState(book?.category ?? "");
  const [condition, setCondition] = useState(book?.condition ?? "GOOD");
  const [listingType, setListingType] = useState<ListingTypeValue>(
    (book?.listingType as ListingTypeValue) ?? "BOTH",
  );
  const [price, setPrice] = useState(
    book?.price != null ? String(book.price) : "",
  );
  const [exchangePreference, setExchangePreference] = useState(
    book?.exchangePreference ?? "",
  );
  const [description, setDescription] = useState(book?.description ?? "");
  const [hasDamage, setHasDamage] = useState(book?.hasDamage ?? false);
  const [damageDescription, setDamageDescription] = useState(
    book?.damageDescription ?? "",
  );
  const [images, setImages] = useState<string[]>(book?.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sellable = listingType !== "EXCHANGE_ONLY";
  const swappable = listingType !== "SELL_ONLY";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!author.trim()) next.author = "Author is required";
    if (!category) next.category = "Choose a category";
    if (sellable && !price.trim()) next.price = "Set a price for sellable listings";
    if (sellable && price.trim() && Number(price) < 0) {
      next.price = "Price can't be negative";
    }
    if (hasDamage && !damageDescription.trim()) {
      next.damageDescription = "Please describe the damage";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim(),
        category,
        condition,
        listingType,
        price: sellable ? Number(price) || 0 : null,
        exchangePreference: swappable ? exchangePreference.trim() : null,
        description: description.trim(),
        hasDamage,
        damageDescription: hasDamage ? damageDescription.trim() : null,
        images,
      };

      if (mode === "edit" && book) {
        await fetcher(`/api/listings/${book.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Listing updated!");
        router.push(`/listings/${book.id}`);
        router.refresh();
      } else {
        const data = await fetcher<{ book: Book }>("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Your book is now live! 🎉");
        router.push(`/listings/${data.book.id}`);
        router.refresh();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="title"
          label="Book title"
          placeholder="e.g. The Midnight Library"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <Input
          name="author"
          label="Author"
          placeholder="e.g. Matt Haig"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          error={errors.author}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          name="category"
          label="Category"
          placeholder="Choose a category"
          options={BOOK_CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          error={errors.category}
        />
        <Select
          name="condition"
          label="Condition"
          options={[
            { value: "LIKE_NEW", label: "Like new — barely read" },
            { value: "GOOD", label: "Good — normal wear" },
            { value: "ACCEPTABLE", label: "Acceptable — well loved" },
          ]}
          value={condition}
          onChange={(e) => setCondition(e.target.value as BookCondition)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">How do you want to share it?</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {listingTypeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setListingType(option.value)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                listingType === option.value
                  ? "border-amber-400 bg-amber-50 shadow-sm ring-2 ring-amber-100"
                  : "border-stone-200 bg-white hover:border-amber-200 hover:bg-amber-50/40",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                  listingType === option.value
                    ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    : "bg-amber-50 text-amber-600",
                )}
              >
                <option.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{option.label}</p>
                <p className="mt-0.5 text-xs text-stone-500">{option.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sellable && (
          <Input
            name="price"
            label="Price (USD)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.price}
          />
        )}
        {swappable && (
          <Input
            name="exchangePreference"
            label="What would you swap for?"
            placeholder="e.g. Anything by Haruki Murakami"
            value={exchangePreference}
            onChange={(e) => setExchangePreference(e.target.value)}
          />
        )}
      </div>

      <Textarea
        name="description"
        label="Description"
        rows={4}
        placeholder="Tell readers about the book, its story, and why you loved it…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">Photos</p>
        <ImageUpload images={images} onChange={setImages} />
        <p className="mt-2 text-xs text-stone-400">
          Up to 6 images — helps buyers &amp; swappers trust the condition.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={hasDamage}
            onChange={(e) => setHasDamage(e.target.checked)}
            className="h-4 w-4 rounded accent-amber-500"
          />
          <span className="text-sm font-medium text-stone-700">
            This book has some wear or damage
          </span>
        </label>
        {hasDamage && (
          <div className="mt-3">
            <Textarea
              name="damageDescription"
              rows={2}
              placeholder="Describe any marks, notes, torn pages, etc. — honesty builds trust."
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              error={errors.damageDescription}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-amber-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-stone-400">
          Listings stay live for {LISTING_DURATION_DAYS} days — bump them anytime to
          keep them on top.
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {mode === "edit" ? "Save changes" : "Publish listing"}
          </Button>
        </div>
      </div>
    </form>
  );
}
