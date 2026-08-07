import Link from "next/link";
import { Repeat, Inbox, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import RequestCard from "@/components/requests/RequestCard";
import { cn } from "@/lib/utils";

export default async function ExchangesPage({
  searchParams,
}: PageProps<"/exchanges">) {
  const sp = await searchParams;
  const tab = sp.tab === "received" ? "received" : "sent";
  const user = await getDbUser();

  const sent = await db.exchangeRequest.findMany({
    where: { senderId: user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          images: true,
          price: true,
        },
      },
      sender: { select: { id: true, name: true, imageUrl: true, district: true } },
      receiver: { select: { id: true, name: true, imageUrl: true, district: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const received = await db.exchangeRequest.findMany({
    where: { receiverId: user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          images: true,
          price: true,
        },
      },
      sender: { select: { id: true, name: true, imageUrl: true, district: true } },
      receiver: { select: { id: true, name: true, imageUrl: true, district: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const lists = { sent, received };
  const active = lists[tab];

  return (
    <div>
      <PageHeader
        title="My Exchanges"
        subtitle="Track your swaps, sales and meetups in one place."
      />

      <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-amber-100 bg-white/80 p-1 shadow-sm">
        <TabLink
          href="/exchanges?tab=sent"
          active={tab === "sent"}
          label="Sent"
          count={sent.length}
          icon={ArrowUpRight}
        />
        <TabLink
          href="/exchanges?tab=received"
          active={tab === "received"}
          label="Received"
          count={received.length}
          icon={ArrowDownLeft}
        />
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={tab === "sent" ? Repeat : Inbox}
          title={
            tab === "sent"
              ? "No requests sent yet"
              : "No requests received yet"
          }
          description={
            tab === "sent"
              ? "Browse the market and request a book to start your first swap."
              : "When someone requests one of your books, it will appear here."
          }
          action={
            <Link
              href="/browse"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
            >
              Browse books
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {active.map((request) => (
            <RequestCard key={request.id} request={request} myId={user!.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  icon: typeof ArrowUpRight;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm"
          : "text-stone-600 hover:bg-amber-50 hover:text-stone-900",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
          active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
