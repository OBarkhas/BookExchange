import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";
import { checkAndAwardBadges } from "@/lib/badges";
import type { RequestStatus } from "@/generated/prisma/client";

const isParticipant = (
  request: { senderId: string; receiverId: string },
  userId: string,
) => request.senderId === userId || request.receiverId === userId;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/requests/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const request = await db.exchangeRequest.findUnique({
      where: { id },
      include: {
        book: true,
        sender: {
          select: { id: true, name: true, imageUrl: true, district: true },
        },
        receiver: {
          select: { id: true, name: true, imageUrl: true, district: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (!isParticipant(request, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hiddenForMe =
      (request.senderId === user.id && request.hiddenBySender) ||
      (request.receiverId === user.id && request.hiddenByReceiver);
    if (hiddenForMe) {
      return NextResponse.json(
        { error: "Conversation deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("[api/requests/:id] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/requests/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const request = await db.exchangeRequest.findUnique({
      where: { id },
      include: {
        book: { select: { id: true, title: true, userId: true } },
      },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (!isParticipant(request, user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const status = body?.status as RequestStatus | undefined;
    if (!status || !["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 },
      );
    }

    const isOwner = request.receiverId === user.id;
    const isSender = request.senderId === user.id;

    if (request.status === "PENDING") {
      if (status === "ACCEPTED" && !isOwner) {
        return NextResponse.json(
          { error: "Only the listing owner can accept requests" },
          { status: 403 },
        );
      }
      if (status === "COMPLETED") {
        return NextResponse.json(
          { error: "The request must be accepted before it can be completed" },
          { status: 400 },
        );
      }
    } else if (request.status === "ACCEPTED") {
      if (status !== "COMPLETED") {
        return NextResponse.json(
          { error: "An accepted request can only be marked completed" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "This request can no longer be changed" },
        { status: 400 },
      );
    }

    let updated;
    if (status === "COMPLETED") {
      const result = await db.exchangeRequest.updateMany({
        where: { id, status: "ACCEPTED" },
        data: { status: "COMPLETED" },
      });
      if (result.count === 0) {
        return NextResponse.json(
          { error: "This request is already completed" },
          { status: 409 },
        );
      }
      updated = await db.exchangeRequest.findUniqueOrThrow({ where: { id } });
    } else {
      updated = await db.exchangeRequest.update({
        where: { id },
        data: { status },
      });
    }

    const counterpartId =
      user.id === request.senderId ? request.receiverId : request.senderId;

    if (status === "ACCEPTED") {
      await createNotification(
        counterpartId,
        "Request accepted! 🎉",
        `${user.name ?? "The owner"} accepted your request for "${request.book.title}". Start chatting to arrange the swap.`,
        `/messages/${request.id}`,
      );
    } else if (status === "REJECTED") {
      const verb = isSender ? "cancelled" : "declined";
      await createNotification(
        counterpartId,
        "Request update",
        `${user.name ?? "Someone"} ${verb} the request for "${request.book.title}".`,
        "/exchanges",
      );
    } else if (status === "COMPLETED") {
      await db.book.update({
        where: { id: request.book.id },
        data: { isAvailable: false },
      });
      await createNotification(
        counterpartId,
        "Exchange completed! 🎉",
        `You and ${user.name ?? "your partner"} completed the swap for "${request.book.title}". Please leave a review!`,
        `/profile/${counterpartId}`,
      );
      await Promise.all([
        checkAndAwardBadges(request.senderId),
        checkAndAwardBadges(request.receiverId),
      ]);
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("[api/requests/:id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
