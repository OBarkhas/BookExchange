"use client";

import { Plus, Search, ArrowLeftRight } from "lucide-react";
import { showToast } from "@/components/ui/ToastContainer";

const actions = [
  {
    icon: Plus,
    title: "List a Book",
    desc: "Sell or swap a book you've already read",
    toast: "Book listing is coming soon!",
  },
  {
    icon: Search,
    title: "Browse Books",
    desc: "Discover great reads available near you",
    toast: "Book browsing is coming soon!",
  },
  {
    icon: ArrowLeftRight,
    title: "My Exchanges",
    desc: "Track swaps, sales and meetups",
    toast: "Exchanges are coming soon!",
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.title}
          onClick={() => showToast(action.toast, "info")}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-amber-100 bg-white/80 p-6 text-left shadow-sm shadow-amber-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600 ring-1 ring-amber-100 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 group-hover:text-white group-hover:ring-amber-400">
            <action.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">{action.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              {action.desc}
            </p>
          </div>
          <span className="text-sm font-medium text-amber-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Coming soon →
          </span>
        </button>
      ))}
    </div>
  );
}
