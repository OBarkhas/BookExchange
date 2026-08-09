"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { BOOK_CATEGORIES } from "@/lib/categories";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export interface FilterState {
  q: string;
  category: string;
  condition: string;
  listingType: string;
  district: string;
  sort: string;
}

interface BookFiltersProps {
  initial: FilterState;
  districts: string[];
}

const emptyFilters: FilterState = {
  q: "",
  category: "",
  condition: "",
  listingType: "",
  district: "",
  sort: "recent",
};

export default function BookFilters({ initial, districts }: BookFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<FilterState>(initial);

  const hasActiveFilters = useMemo(
    () =>
      filters.q !== "" ||
      filters.category !== "" ||
      filters.condition !== "" ||
      filters.listingType !== "" ||
      filters.district !== "" ||
      filters.sort !== "recent",
    [filters],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  //hi
  const apply = (next: FilterState) => {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category) params.set("category", next.category);
    if (next.condition) params.set("condition", next.condition);
    if (next.listingType) params.set("listingType", next.listingType);
    if (next.district) params.set("district", next.district);
    if (next.sort && next.sort !== "recent") params.set("sort", next.sort);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const set = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key === "q") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => apply(next), 350);
    } else {
      apply(next);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearAll = () => {
    setFilters(emptyFilters);
    router.push(pathname);
  };

  return (
    <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm shadow-amber-900/5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <SlidersHorizontal className="h-4 w-4 text-amber-500" />
          Filter listings
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-rose-500 transition-colors hover:text-rose-600"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Input
            name="q"
            placeholder="Search title, author, keyword…"
            value={filters.q}
            onChange={(e) => set("q", e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          name="category"
          label=""
          options={BOOK_CATEGORIES.map((c) => ({ value: c, label: c }))}
          placeholder="All categories"
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
        />
        <Select
          name="condition"
          options={[
            { value: "LIKE_NEW", label: "Like new" },
            { value: "GOOD", label: "Good" },
            { value: "ACCEPTABLE", label: "Acceptable" },
          ]}
          placeholder="Any condition"
          value={filters.condition}
          onChange={(e) => set("condition", e.target.value)}
        />
        <Select
          name="listingType"
          options={[
            { value: "EXCHANGE_ONLY", label: "Swap only" },
            { value: "SELL_ONLY", label: "Sell only" },
            { value: "BOTH", label: "Swap or sell" },
          ]}
          placeholder="Swap or sell"
          value={filters.listingType}
          onChange={(e) => set("listingType", e.target.value)}
        />
        <Select
          name="sort"
          options={[
            { value: "recent", label: "Recently bumped" },
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "price_asc", label: "Price: low to high" },
            { value: "price_desc", label: "Price: high to low" },
          ]}
          value={filters.sort}
          onChange={(e) => set("sort", e.target.value)}
        />
      </div>

      {districts.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-400">Near you:</span>
          <button
            onClick={() => set("district", "")}
            className={
              filters.district === ""
                ? "rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-colors"
                : "rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-amber-300 hover:bg-amber-50"
            }
          >
            Everywhere
          </button>
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => set("district", d)}
              className={
                filters.district === d
                  ? "rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-colors"
                  : "rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-amber-300 hover:bg-amber-50"
              }
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
