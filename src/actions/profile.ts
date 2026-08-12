"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";
import { checkAndAwardBadges } from "@/lib/badges";

const MAX_BIO_LENGTH = 300;

export async function updateBio(bio: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  if (bio.trim().length > MAX_BIO_LENGTH) {
    throw new Error(`Bio must be ${MAX_BIO_LENGTH} characters or fewer`);
  }

  await db.user.update({
    where: { id: user.id },
    data: { bio: bio.trim() || null },
  });

  revalidatePath("/");
  revalidatePath(`/profile/${user.id}`);
}

export async function submitReview(
  receiverId: string,
  rating: number,
  comment: string,
) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  if (!receiverId) throw new Error("receiverId is required");
  if (receiverId === user.id) throw new Error("You can't review yourself");
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const receiver = await db.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new Error("User not found");

  const rounded = Math.round(rating);
  const trimmedComment = comment.trim() ? comment.trim().slice(0, 500) : null;

  const review = await db.review.upsert({
    where: {
      reviewerId_receiverId: { reviewerId: user.id, receiverId },
    },
    create: {
      reviewerId: user.id,
      receiverId,
      rating: rounded,
      comment: trimmedComment,
    },
    update: { rating: rounded, comment: trimmedComment },
  });

  await Promise.all([
    checkAndAwardBadges(receiverId),
    createNotification(
      receiverId,
      "You received a review ⭐",
      `${user.name ?? "Someone"} rated you ${rounded}/5.`,
      `/profile/${receiverId}`,
    ),
  ]);

  revalidatePath("/");
  revalidatePath(`/profile/${receiverId}`);
  return { review };
}
