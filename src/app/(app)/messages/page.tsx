import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ConversationRow from "@/components/requests/ConversationRow";

export default async function MessagesPage() {
  const user = await getDbUser();

  const conversations = await db.exchangeRequest.findMany({
    where: {
      OR: [
        { senderId: user!.id, hiddenBySender: false },
        { receiverId: user!.id, hiddenByReceiver: false },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      book: { select: { title: true } },
      sender: { select: { id: true, name: true, imageUrl: true } },
      receiver: { select: { id: true, name: true, imageUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
  });

  const sorted = [...conversations].sort((a, b) => {
    const aDate = a.messages[0]?.createdAt ?? a.createdAt;
    const bDate = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Messages"
        subtitle="Private chats with your swap & sale partners."
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Request a book from the marketplace to unlock a private chat with its owner."
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
        <div className="space-y-3">
          {sorted.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              myId={user!.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
