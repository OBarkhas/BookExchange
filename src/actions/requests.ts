"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";
import { checkAndAwardBadges } from "@/lib/badges";
import type { RequestStatus } from "@/generated/prisma/client";

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const request = await db.exchangeRequest.findUnique({
    where: { id: requestId },
    include: { book: { select: { id: true, title: true, userId: true } } },
  });
  if (!request) throw new Error("Request not found");

  const isParticipant =
    request.senderId === user.id || request.receiverId === user.id;
  if (!isParticipant) throw new Error("Forbidden");
  if (!["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"].includes(status)) {
    throw new Error("Invalid status");
  }

  const isOwner = request.receiverId === user.id;
  const isSender = request.senderId === user.id;

  if (request.status === "PENDING") {
    if (status === "ACCEPTED" && !isOwner) {
      throw new Error("Only the listing owner can accept requests");
    }
    if (status === "COMPLETED") {
      throw new Error("The request must be accepted before it can be completed");
    }
  } else if (request.status === "ACCEPTED") {
    if (status !== "COMPLETED") {
      throw new Error("An accepted request can only be marked completed");
    }
  } else {
    throw new Error("This request can no longer be changed");
  }

  if (status === "COMPLETED") {
    const result = await db.exchangeRequest.updateMany({
      where: { id: requestId, status: "ACCEPTED" },
      data: { status: "COMPLETED" },
    });
    if (result.count === 0) {
      throw new Error("This request is already completed");
    }
  } else {
    await db.exchangeRequest.update({
      where: { id: requestId },
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
      `/messages/${requestId}`,
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

  revalidatePath("/");
  revalidatePath("/exchanges");
  revalidatePath("/messages");
  revalidatePath(`/messages/${requestId}`);
  revalidatePath(`/listings/${request.book.id}`);
}

export async function deleteConversation(requestId: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const request = await db.exchangeRequest.findUnique({
    where: { id: requestId },
    select: { senderId: true, receiverId: true },
  });
  if (!request) throw new Error("Conversation not found");

  const isSender = request.senderId === user.id;
  const isReceiver = request.receiverId === user.id;
  if (!isSender && !isReceiver) throw new Error("Forbidden");

  await db.exchangeRequest.update({
    where: { id: requestId },
    data: isSender ? { hiddenBySender: true } : { hiddenByReceiver: true },
  });

  revalidatePath("/messages");
  revalidatePath("/exchanges");
}
