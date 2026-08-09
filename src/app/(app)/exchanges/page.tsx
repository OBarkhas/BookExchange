import type { ComponentProps } from "react";
import Link from "next/link";
import { Repeat, Inbox, Library } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import RequestCard from "@/components/requests/RequestCard";
import ListingManageCard from "@/components/books/ListingManageCard";
import AnimatedTabs from "@/components/ui/AnimatedTabs";
import { EXCHANGE_LOCKED_STATUSES } from "@/lib/categories";
import type { Book, RequestStatus } from "@/generated/prisma/client";

type ExchangeTab = "sent" | "received" | "listings";

const requestIncludes = {
  book: {
    select: {
      id: true,
      title: true,
      author: true,
      images: true,
      price: true,
    },
  },
  sender: {
    select: { id: true, name: true, imageUrl: true, district: true },
  },
  receiver: {
    select: { id: true, name: true, imageUrl: true, district: true },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { content: true, createdAt: true, senderId: true },
  },
  _count: { select: { messages: true } },
};

export default async function ExchangesPage({
  searchParams,
}: PageProps<"/exchanges">) {
  const sp = await searchParams;
  const rawTab = sp.tab;
  const tab: ExchangeTab =
    rawTab === "received" || rawTab === "listings" ? rawTab : "sent";
  const user = await getDbUser();

  const [sent, received, listings] = await Promise.all([
    db.exchangeRequest.findMany({
      where: { senderId: user!.id },
      orderBy: { createdAt: "desc" },
      include: requestIncludes,
    }),
    db.exchangeRequest.findMany({
      where: { receiverId: user!.id },
      orderBy: { createdAt: "desc" },
      include: requestIncludes,
    }),
    db.book.findMany({
      where: { userId: user!.id, expiresAt: { gt: new Date() } },
      orderBy: { lastBumpedAt: "desc" },
      include: {
        requests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Exchanges & Requests"
        subtitle="Incoming requests, outgoing offers and your active listings — all in one place."
      />

      <AnimatedTabs
        layoutId="exchanges-tabs"
        basePath="/exchanges"
        defaultTab="sent"
        active={tab}
        items={[
          {
            value: "sent",
            label: "Sent",
            iconName: "sent",
            count: sent.length,
          },
          {
            value: "received",
            label: "Received",
            iconName: "received",
            count: received.length,
          },
          {
            value: "listings",
            label: "My listings",
            iconName: "listings",
            count: listings.length,
          },
        ]}
      />

      <div className="mt-6">
        {tab === "sent" && (
          <RequestList
            key="sent"
            requests={sent}
            myId={user!.id}
            emptyIcon={Repeat}
            emptyTitle="No requests sent yet"
            emptyDescription="Browse the market and request a book to start your first swap."
          />
        )}
        {tab === "received" && (
          <RequestList
            key="received"
            requests={received}
            myId={user!.id}
            emptyIcon={Inbox}
            emptyTitle="No requests received yet"
            emptyDescription="When someone requests one of your books, it will appear here."
          />
        )}
        {tab === "listings" && (
          <ListingsTab listings={listings} />
        )}
      </div>
    </div>
  );
}


type RequestCardData = ComponentProps<typeof RequestCard>["request"];

function RequestList({
  requests,
  myId,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  requests: RequestCardData[];
  myId: string;
  emptyIcon: typeof Repeat;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link
            href="/browse"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
          >
            Browse books
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} myId={myId} />
      ))}
    </div>
  );
}

type ManageListing = Book & { requests: { status: RequestStatus }[] };

function ListingsTab({ listings }: { listings: ManageListing[] }) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="No listings yet"
        description="Books you list for swap or sale show up here — with one-tap edit, sell and delete controls."
        action={
          <Link
            href="/listings/new"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
          >
            List a book
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((book) => {
        const latestStatus = book.requests[0]?.status;
        const hasActiveExchange =
          !!latestStatus && EXCHANGE_LOCKED_STATUSES.includes(latestStatus);
        return (
          <ListingManageCard
            key={book.id}
            book={book}
            hasActiveExchange={hasActiveExchange}
            canManage
            layout="row"
          />
        );
      })}
    </div>
  );
}
