import type { BookCondition, ListingType, RequestStatus, ShelfStatus } from "@/generated/prisma/client";

export const BOOK_CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Mystery & Thriller",
  "Science Fiction",
  "Fantasy",
  "Romance",
  "Biography & Memoir",
  "History",
  "Self-Help",
  "Children's Books",
  "Textbooks",
  "Comics & Graphic Novels",
  "Poetry",
  "Cookbooks",
  "Travel",
  "Other",
] as const;

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  EXCHANGE_ONLY: "Swap only",
  SELL_ONLY: "Sell only",
  BOTH: "Swap or sell",
};

export const CONDITION_LABELS: Record<BookCondition, string> = {
  LIKE_NEW: "Like new",
  GOOD: "Good",
  ACCEPTABLE: "Acceptable",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Declined",
  COMPLETED: "Completed",
};

export const SHELF_STATUS_LABELS: Record<ShelfStatus, string> = {
  READING: "Currently reading",
  COMPLETED: "Finished",
  WANT_TO_READ: "Want to read",
};

export const CONDITION_COLORS: Record<BookCondition, string> = {
  LIKE_NEW: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  GOOD: "bg-sky-50 text-sky-700 ring-sky-200",
  ACCEPTABLE: "bg-amber-50 text-amber-700 ring-amber-200",
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  COMPLETED: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  EXCHANGE_ONLY: "bg-teal-50 text-teal-700 ring-teal-200",
  SELL_ONLY: "bg-orange-50 text-orange-700 ring-orange-200",
  BOTH: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};
