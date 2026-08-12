"use client";

import { useState } from "react";
import { Plus, Trash2, BookMarked, Library, Star } from "lucide-react";
import {
  addToShelf as addShelfItem,
  updateShelfItem as updateShelfEntry,
  removeShelfItem as deleteShelfEntry,
} from "@/actions/shelf";
import { SHELF_STATUS_LABELS } from "@/lib/categories";
import type { ShelfStatus, UserBookShelf } from "@/generated/prisma/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StarRating from "@/components/ui/StarRating";
import EmptyState from "@/components/ui/EmptyState";
import { showToast } from "@/components/ui/ToastContainer";
import { cn } from "@/lib/utils";

type ShelfTab = "ALL" | ShelfStatus;

export type ShelfItem = Pick<
  UserBookShelf,
  "id" | "title" | "author" | "status" | "rating"
>;

export default function ShelfSection({
  initialShelf,
}: {
  initialShelf: ShelfItem[];
}) {
  const [shelf, setShelf] = useState<ShelfItem[]>(initialShelf);
  const [tab, setTab] = useState<ShelfTab>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newStatus, setNewStatus] = useState<ShelfStatus>("COMPLETED");
  const [newRating, setNewRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const addToShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;
    setSaving(true);
    try {
      const { item } = await addShelfItem({
        title: newTitle,
        author: newAuthor,
        status: newStatus,
        rating: newRating || null,
      });
      setShelf((prev) => [item, ...prev]);
      setNewTitle("");
      setNewAuthor("");
      setNewRating(0);
      setShowForm(false);
      showToast("Added to your shelf!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add book", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateShelfItem = async (
    id: string,
    patch: Partial<{ status: ShelfStatus; rating: number | null }>,
  ) => {
    try {
      const { item } = await updateShelfEntry(id, patch);
      setShelf((prev) => prev.map((s) => (s.id === id ? item : s)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    }
  };

  const removeShelfItem = async (id: string) => {
    try {
      await deleteShelfEntry(id);
      setShelf((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove", "error");
    }
  };

  const visibleShelf =
    tab === "ALL" ? shelf : shelf.filter((s) => s.status === tab);

  const tabs: { value: ShelfTab; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "READING", label: "Reading" },
    { value: "COMPLETED", label: "Finished" },
    { value: "WANT_TO_READ", label: "Want to read" },
  ];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">My Bookshelf</h2>
            <p className="text-xs text-stone-400">
              Track what you&apos;ve read, are reading, and want to read
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Add book
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              tab === t.value
                ? "bg-amber-500 text-white shadow-sm"
                : "border border-amber-200 bg-white text-stone-600 hover:bg-amber-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={addToShelf}
          className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Input
            name="shelfTitle"
            placeholder="Book title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            name="shelfAuthor"
            placeholder="Author"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
          />
          <Select
            name="shelfStatus"
            options={[
              { value: "READING", label: "Currently reading" },
              { value: "COMPLETED", label: "Finished" },
              { value: "WANT_TO_READ", label: "Want to read" },
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as ShelfStatus)}
          />
          <div className="flex items-end justify-between gap-2 rounded-xl bg-white p-2 ring-1 ring-amber-100">
            <StarRating value={newRating} onChange={setNewRating} size={20} />
            <Button size="sm" loading={saving} type="submit">
              Save
            </Button>
          </div>
        </form>
      )}

      {visibleShelf.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={tab === "ALL" ? "Your shelf is empty" : `Nothing ${SHELF_STATUS_LABELS[tab as ShelfStatus].toLowerCase()}`}
          description="Keep track of the books you love, then swap them when you're done."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add your first book
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleShelf.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-amber-100 bg-white/85 p-5 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="truncate text-sm text-stone-500">{item.author}</p>
                </div>
                <button
                  onClick={() => removeShelfItem(item.id)}
                  aria-label="Remove from shelf"
                  className="rounded-lg p-1.5 text-stone-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Select
                  name={`status-${item.id}`}
                  options={[
                    { value: "READING", label: "Reading" },
                    { value: "COMPLETED", label: "Finished" },
                    { value: "WANT_TO_READ", label: "Want to read" },
                  ]}
                  value={item.status}
                  onChange={(e) =>
                    updateShelfItem(item.id, {
                      status: e.target.value as ShelfStatus,
                    })
                  }
                  className="h-8 w-32 text-xs"
                />
                {item.status === "COMPLETED" && (
                  <div className="flex items-center gap-1 text-xs text-stone-400">
                    <Star className="h-3 w-3" />
                    <StarRating
                      value={item.rating ?? 0}
                      onChange={(rating) => updateShelfItem(item.id, { rating })}
                      size={14}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
