"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";
import { LISTING_DURATION_DAYS } from "@/lib/utils";

export async function bumpListing(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const book = await db.book.findUnique({ where: { id } });
  if (!book) throw new Error("Listing not found");
  if (book.userId !== user.id) throw new Error("Forbidden");

  await db.book.update({
    where: { id },
    data: {
      lastBumpedAt: new Date(),
      expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 86_400_000),
    },
  });

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/exchanges");
  revalidatePath(`/listings/${id}`);
}

export async function toggleListingAvailability(id: string, isAvailable: boolean) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const book = await db.book.findUnique({ where: { id } });
  if (!book) throw new Error("Listing not found");
  if (book.userId !== user.id) throw new Error("Forbidden");

  await db.book.update({ where: { id }, data: { isAvailable } });

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/exchanges");
  revalidatePath(`/listings/${id}`);
  revalidatePath(`/profile/${user.id}`);
}

export async function deleteListing(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const book = await db.book.findUnique({ where: { id } });
  if (!book) throw new Error("Listing not found");
  if (book.userId !== user.id) throw new Error("Forbidden");

  await db.book.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/exchanges");
  revalidatePath(`/profile/${user.id}`);
}

export async function requestBook(id: string, message: string, offeredBook: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const book = await db.book.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!book) throw new Error("Listing not found");
  if (book.userId === user.id) throw new Error("You can't request your own book");
  if (!book.isAvailable || book.expiresAt <= new Date()) {
    throw new Error("This listing is no longer available");
  }

  const existing = await db.exchangeRequest.findFirst({
    where: { bookId: book.id, senderId: user.id, status: "PENDING" },
  });
  if (existing) throw new Error("You already have a pending request for this book");

  const trimmedMessage = message.trim().slice(0, 500) || null;
  const trimmedOffered = offeredBook.trim().slice(0, 200) || null;

  const request = await db.exchangeRequest.create({
    data: {
      bookId: book.id,
      senderId: user.id,
      receiverId: book.userId,
      message: trimmedMessage,
      offeredBook: trimmedOffered,
    },
  });

  await createNotification(
    book.userId,
    "New swap request! 📬",
    `${user.name ?? "Someone"} wants to get "${book.title}".`,
    "/exchanges",
  );

  revalidatePath("/");
  revalidatePath("/exchanges");
  revalidatePath("/messages");
  revalidatePath(`/listings/${id}`);
  return { request };
}
