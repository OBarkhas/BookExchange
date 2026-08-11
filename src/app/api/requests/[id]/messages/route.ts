import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

const isParticipant = (
  request: { senderId: string; receiverId: string },
  userId: string,
) => request.senderId === userId || request.receiverId === userId;

const isHiddenFor = (
  request: {
    senderId: string;
    receiverId: string;
    hiddenBySender: boolean;
    hiddenByReceiver: boolean;
  },
  userId: string,
) =>
  (request.senderId === userId && request.hiddenBySender) ||
  (request.receiverId === userId && request.hiddenByReceiver);

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/requests/[id]/messages">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const request = await db.exchangeRequest.findUnique({
      where: { id },
      select: {
        senderId: true,
        receiverId: true,
        hiddenBySender: true,
        hiddenByReceiver: true,
      },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (!isParticipant(request, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isHiddenFor(request, user.id)) {
      return NextResponse.json(
        { error: "Conversation deleted" },
        { status: 404 },
      );
    }

    const messages = await db.message.findMany({
      where: { requestId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[api/requests/:id/messages] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: RouteContext<"/api/requests/[id]/messages">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const request = await db.exchangeRequest.findUnique({
      where: { id },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        hiddenBySender: true,
        hiddenByReceiver: true,
        book: { select: { title: true } },
      },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (!isParticipant(request, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isHiddenFor(request, user.id)) {
      return NextResponse.json(
        { error: "Conversation deleted" },
        { status: 404 },
      );
    }

    const body = await req.json().catch(() => null);
    const content =
      body && typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }

    const counterpartId =
      user.id === request.senderId ? request.receiverId : request.senderId;

    const [message] = await Promise.all([
      db.message.create({
        data: {
          content: content.slice(0, 2000),
          requestId: id,
          senderId: user.id,
        },
        include: {
          sender: { select: { id: true, name: true, imageUrl: true } },
        },
      }),
      createNotification(
        counterpartId,
        "New message 💬",
        `${user.name ?? "Someone"} sent you a message about "${request.book.title}".`,
        `/messages/${request.id}`,
      ),
    ]);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[api/requests/:id/messages] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
